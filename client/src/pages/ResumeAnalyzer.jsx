import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import FileUpload from '../components/FileUpload';
import SkillGauge from '../components/SkillGauge';

const popularCompanies = ['Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix', 'Uber', 'Stripe', 'Airbnb', 'Twitter', 'LinkedIn', 'Salesforce', 'Adobe', 'Infosys', 'TCS', 'Wipro'];

const ResumeAnalyzer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState('input'); // 'input' | 'loading' | 'result'
  const [descMode, setDescMode] = useState('manual');
  const [jobTitle, setJobTitle] = useState('');
  const [companies, setCompanies] = useState([]);
  const [customCompany, setCustomCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jdFile, setJdFile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [result, setResult] = useState(null);
  const [resultTab, setResultTab] = useState('overview'); // overview | matched | missing | recommendations
  const toast = useToast();

  useEffect(() => {
    if (id) {
      setStep('loading');
      api.get(`/analysis/sessions/${id}`)
        .then(res => {
          setResult(res.data.session);
          setStep('result');
        })
        .catch(() => {
          toast.error('Failed to load analysis session');
          setStep('input');
        });
    }
  }, [id]);

  const addCompany = (name) => {
    setCompanies([name]);
  };
  const removeCompany = (name) => setCompanies([]);
  const addCustomCompany = () => {
    if (customCompany.trim()) {
      setCompanies([customCompany.trim()]);
      setCustomCompany('');
    }
  };

  const handleAnalyze = async () => {
    const finalJobTitle = descMode === 'pdf' ? (jobTitle || 'Job from PDF') : jobTitle;
    if (!finalJobTitle) return toast.error('Job title is required');
    if (descMode !== 'pdf' && companies.length === 0) return toast.error('Company name is required');
    if (!resumeFile) return toast.error('Please upload your resume');
    if (descMode === 'manual' && !jobDescription) return toast.error('Please enter the job description');
    if (descMode === 'pdf' && !jdFile) return toast.error('Please upload the JD PDF');

    setStep('loading');
    const formData = new FormData();
    formData.append('jobTitle', finalJobTitle);
    formData.append('company', companies.join(', '));
    formData.append('descriptionMode', descMode);
    formData.append('resume', resumeFile);
    if (descMode === 'manual') formData.append('jobDescription', jobDescription);
    if (descMode === 'pdf') formData.append('jobDescriptionFile', jdFile);

    try {
      const res = await api.post('/analysis/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data.session);
      setStep('result');
      toast.success('Analysis complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed');
      setStep('input');
    }
  };

  const handleGenerateRoadmap = async () => {
    const daysStr = window.prompt("How many days do you have to prepare?", "14");
    if (!daysStr) return;
    const daysAvailable = parseInt(daysStr, 10);
    if (isNaN(daysAvailable) || daysAvailable < 1) {
      return toast.error("Please enter a valid number of days");
    }

    setStep('loading');
    try {
      const formData = new FormData();
      formData.append('jobTitle', result.jobTitle);
      formData.append('company', result.company || '');
      formData.append('jobDescription', result.jobDescription);
      formData.append('daysAvailable', daysAvailable);
      formData.append('inputMode', 'job_description');
      formData.append('analysisSessionId', result._id);

      const res = await api.post('/roadmap/generate', formData);
      navigate(`/roadmap/${res.data.roadmap._id}`);
    } catch (err) {
      toast.error('Failed to generate roadmap');
      setStep('result');
    }
  };

  if (step === 'loading') {
    return (
      <div className="page-container">
        <div className="ai-loading">
          <div className="ai-loading-icon">🧠</div>
          <p className="ai-loading-text">Analyzing your resume...</p>
          <p className="ai-loading-sub">Comparing skills, identifying gaps, generating recommendations</p>
          <div className="loading-dots"><span /><span /><span /></div>
        </div>
      </div>
    );
  }

  if (step === 'result' && result) {
    const a = result.analysis;
    return (
      <div className="page-container">
        <div className="page-header animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ marginBottom: '8px' }}>Analysis Results</h1>
            <p>{result.jobTitle}{result.company ? ` at ${result.company}` : ''}</p>
          </div>
          <button onClick={handleGenerateRoadmap} className="btn btn-primary" style={{ padding: '10px 16px', fontSize: '14px' }}>
            🗺️ Generate Roadmap
          </button>
        </div>

        <div className="tabs" style={{ marginBottom: '24px' }}>
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'matched', label: 'Matched Skills' },
            { key: 'missing', label: 'Missing Skills' },
            { key: 'recommendations', label: 'Recommendations' }
          ].map(t => (
            <button key={t.key} className={`tab ${resultTab === t.key ? 'active' : ''}`} onClick={() => setResultTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {resultTab === 'overview' && (
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', marginBottom: '40px' }}>
            <div className="animate-in" style={{ display: 'flex', justifyContent: 'center' }}>
              <SkillGauge score={a.overallMatch} size={180} label="Overall Match" />
            </div>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <div className="glass-card animate-in stagger-1" style={{ padding: '20px', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--success)', marginBottom: '8px' }}>💪 Strengths</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{a.strengthSummary}</p>
              </div>
              <div className="glass-card animate-in stagger-2" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--warning)', marginBottom: '8px' }}>📋 Gap Summary</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{a.gapSummary}</p>
              </div>
            </div>
          </div>
        )}

        {resultTab === 'matched' && (
          <div className="animate-in">
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>✅ Matched Skills</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
              {a.matchedSkills?.map((s, i) => (
                <span key={i} className={`badge badge-${s.proficiency === 'strong' ? 'success' : s.proficiency === 'moderate' ? 'info' : 'warning'}`}>
                  {s.skill} · {s.proficiency}
                </span>
              ))}
            </div>
          </div>
        )}

        {resultTab === 'missing' && (
          <div className="animate-in">
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>⚠️ Missing Skills</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
              {a.missingSkills?.map((s, i) => (
                <div key={i} className="glass-card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>{s.skill}</span>
                    <span className={`badge badge-${s.importance === 'critical' ? 'danger' : s.importance === 'important' ? 'warning' : 'info'}`}>
                      {s.importance}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{s.suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {resultTab === 'recommendations' && (
          <div className="animate-in">
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>💡 Recommendations</h2>
            {a.recommendations?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
                {a.recommendations.map((r, i) => (
                  <div key={i} className="glass-card" style={{ padding: '14px 18px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {r}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No recommendations provided.</p>
            )}
          </div>
        )}

        <button onClick={() => { setStep('input'); setResult(null); navigate('/analyze'); }} className="btn btn-secondary">
          ← New Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header animate-in">
        <h1>Resume Analyzer</h1>
        <p>Upload your resume and job description to get AI-powered skill gap analysis</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        {/* Left: Job Description */}
        <div className="glass-card animate-in stagger-1" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '20px' }}>📄 Job Description</h2>

          <div className="tabs" style={{ marginBottom: '20px' }}>
            {[
              { key: 'pdf', label: '📁 Upload PDF' },
              { key: 'details', label: '✍️ Input Details' },
            ].map(t => (
              <button key={t.key} className={`tab ${descMode === 'pdf' ? (t.key === 'pdf' ? 'active' : '') : (t.key === 'details' ? 'active' : '')}`} onClick={() => setDescMode(t.key === 'pdf' ? 'pdf' : 'manual')}>
                {t.label}
              </button>
            ))}
          </div>

          {descMode === 'pdf' ? (
            <FileUpload label="Upload Job Description PDF" file={jdFile} onFileSelect={setJdFile} />
          ) : (
            <>
              <div className="input-group" style={{ marginBottom: '16px' }}>
                <label>Job Title / Role *</label>
                <input className="input-field" placeholder="e.g. Frontend Developer" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  Company *
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  {popularCompanies.map(c => (
                    <button key={c} onClick={() => companies.includes(c) ? removeCompany(c) : addCompany(c)}
                      className={`btn btn-sm ${companies.includes(c) ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '12px', padding: '6px 14px' }}>
                      {c}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input className="input-field" placeholder="Add custom company..." value={customCompany} onChange={e => setCustomCompany(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCustomCompany()} style={{ flex: 1 }} />
                  <button onClick={addCustomCompany} className="btn btn-secondary btn-sm">Add</button>
                </div>
                {companies.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {companies.map(c => (
                      <span key={c} className="badge badge-accent" style={{ cursor: 'pointer' }} onClick={() => removeCompany(c)}>
                        {c} ✕
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="tabs" style={{ marginBottom: '16px' }}>
                <button className={`tab ${descMode === 'manual' ? 'active' : ''}`} onClick={() => setDescMode('manual')}>✍️ Job Description</button>
                <button className={`tab ${descMode === 'quick' ? 'active' : ''}`} onClick={() => setDescMode('quick')}>⚡ AI Generate JD</button>
              </div>

              {descMode === 'manual' && (
                <textarea className="input-field" rows={6} placeholder="Enter the full job description here..." value={jobDescription} onChange={e => setJobDescription(e.target.value)} style={{ width: '100%' }} />
              )}
              {descMode === 'quick' && (
                <div className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
                  <p style={{ fontSize: '32px', marginBottom: '8px' }}>⚡</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    AI will automatically generate a realistic job description based on the Title{companies.length ? ` and ${companies.join(', ')}` : ''}.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: Resume Upload */}
        <div className="glass-card animate-in stagger-2" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '20px' }}>📋 Your Resume</h2>
          <div style={{ flex: 1 }}>
            <FileUpload label="Upload Resume (PDF)" file={resumeFile} onFileSelect={setResumeFile} />
          </div>
          <button onClick={handleAnalyze} className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '24px' }}>
            🔍 Analyze Skills
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalyzer;
