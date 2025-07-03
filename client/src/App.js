import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Dashboard from './Dashboard';

function App() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    let timer;
    if (loading) {
      let progressValue = 0;
      timer = setInterval(() => {
        progressValue += 10;
        setProgress(progressValue > 100 ? 100 : progressValue);
        if (progressValue >= 100) clearInterval(timer);
      }, 200);
      setMessage('Processing...');
    } else {
      setProgress(0);
    }
    return () => clearInterval(timer);
  }, [loading]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
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
      });
      setMessage('File processed successfully');
      setExtractedText(response.data.extractedText || '');
      setEligibility(response.data.eligibility || '');
    } catch (error) {
      setMessage('Error uploading file: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setMessage('');
    setExtractedText('');
    setEligibility('');
  };

  if (!isLoggedIn) {
    return (
      <div className="App">
        <h1>Insurance Claim Eligibility Checker</h1>
        <div className="form-container">
          <label>
            Email:
            <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Password:
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <button onClick={handleLogin} disabled={loading}>
            Login{loading && '...'}
          </button>
        </div>
        {message && <p className={message.includes('Error') ? 'error' : 'success'}>{message}</p>}
        {loading && <div className="progress-bar"><div className="progress" style={{ width: `${progress}%` }} /></div>}
      </div>
    );
  }

  return (
    <div className="App">
      <h1>Insurance Claim Eligibility Checker</h1>
      <button className="nav-button" onClick={() => setShowDashboard(!showDashboard)}>
        {showDashboard ? 'Back to Upload' : 'View Dashboard'}
      </button>
      {showDashboard ? (
        <Dashboard />
      ) : (
        <div className="form-container">
          <label>
            Upload Medical Report:
            <input type="file" onChange={handleFileChange} />
          </label>
          <button onClick={handleSubmit} disabled={loading}>
            Upload{loading && '...'}
          </button>
          {file && <p>Selected file: {file.name}</p>}
          {message && <p className={message.includes('Error') ? 'error' : 'success'}>{message}</p>}
          {loading && <div className="progress-bar"><div className="progress" style={{ width: `${progress}%` }} /></div>}
          {(extractedText || eligibility) && (
            <div className={`result-section ${isCollapsed ? 'collapsed' : ''}`}>
              <h3 onClick={() => setIsCollapsed(!isCollapsed)}>Results {isCollapsed ? '+' : '-'}</h3>
              {!isCollapsed && (
                <>
                  {extractedText && (
                    <>
                      <h3>Extracted Text:</h3>
                      <pre>{extractedText}</pre>
                    </>
                  )}
                  {eligibility && (
                    <>
                      <h3>Eligibility Status:</h3>
                      <p className={`eligibility-status ${eligibility === 'Not Eligible' ? 'not-eligible' : ''}`}>
                        {eligibility}
                      </p>
                    </>
                  )}
                  <button className="reset-button" onClick={handleReset}>Reset</button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;