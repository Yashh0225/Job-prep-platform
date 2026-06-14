import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Import the tools to embed them directly
import ResumeAnalyzer from './ResumeAnalyzer';
import RoadmapGenerator from './RoadmapGenerator';
import MockSetup from './MockSetup';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ analyses: 0, roadmaps: 0, interviews: 0, avgScore: 0 });
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tab state for switching between overview and tools
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    Promise.all([
      api.get('/analysis/sessions').catch(() => ({ data: { sessions: [] } })),
      api.get('/roadmap/list').catch(() => ({ data: { roadmaps: [] } })),
      api.get('/interview/history/list').catch(() => ({ data: { interviews: [] } })),
    ]).then(([aRes, rRes, iRes]) => {
      const analyses = aRes.data.sessions || [];
      const roadmaps = rRes.data.roadmaps || [];
      const interviews = iRes.data.interviews || [];
      const completedInterviews = interviews.filter(i => i.status === 'completed');
      const avgScore = completedInterviews.length
        ? Math.round(completedInterviews.reduce((sum, i) => sum + (i.evaluation?.overallScore || 0), 0) / completedInterviews.length)
        : 0;

      setStats({ analyses: analyses.length, roadmaps: roadmaps.length, interviews: interviews.length, avgScore });
      setRecentAnalyses(analyses.slice(0, 3));
      setRecentInterviews(interviews.slice(0, 3));
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="ai-loading">
        <div className="loading-spinner" />
        <p className="loading-text">Loading dashboard...</p>
      </div>
    );
  }

  const statCards = [
    { icon: '🔍', label: 'Analyses', value: stats.analyses, color: '#6366f1' },
    { icon: '🗺️', label: 'Roadmaps', value: stats.roadmaps, color: '#a855f7' },
    { icon: '🎤', label: 'Interviews', value: stats.interviews, color: '#06b6d4' },
    { icon: '⭐', label: 'Avg Score', value: stats.avgScore || '—', color: '#f59e0b' },
  ];

  return (
    <div style={{ padding: '40px' }}>
      <div className="page-header animate-in" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p>Here's an overview of your preparation progress</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="tabs" style={{ marginBottom: 0 }}>
          {[
            { key: 'overview', label: '📊 Overview' },
            { key: 'analyze', label: '🔍 Analyze Resume' },
            { key: 'roadmap', label: '🗺️ Roadmap' },
            { key: 'mock', label: '🎤 Mock Interview' },
          ].map(t => (
            <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="animate-in">
          {/* Stat Cards */}
          <div className="cards-grid" style={{ marginBottom: '40px' }}>
            {statCards.map((s, i) => (
              <div key={i} className="glass-card stat-card animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="stat-card-icon" style={{ background: `${s.color}20`, color: s.color }}>{s.icon}</div>
                <div className="stat-card-value">{s.value}</div>
                <div className="stat-card-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Quick Actions that auto-switch tabs instead of linking away */}
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Quick Start</h2>
          <div className="cards-grid" style={{ marginBottom: '40px' }}>
            {[
              { tab: 'analyze', icon: '🔍', title: 'Analyze Resume', desc: 'Upload resume & JD for skill gap analysis' },
              { tab: 'roadmap', icon: '🗺️', title: 'Generate Roadmap', desc: 'Create a personalized study plan' },
              { tab: 'mock', icon: '🎤', title: 'Mock Interview', desc: 'Start a realistic mock interview' },
            ].map((a, i) => (
              <div key={i} className="glass-card" style={{
                padding: '24px', display: 'flex', gap: '16px', alignItems: 'center', cursor: 'pointer',
                animation: `fadeIn 0.4s ease ${0.3 + i * 0.1}s forwards`, opacity: 0,
              }} onClick={() => setActiveTab(a.tab)}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: 'var(--radius)', background: 'rgba(99,102,241,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0,
                }}>{a.icon}</div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>{a.title}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{a.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>Recent Analyses</h2>
              {recentAnalyses.length ? recentAnalyses.map((a) => (
                <div key={a._id} className="glass-card" style={{ padding: '16px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '600' }}>{a.jobTitle}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{a.company || 'No company'}</p>
                    </div>
                    <span className={`badge badge-${a.status === 'completed' ? 'success' : a.status === 'error' ? 'danger' : 'warning'}`}>
                      {a.status}
                    </span>
                  </div>
                </div>
              )) : <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No analyses yet</p>}
            </div>

            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>Recent Interviews</h2>
              {recentInterviews.length ? recentInterviews.map((i) => (
                <Link key={i._id} to={i.status === 'completed' ? `/mock-result/${i._id}` : `/mock-interview/${i._id}`} className="glass-card" style={{ padding: '16px', marginBottom: '8px', display: 'block', textDecoration: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '600' }}>{i.jobTitle}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{i.companies?.join(', ') || 'General'}</p>
                    </div>
                    {i.evaluation?.overallScore ? (
                      <span className="badge badge-accent">{i.evaluation.overallScore}%</span>
                    ) : (
                      <span className={`badge badge-${i.status === 'in_progress' ? 'warning' : 'info'}`}>{i.status}</span>
                    )}
                  </div>
                </Link>
              )) : <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No interviews yet</p>}
            </div>
          </div>
        </div>
      )}

      {/* Embedded Tools */}
      <div style={{ margin: '0 -40px' }}>
        {activeTab === 'analyze' && <div className="animate-in"><ResumeAnalyzer /></div>}
        {activeTab === 'roadmap' && <div className="animate-in"><RoadmapGenerator /></div>}
        {activeTab === 'mock' && <div className="animate-in"><MockSetup /></div>}
      </div>
    </div>
  );
};

export default Dashboard;
