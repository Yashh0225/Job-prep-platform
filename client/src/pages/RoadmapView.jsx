import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const priorityColors = { critical: '#ef4444', high: '#f97316', medium: '#3b82f6', low: '#64748b' };

const RoadmapView = () => {
  const { id } = useParams();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedPhases, setExpandedPhases] = useState({});
  const toast = useToast();

  useEffect(() => {
    api.get(`/roadmap/${id}`)
      .then(res => { setRoadmap(res.data.roadmap); setLoading(false); })
      .catch(() => { toast.error('Failed to load roadmap'); setLoading(false); });
  }, [id]);

  const toggleTask = async (phaseIndex, taskIndex) => {
    const currentVal = roadmap.roadmap.phases[phaseIndex].tasks[taskIndex].completed;
    try {
      const res = await api.patch(`/roadmap/${id}/task`, { phaseIndex, taskIndex, completed: !currentVal });
      setRoadmap(res.data.roadmap);
    } catch {}
  };

  const togglePhase = (pi) => {
    setExpandedPhases(prev => ({
      ...prev,
      [pi]: !prev[pi]
    }));
  };

  if (loading) {
    return <div className="page-container"><div className="ai-loading"><div className="loading-spinner" /><p className="loading-text">Loading roadmap...</p></div></div>;
  }

  if (!roadmap) {
    return <div className="page-container"><p>Roadmap not found.</p><Link to="/roadmap" className="btn btn-secondary">← Back</Link></div>;
  }

  const r = roadmap.roadmap;
  const totalTasks = r.phases?.reduce((sum, p) => sum + (p.tasks?.length || 0), 0) || 0;
  const completedTasks = r.phases?.reduce((sum, p) => sum + (p.tasks?.filter(t => t.completed)?.length || 0), 0) || 0;
  const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="page-container">
      <div className="page-header animate-in">
        <h1>{roadmap.jobTitle} Roadmap</h1>
        <p>{roadmap.company ? `${roadmap.company} · ` : ''}{roadmap.daysAvailable} days · {completedTasks}/{totalTasks} tasks</p>
      </div>

      {/* Progress */}
      <div className="glass-card animate-in" style={{ padding: '20px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600' }}>Overall Progress</span>
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-primary)' }}>{progress}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Summary */}
      {r.summary && (
        <div className="glass-card animate-in stagger-1" style={{ padding: '20px', marginBottom: '32px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>{r.summary}</p>
        </div>
      )}

      {/* Phases */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {r.phases?.map((phase, pi) => {
          const phaseCompleted = phase.tasks?.every(t => t.completed);
          const phaseProgress = phase.tasks?.length ? Math.round((phase.tasks.filter(t => t.completed).length / phase.tasks.length) * 100) : 0;
          const isExpanded = expandedPhases[pi] === true; // collapsed by default

          return (
            <div key={pi} className="glass-card animate-in" style={{ animationDelay: `${pi * 0.1}s` }}>
              <div 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', cursor: 'pointer', borderBottom: isExpanded ? '1px solid var(--border-glass)' : 'none' }}
                onClick={() => togglePhase(pi)}
              >
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isExpanded ? '▼' : '▶'} {phaseCompleted && '✅ '}{phase.name}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '22px' }}>
                    {phase.days}{phase.focus ? ` · ${phase.focus}` : ''}
                  </p>
                </div>
                <span className={`badge badge-${phaseProgress === 100 ? 'success' : phaseProgress > 0 ? 'warning' : 'info'}`}>
                  {phaseProgress}%
                </span>
              </div>

              {isExpanded && (
                <div style={{ padding: '24px', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {phase.tasks?.map((task, ti) => (
                    <div key={ti}
                      onClick={() => toggleTask(pi, ti)}
                      style={{
                        display: 'flex', gap: '12px', padding: '14px',
                        background: task.completed ? 'rgba(34,197,94,0.05)' : 'var(--bg-glass)',
                        border: `1px solid ${task.completed ? 'rgba(34,197,94,0.2)' : 'var(--border-glass)'}`,
                        borderRadius: 'var(--radius)', cursor: 'pointer',
                        transition: 'var(--transition)',
                      }}
                    >
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0, marginTop: '2px',
                        border: `2px solid ${task.completed ? 'var(--success)' : 'var(--border-glass-hover)'}`,
                        background: task.completed ? 'var(--success)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', color: 'white',
                      }}>
                        {task.completed && '✓'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{
                            fontSize: '14px', fontWeight: '600',
                            textDecoration: task.completed ? 'line-through' : 'none',
                            opacity: task.completed ? 0.7 : 1,
                          }}>{task.title}</span>
                          {task.priority && (
                            <span style={{
                              fontSize: '10px', fontWeight: '600', color: priorityColors[task.priority],
                              textTransform: 'uppercase', letterSpacing: '0.5px',
                            }}>{task.priority}</span>
                          )}
                        </div>
                        {task.description && (
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '6px' }}>{task.description}</p>
                        )}
                        {task.resources?.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {task.resources.map((r, ri) => (
                              <span key={ri} style={{
                                fontSize: '11px', padding: '2px 8px', background: 'rgba(99,102,241,0.1)',
                                borderRadius: 'var(--radius-full)', color: 'var(--text-accent)',
                              }}>📎 {r}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '32px' }}>
        <Link to="/roadmap" className="btn btn-secondary">← Generate New Roadmap</Link>
      </div>
    </div>
  );
};

export default RoadmapView;
