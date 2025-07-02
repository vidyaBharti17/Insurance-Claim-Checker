import React from 'react';

function Dashboard() {
  const history = ['File1.pdf - Eligible', 'File2.pdf - Not Eligible']; // Simulated history

  return (
    <div className="App">
      <h1>Upload History</h1>
      <ul>
        {history.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
      <a href="/">Back to Upload</a>
    </div>
  );
}

export default Dashboard;