import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import SkillGauge from '../components/SkillGauge';

const hireLabels = { strong_hire: '🟢 Strong Hire', hire: '🔵 Hire', lean_hire: '🟡 Lean Hire', no_hire: '🔴 No Hire' };
const hireColors = { strong_hire: '#22c55e', hire: '#3b82f6', lean_hire: '#f59e0b', no_hire: '#ef4444' };

const MockResult = () => {
  const { id } = useParams();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    api.get(`/interview/${id}`)
      .then(res => { setInterview(res.data.interview); setLoading(false); })
      .catch(() => { toast.error('Failed to load results'); setLoading(false); });
  }, [id]);

  if (loading) {
    return <div className="page-container"><div className="ai-loading"><div className="loading-spinner" /><p className="loading-text">Loading results...</p></div></div>;
  }

  if (!interview) {
    return <div className="page-container"><p>Interview not found.</p><Link to="/history" className="btn btn-secondary">← History</Link></div>;
  }

  const ev = interview.evaluation;
  const partLabels = { dsa: '💻 DSA', technical: '🔧 Technical', hr: '🤝 HR', cs_fundamentals: '📚 CS Fundamentals' };

  return (
    <div className="page-container">
      <div className="page-header animate-in">
        <h1>Interview Results</h1>
        <p>{interview.jobTitle}{interview.companies?.length ? ` at ${interview.companies.join(', ')}` : ''}</p>
      </div>

      {/* Overall Score + Hire Recommendation */}
      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', marginBottom: '40px', alignItems: 'center' }}>
        <div className="animate-in" style={{ textAlign: 'center' }}>
          <SkillGauge score={ev?.overallScore || 0} size={200} label="Overall Score" />
        </div>

        <div style={{ flex: 1, minWidth: '300px' }}>
          {ev?.hireRecommendation && (
            <div className="glass-card animate-in stagger-1" style={{
              padding: '20px', marginBottom: '16px', borderLeft: `4px solid ${hireColors[ev.hireRecommendation]}`,
            }}>
              <p style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>
                {hireLabels[ev.hireRecommendation]}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Hire Recommendation</p>
            </div>
          )}

          {ev?.detailedFeedback && (
            <div className="glass-card animate-in stagger-2" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>📝 Detailed Feedback</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>{ev.detailedFeedback}</p>
            </div>
          )}
        </div>
      </div>

      {/* Part Scores */}
      <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>📊 Part-wise Scores</h2>
      <div className="cards-grid" style={{ marginBottom: '32px' }}>
        {interview.interviewParts.map((part, i) => (
          <div key={part} className="glass-card stat-card animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '16px' }}>{partLabels[part]}</span>
              <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-primary)' }}>
                {ev?.partScores?.[part] || 0}
              </span>
            </div>
            <div className="progress-bar" style={{ marginTop: '8px' }}>
              <div className="progress-bar-fill" style={{ width: `${ev?.partScores?.[part] || 0}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Strengths & Weaknesses */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-card animate-in" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--success)', marginBottom: '12px' }}>💪 Strengths</h3>
          {ev?.strengths?.map((s, i) => (
            <p key={i} style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '6px' }}>✅ {s}</p>
          )) || <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No data</p>}
        </div>
        <div className="glass-card animate-in stagger-1" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--danger)', marginBottom: '12px' }}>🎯 Areas to Improve</h3>
          {ev?.weaknesses?.map((w, i) => (
            <p key={i} style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '6px' }}>⚠️ {w}</p>
          )) || <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No data</p>}
        </div>
      </div>

      {/* Improvement Areas */}
      {ev?.improvementAreas?.length > 0 && (
        <>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>📈 Improvement Recommendations</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
            {ev.improvementAreas.map((area, i) => (
              <div key={i} className="glass-card animate-in" style={{ padding: '16px', animationDelay: `${i * 0.05}s` }}>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{area}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* All Questions & Answers */}
      <div style={{ marginBottom: '32px' }}>
        {interview.interviewParts.map((part, partIdx) => {
          let questions = [];
          if (part === 'dsa') questions = interview.parts.dsa?.questions || [];
          else if (part === 'cs_fundamentals') {
            questions = [
              ...(interview.parts.cs_fundamentals?.questions || []).map(q => ({ ...q, _type: 'mcq' })),
              ...(interview.parts.cs_fundamentals?.textQuestions || []).map(q => ({ ...q, _type: 'text' })),
            ];
          } else questions = interview.parts[part]?.questions || [];

          if (questions.length === 0) return null;

          return (
            <div key={part} style={{ marginBottom: '40px' }} className="animate-in stagger-2">
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: 'var(--accent-primary)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                {partLabels[part]} — Question Details
              </h2>
              {questions.map((q, i) => (
                <div key={i} className="glass-card" style={{ padding: '20px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'flex-start' }}>
                    <p style={{ fontSize: '15px', fontWeight: '700', lineHeight: '1.4', flex: 1, paddingRight: '16px' }}>Q{i + 1}: {q.title || q.question}</p>
                    <span className={`badge ${q.score >= 70 ? 'badge-success' : q.score >= 40 ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '14px', padding: '6px 12px' }}>
                      {q.score || 0}/100
                    </span>
                  </div>

                  <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Your Answer</p>
                    {q._type === 'mcq' ? (
                      <p style={{ fontSize: '14px', color: q.userAnswer === q.correctAnswer ? 'var(--success)' : 'var(--danger)' }}>
                        {q.userAnswer || 'Not answered'} {q.userAnswer === q.correctAnswer ? '✅' : '❌'}
                      </p>
                    ) : part === 'dsa' ? (
                      <pre style={{ fontSize: '13px', background: '#1e1e1e', padding: '12px', borderRadius: '6px', overflowX: 'auto', color: '#d4d4d4' }}>
                        {q.userCode || '// No code submitted'}
                      </pre>
                    ) : (
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{q.userResponse || 'Not answered'}</p>
                    )}
                  </div>

                  <details style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', borderLeft: '3px solid var(--accent-primary)', borderRadius: '0 8px 8px 0', padding: '12px', marginBottom: '12px' }}>
                    <summary style={{ fontSize: '13px', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600', cursor: 'pointer', outline: 'none' }}>Expected Answer / Topics</summary>
                    <div style={{ marginTop: '12px' }}>
                      {q._type === 'mcq' ? (
                        <>
                          <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500', marginBottom: '4px' }}>{q.correctAnswer}</p>
                          {q.explanation && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{q.explanation}</p>}
                        </>
                      ) : part === 'dsa' ? (
                        <>
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '8px' }}>
                            Passed {q.testResults?.filter(tr => tr.passed).length || 0} / {q.testResults?.length || 0} test cases.
                          </p>
                          {q.solutionCode && q.selectedLanguage && q.solutionCode[q.selectedLanguage] && (
                            <div>
                              <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px' }}>Optimal Solution ({q.selectedLanguage}):</p>
                              <pre style={{ fontSize: '12px', background: '#1e1e1e', padding: '12px', borderRadius: '6px', overflowX: 'auto', color: '#d4d4d4' }}>
                                {q.solutionCode[q.selectedLanguage]}
                              </pre>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {q.idealAnswer && <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.5', marginBottom: '8px' }}>{q.idealAnswer}</p>}
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                            {q.expectedTopics?.map((topic, idx) => (
                              <span key={idx} style={{ fontSize: '12px', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                                {topic}
                              </span>
                            ))}
                            {!q.expectedTopics?.length && !q.idealAnswer && <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No specific expected answer available.</p>}
                          </div>
                        </>
                      )}
                    </div>
                  </details>

                  {q.aiEvaluation && (
                    <div>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>AI Evaluation</p>
                      <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6' }}>{q.aiEvaluation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <Link to="/mock-setup" className="btn btn-primary">🎤 New Interview</Link>
        <Link to="/history" className="btn btn-secondary">📋 View History</Link>
      </div>
    </div>
  );
};

export default MockResult;
