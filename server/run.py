from flask import Flask, request, redirect, url_for, jsonify
from flask_cors import CORS
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
import os
import pytesseract
from PIL import Image
from pdf2image import convert_from_path
import spacy
import config
import logging
import smtplib
from email.mime.text import MIMEText

# Set up logging
logging.basicConfig(filename='app.log', level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
CORS(app)
app.secret_key = os.environ.get('SECRET_KEY', 'your_secret_key')  # Use environment variable

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Load spaCy model
try:
    nlp = spacy.load('en_core_web_sm')
except OSError:
    import subprocess
    subprocess.run(['python', '-m', 'spacy', 'download', 'en_core_web_sm'])
    nlp = spacy.load('en_core_web_sm')

# Flask-Login setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Dummy user class
class User(UserMixin):
    pass

users = {'user@example.com': {'password': 'password123', 'email': 'user@example.com'}}  # Add user email

@login_manager.user_loader
def load_user(user_id):
    if user_id in users:
        user = User()
        user.id = user_id
        return user
    return None

def send_email(to_email, subject, body):
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = 'your-email@gmail.com'  # Replace with your Gmail
    msg['To'] = to_email

    with smtplib.SMTP('smtp.gmail.com', 587) as server:
        server.starttls()
        server.login('your-email@gmail.com', 'your-app-password')  # Use App Password from Google Account
        server.send_message(msg)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        if email in users and users[email]['password'] == password:
            user = User()
            user.id = email
            login_user(user)
            return redirect(url_for('upload_page'))
    return '''
    <form method="post">
        <label>Email: <input type="text" name="email"></label>
        <label>Password: <input type="password" name="password"></label>
        <input type="submit" value="Login">
    </form>
    '''

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/')
def hello():
    return redirect(url_for('login'))

@app.route('/upload', methods=['GET', 'POST'])
@login_required
def upload_file():
    if request.method == 'POST':
        if 'file' not in request.files:
            logging.error('No file part in request')
            return jsonify({'error': 'No file part'}), 400
        file = request.files['file']
        if file.filename == '':
            logging.error('No selected file')
            return jsonify({'error': 'No selected file'}), 400
        if file:
            filename = file.filename
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            try:
                file.save(file_path)
                logging.info(f'File saved: {filename}')

                if filename.lower().endswith('.pdf'):
                    images = convert_from_path(file_path)
                    text = ''
                    for i, img in enumerate(images):
                        img.save(os.path.join(app.config['UPLOAD_FOLDER'], f'page_{i}.jpg'), 'JPEG')
                        text += pytesseract.image_to_string(img)
                else:
                    img = Image.open(file_path)
                    text = pytesseract.image_to_string(img)

                # Process text with spaCy
                doc = nlp(text.lower())
                age = None
                conditions = []
                for ent in doc.ents:
                    if ent.label_ == 'AGE' or 'years' in ent.text.lower():
                        age = ent.text
                    if ent.label_ in ['DISEASE', 'CONDITION'] or any(cond in ent.text.lower() for cond in config.ELIGIBILITY_RULES['approved_conditions']):
                        conditions.append(ent.text)

                condition_found = any(cond.lower() in text.lower() for cond in config.ELIGIBILITY_RULES['approved_conditions'])
                eligibility = 'Eligible' if (age and int(age.split()[0]) >= config.ELIGIBILITY_RULES['min_age'] and condition_found) else 'Not Eligible'
                logging.info(f'Processed {filename} - Eligibility: {eligibility}')

                # Send email notification
                user_email = current_user.id
                email_body = f'Subject: Eligibility Result\n\nEligibility Status: {eligibility}\nExtracted Text: {text}\nConditions Found: {", ".join(conditions)}'
                send_email(user_email, 'Eligibility Result', email_body)

                return jsonify({
                  'message': 'File processed successfully',
                  'extractedText': text,
                  'eligibility': eligibility,
                  'conditions': conditions
                }), 200
            except Exception as e:
                logging.error(f'Error processing {filename}: {str(e)}')
                return jsonify({'error': f'Error extracting text: {str(e)}'}), 500

    return '''
    <h1>Upload File</h1>
    <form method="post" enctype="multipart/form-data">
        <input type="file" name="file">
        <input type="submit" value="Upload">
    </form>
    <a href="/logout">Logout</a>
    '''

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)