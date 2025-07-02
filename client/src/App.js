import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import Dashboard from './Dashboard';

function App() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/login', new URLSearchParams({
        email,
        password,
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      setIsLoggedIn(true);
      setMessage('Logged in successfully');
    } catch (error) {
      setMessage('Login failed: ' + (error.response?.data || error.message));
    }
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setMessage('');
    setExtractedText('');
    setEligibility('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setMessage('Please select a file!');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'eligibility_report.txt');
      document.body.appendChild(link);
      link.click();
      link.remove();
      setMessage('Report downloaded successfully');
      setExtractedText('Check report for details');
      setEligibility('Check report for details');
    } catch (error) {
      setMessage('Error uploading file: ' + (error.response?.data || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="App">
        <h1>Insurance Claim Eligibility Checker</h1>
        <form onSubmit={handleLogin}>
          <label>
            Email:
            <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <br />
          <label>
            Password:
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <br />
          <button type="submit" disabled={loading}>
            Login{loading && '...'}
          </button>
        </form>
        {message && <p className={message.includes('Error') ? 'error' : 'success'}>{message}</p>}
      </div>
    );
  }

  return (
    <div className="App">
      <h1>Insurance Claim Eligibility Checker</h1>
      <button onClick={() => setShowDashboard(!showDashboard)}>
        {showDashboard ? 'Back to Upload' : 'View Dashboard'}
      </button>
      {showDashboard ? (
        <Dashboard />
      ) : (
        <>
          <form onSubmit={handleSubmit}>
            <label>
              Upload Medical Report:
              <input type="file" onChange={handleFileChange} />
            </label>
            <br />
            <button type="submit" disabled={loading}>
              Upload{loading && '...'}
            </button>
          </form>
          {file && <p>Selected file: {file.name}</p>}
          {message && (
            <p className={message.includes('Error') ? 'error' : 'success'}>{message}</p>
          )}
          {extractedText && (
            <div>
              <h3>Extracted Text:</h3>
              <pre>{extractedText}</pre>
            </div>
          )}
          {eligibility && (
            <div>
              <h3>Eligibility Status:</h3>
              <p>{eligibility}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;