'use client';

import { useState, useEffect } from 'react';

interface Stats {
  totalMatches: number;
  upcomingMatches: number;
  completedMatches: number;
  hoursPlayed: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalMatches: 0,
    upcomingMatches: 0,
    completedMatches: 0,
    hoursPlayed: '0.0'
  });
  
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Error fetching stats:', err));
  }, []);

  return (
    <div className="container">
      <header className="header">
        <h1>Capybara`s Dashboard</h1>
        <button className="new-match-btn">
          + New Match
        </button>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Matches</h3>
          <div className="value">{stats.totalMatches}</div>
        </div>
        <div className="stat-card">
          <h3>Upcoming</h3>
          <div className="value">{stats.upcomingMatches}</div>
        </div>
        <div className="stat-card">
          <h3>Completed Matches</h3>
          <div className="value">{stats.completedMatches}</div>
        </div>
        <div className="stat-card">
          <h3>Hours Played</h3>
          <div className="value">{stats.hoursPlayed}</div>
        </div>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="Search matches by title or location..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="tabs">
        <div
          className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming Matches
        </div>
        <div
          className={`tab ${activeTab === 'past' ? 'active' : ''}`}
          onClick={() => setActiveTab('past')}
        >
          Past Matches
        </div>
      </div>

      <div className="matches-container">
        {activeTab === 'upcoming' ? 'No upcoming matches found' : 'No past matches found'}
      </div>
    </div>
  );
}
