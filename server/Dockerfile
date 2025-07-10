# Use official Python slim image
FROM python:3.9-slim

# Install system dependencies for Tesseract and Poppler
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libtesseract-dev \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy only the server directory contents
COPY server/ .

# Copy requirements and install Python dependencies
COPY server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install spaCy model
RUN python -m spacy download en_core_web_sm

# Expose port
EXPOSE 5000

# Run the app using the Procfile
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--config", "python:Procfile"]