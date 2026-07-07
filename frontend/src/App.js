import React, { useState } from 'react';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === '1234') {
      setIsLoggedIn(true);
    } else {
      alert('Wrong password');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="login-screen">
        <div className="login-box">
          <h1>🚲 Quick Step Cycles</h1>
          <p>Enter PIN to continue</p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••"
              maxLength="4"
              className="pin-input"
            />
            <button type="submit" className="login-btn">Enter</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="header">
        <div>
          <h1>Quick Step Cycles</h1>
          <p>Welcome back, Admin</p>
        </div>
        <button onClick={() => setIsLoggedIn(false)} className="logout-btn">Logout</button>
      </div>

      <div className="stats">
        <div className="stat-card">
          <span className="stat-icon">🚲</span>
          <span className="stat-number">24</span>
          <span className="stat-label">Total Bikes</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📋</span>
          <span className="stat-number">8</span>
          <span className="stat-label">Active Rentals</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">💰</span>
          <span className="stat-number">KES 12.5K</span>
          <span className="stat-label">Today</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🔧</span>
          <span className="stat-number">3</span>
          <span className="stat-label">Maintenance</span>
        </div>
      </div>

      <div className="action-cards">
        <div className="action-card">
          <span className="action-icon">➕</span>
          <h3>Start Rental</h3>
          <p>Begin a new rental</p>
        </div>
        <div className="action-card">
          <span className="action-icon">⏹️</span>
          <h3>End Rental</h3>
          <p>Complete rental</p>
        </div>
        <div className="action-card">
          <span className="action-icon">📋</span>
          <h3>Active List</h3>
          <p>View current rentals</p>
        </div>
        <div className="action-card">
          <span className="action-icon">👥</span>
          <h3>Customers</h3>
          <p>Manage customers</p>
        </div>
      </div>

      <div className="bottom-cards">
        <div className="bottom-card">
          <span className="card-icon">🚲</span>
          <h3>My Bikes</h3>
          <p>List and manage your bikes</p>
        </div>
        <div className="bottom-card">
          <span className="card-icon">💰</span>
          <h3>Costs</h3>
          <p>Track expenses</p>
        </div>
        <div className="bottom-card">
          <span className="card-icon">📊</span>
          <h3>Reports</h3>
          <p>View analytics</p>
        </div>
        <div className="bottom-card">
          <span className="card-icon">⚙️</span>
          <h3>Settings</h3>
          <p>Configure system</p>
        </div>
      </div>
    </div>
  );
}

export default App;