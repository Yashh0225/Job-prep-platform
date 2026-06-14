import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const History = () => {
  const [activeTab, setActiveTab] = useState('analyses');
  const [analyses, setAnalyses] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const toast = useToast();

  useEffect(() => {
    Promise.all([
      api.get('/analysis/sessions').catch(() => ({ data: { sessions: [] } })),
      api.get('/roadmap/list').catch(() => ({ data: { roadmaps: [] } })),
      api.get('/interview/history/list').catch(() => ({ data: { interviews: [] } })),
    ]).then(([aRes, rRes, iRes]) => {
      setAnalyses(aRes.data.sessions || []);
      setRoadmaps(rRes.data.roadmaps || []);
      setInterviews(iRes.data.interviews || []);
      setLoading(false);
    });
  }, []);

  const handleDelete = async (type, id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      if (type === 'analysis') {
        await api.delete(`/analysis/sessions/${id}`);
        setAnalyses(prev => prev.filter(a => a._id !== id));
      } else if (type === 'roadmap') {
        await api.delete(`/roadmap/${id}`);
        setRoadmaps(prev => prev.filter(r => r._id !== id));
      } else {
        await api.delete(`/interview/${id}`);
        setInterviews(prev => prev.filter(i => i._id !== id));
      }
      toast.success('Deleted successfully');
    } catch { toast.error('Failed to delete'); }
  };

  const filterBySearch = (items, fields) => {
    if (!search) return items;
    const term = search.toLowerCase();
    return items.filter(item => fields.some(f => {
      const val = f.split('.').reduce((o, k) => o?.[k], item);
      if (Array.isArray(val)) return val.some(v => v.toLowerCase().includes(term));
      return val?.toString().toLowerCase().includes(term);
    }));
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (loading) {
    return <div className="page-container"><div className="ai-loading"><div className="loading-spinner" /><p className="loading-text">Loading history...</p></div></div>;
  }

  const filteredAnalyses = filterBySearch(analyses, ['jobTitle', 'company']);
  const filteredRoadmaps = filterBySearch(roadmaps, ['jobTitle', 'company']);
  const filteredInterviews = filterBySearch(interviews, ['jobTitle', 'companies']);

  return (
    <div className="page-container">
      <div className="page-header animate-in">
        <h1>History</h1>
        <p>All your past analyses, roadmaps, and mock interviews</p>
      </div>

      {/* Search + Tabs */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input className="input-field" placeholder="🔍 Search by title, company..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: '200px' }} />
        <div className="tabs">
          {[
            { key: 'analyses', label: `🔍 Analyses (${analyses.length})` },
            { key: 'roadmaps', label: `🗺️ Roadmaps (${roadmaps.length})` },
            { key: 'interviews', label: `🎤 Interviews (${interviews.length})` },
          ].map(t => (
            <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Analyses */}
      {activeTab === 'analyses' && filteredAnalyses.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredAnalyses.map(a => (
              <Link key={a._id} to={`/analyze/${a._id}`} className="glass-card" style={{ padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: '600' }}>{a.jobTitle}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{a.company || 'No company'} · {formatDate(a.createdAt)}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={`badge badge-${a.status === 'completed' ? 'success' : 'warning'}`}>{a.status}</span>
                  <button onClick={(e) => { e.preventDefault(); handleDelete('analysis', a._id); }} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}>🗑</button>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Roadmaps */}
      {activeTab === 'roadmaps' && filteredRoadmaps.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredRoadmaps.map(r => (
              <Link key={r._id} to={`/roadmap/${r._id}`} className="glass-card" style={{ padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: '600' }}>{r.jobTitle}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.company || 'General'} · {r.daysAvailable} days · {formatDate(r.createdAt)}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={`badge badge-${r.status === 'completed' ? 'success' : 'warning'}`}>{r.status}</span>
                  <button onClick={(e) => { e.preventDefault(); handleDelete('roadmap', r._id); }} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}>🗑</button>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Interviews */}
      {activeTab === 'interviews' && filteredInterviews.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredInterviews.map(i => (
              <Link key={i._id} to={i.status === 'completed' ? `/mock-result/${i._id}` : `/mock-interview/${i._id}`}
                className="glass-card" style={{ padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: '600' }}>{i.jobTitle}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {i.companies?.join(', ') || 'General'} · {i.experience} · {i.interviewParts?.join(', ')} · {formatDate(i.createdAt)}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {i.evaluation?.overallScore != null ? (
                    <span className="badge badge-accent">{i.evaluation.overallScore}%</span>
                  ) : (
                    <span className={`badge badge-${i.status === 'in_progress' ? 'warning' : 'info'}`}>{i.status?.replace('_', ' ')}</span>
                  )}
                  <button onClick={(e) => { e.preventDefault(); handleDelete('interview', i._id); }} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}>🗑</button>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {((activeTab === 'analyses' && !filteredAnalyses.length) || 
        (activeTab === 'roadmaps' && !filteredRoadmaps.length) || 
        (activeTab === 'interviews' && !filteredInterviews.length)) && (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <p style={{ fontSize: '48px', marginBottom: '16px' }}>📋</p>
          <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No history found</p>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
            {activeTab === 'analyses' && 'Start a resume analysis to see it here!'}
            {activeTab === 'roadmaps' && 'Create a roadmap to see it here!'}
            {activeTab === 'interviews' && 'Take a mock interview to see it here!'}
          </p>
          <Link to={activeTab === 'analyses' ? '/analyze' : activeTab === 'roadmaps' ? '/roadmap' : '/mock-setup'} className="btn btn-primary">
            {activeTab === 'analyses' && 'Analyze Resume'}
            {activeTab === 'roadmaps' && 'Create Roadmap'}
            {activeTab === 'interviews' && 'Start Mock Interview'}
          </Link>
        </div>
      )}
    </div>
  );
};

export default History;
