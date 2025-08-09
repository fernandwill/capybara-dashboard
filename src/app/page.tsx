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
    // Fetch stats from API
    fetch('http://localhost:8000/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Error fetching stats:', err));
  }, []);

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="header-title">
          <div className="avatar">🐹</div>
          Capybara's Dashboard
        </div>
        <button className="theme-toggle">
          🌙
        </button>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Matches</span>
            <svg className="stat-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="stat-card-value">{stats.totalMatches}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Upcoming Matches</span>
            <svg className="stat-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="stat-card-value">{stats.upcomingMatches}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Completed Matches</span>
            <svg className="stat-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="stat-card-value">{stats.completedMatches}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Hours Played</span>
            <svg className="stat-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="stat-card-value">{stats.hoursPlayed}</div>
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

      <div className="tabs-section">
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
        <button className="new-match-btn">
          <span>+</span>
          New Match
        </button>
      </div>

      <div className="matches-container">
        No upcoming matches found
      </div>
    </div>
  );
}