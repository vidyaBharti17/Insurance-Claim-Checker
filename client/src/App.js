import React, { useState } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (file) {
      alert('File selected: ' + file.name);
    } else {
      alert('Please select a file!');
    }
  };

  return (
    <div className="App">
      <h1>Insurance Claim Eligibility Checker</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Upload Medical Report:
          <input type="file" onChange={handleFileChange} />
        </label>
        <br />
        <button type="submit">Upload</button>
      </form>
      {file && <p>Selected file: {file.name}</p>}
    </div>
  );
}

export default App;