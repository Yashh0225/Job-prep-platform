import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const popularCompanies = ['Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix', 'Uber', 'Stripe', 'Airbnb', 'Twitter', 'LinkedIn', 'Salesforce', 'Adobe', 'Infosys', 'TCS', 'Wipro'];

const interviewPartOptions = [
  { key: 'dsa', icon: '💻', label: 'DSA / Coding', desc: 'Data Structures & Algorithms with code editor' },
  { key: 'technical', icon: '🔧', label: 'Technical', desc: 'System design, architecture, frameworks' },
  { key: 'hr', icon: '🤝', label: 'HR / Behavioral', desc: 'Behavioral, situational, motivational' },
  { key: 'cs_fundamentals', icon: '📚', label: 'CS Fundamentals', desc: 'OS, DBMS, Networks, OOP (MCQ + descriptive)' },
];

const MockSetup = () => {
  const [step, setStep] = useState(1);
  const [companies, setCompanies] = useState([]);
  const [customCompany, setCustomCompany] = useState('');
  const [jdMode, setJdMode] = useState('ai_generated'); // ai_generated | paste_jd
  const [jobDescription, setJobDescription] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [jobTitle, setJobTitle] = useState('');
  const [experience, setExperience] = useState('fresher');
  const [yearsOfExperience, setYearsOfExperience] = useState(0);
  const [interviewParts, setInterviewParts] = useState(['dsa', 'technical']);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

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
  const togglePart = (key) => {
    setInterviewParts(prev => prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]);
  };

  const handleStart = async () => {
    if (!jobTitle) return toast.error('Please enter a job title');
    if (!interviewParts.length) return toast.error('Select at least one interview part');
    if (!companies.length) return toast.error('Please select at least one company');
    if (jdMode === 'paste_jd' && !jobDescription) return toast.error('Please paste a job description');

    setLoading(true);
    const formData = new FormData();
    formData.append('companies', companies.join(','));
    formData.append('jobTitle', jobTitle);
    formData.append('experience', experience);
    formData.append('yearsOfExperience', yearsOfExperience);
    formData.append('interviewParts', interviewParts.join(','));
    formData.append('inputMode', jdMode);
    if (jdMode === 'paste_jd') formData.append('jobDescription', jobDescription);
    if (resumeFile) formData.append('resume', resumeFile);

    try {
      const res = await api.post('/interview/start', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Interview started! Good luck!');
      navigate(`/mock-interview/${res.data.interview._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start interview');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="ai-loading">
          <div className="ai-loading-icon">🎤</div>
          <p className="ai-loading-text">Preparing your interview...</p>
          <p className="ai-loading-sub">Generating questions tailored to {companies.length ? companies.join(', ') : jobTitle}</p>
          <div className="loading-dots"><span /><span /><span /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header animate-in">
        <h1>Mock Interview Setup</h1>
        <p>Configure your interview to match your target companies and role</p>
      </div>

      {/* Stepper */}
      <div className="stepper animate-in">
        {[
          { num: 1, label: 'Company & Mode' },
          { num: 2, label: 'Role & Experience' },
          { num: 3, label: 'Interview Parts' },
        ].map((s, i) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center' }}>
            <div className={`step ${step === s.num ? 'active' : step > s.num ? 'completed' : ''}`}>
              <div className="step-number">{step > s.num ? '✓' : s.num}</div>
              <span className="step-label hide-mobile">{s.label}</span>
            </div>
            {i < 2 && <div className={`step-line ${step > s.num ? 'completed' : ''}`} />}
          </div>
        ))}
      </div>

      <div className="glass-card animate-in" style={{ padding: '32px', maxWidth: '700px', margin: '0 auto' }}>
        {/* Step 1: Company, Resume & JD Mode */}
        {step === 1 && (
          <>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Company & Experience</h2>
            
            <div className="input-group" style={{ marginBottom: '24px' }}>
              <label>Target Company *</label>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Select a target company to tailor the interview style.
              </p>
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
                    <span key={c} className="badge badge-accent" style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '14px' }} onClick={() => removeCompany(c)}>
                      {c} ✕
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="input-group" style={{ marginBottom: '24px' }}>
              <label>Resume Upload (Optional but Recommended)</label>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Uploading your resume will allow the AI to ask highly personalized questions based on your background.
              </p>
              <input type="file" accept=".pdf" className="input-field" onChange={e => setResumeFile(e.target.files[0])} />
              {resumeFile && <p style={{ fontSize: '13px', color: 'var(--success)', marginTop: '8px' }}>✅ {resumeFile.name} selected</p>}
            </div>

            <div className="input-group" style={{ marginBottom: '24px' }}>
              <label>Job Description Source</label>
              <div className="tabs" style={{ marginBottom: '16px' }}>
                {[
                  { key: 'ai_generated', label: '🤖 AI Generated (Recommended)' },
                  { key: 'paste_jd', label: '📄 Paste Job Description' },
                ].map(t => (
                  <button key={t.key} className={`tab ${jdMode === t.key ? 'active' : ''}`} onClick={() => setJdMode(t.key)}>
                    {t.label}
                  </button>
                ))}
              </div>

              {jdMode === 'paste_jd' ? (
                <textarea className="input-field" rows={5} placeholder="Paste the full job description here..." value={jobDescription} onChange={e => setJobDescription(e.target.value)} style={{ width: '100%' }} />
              ) : (
                <div className="glass-card" style={{ padding: '16px', background: 'rgba(59,130,246,0.05)' }}>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>The AI will automatically construct a realistic job description based on your selected job title and companies.</p>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button onClick={() => setStep(2)} className="btn btn-primary" disabled={!companies.length}>Next →</button>
            </div>
          </>
        )}

        {/* Step 2: Role & Experience */}
        {step === 2 && (
          <>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Role & Experience</h2>

            <div className="input-group" style={{ marginBottom: '20px' }}>
              <label>Job Title *</label>
              <input className="input-field" placeholder="e.g. Software Engineer, SDE-2, Frontend Developer" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Experience Level
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['fresher', 'experienced'].map(exp => (
                  <button key={exp} onClick={() => setExperience(exp)}
                    className={`btn ${experience === exp ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, textTransform: 'capitalize' }}>
                    {exp === 'fresher' ? '🎓 Fresher (0-2 yrs)' : '💼 Experienced (2+ yrs)'}
                  </button>
                ))}
              </div>
            </div>

            {experience === 'experienced' && (
              <div className="input-group" style={{ marginBottom: '20px' }}>
                <label>Years of Experience</label>
                <input type="number" className="input-field" min="1" max="30" value={yearsOfExperience} onChange={e => setYearsOfExperience(parseInt(e.target.value) || 0)} />
              </div>
            )}

            <div className="form-actions">
              <button onClick={() => setStep(1)} className="btn btn-secondary">← Back</button>
              <button onClick={() => setStep(3)} className="btn btn-primary" disabled={!jobTitle}>Next →</button>
            </div>
          </>
        )}

        {/* Step 3: Interview Parts */}
        {step === 3 && (
          <>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Select Interview Parts</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {interviewPartOptions.map(opt => (
                <div key={opt.key} className={`checkbox-card ${interviewParts.includes(opt.key) ? 'selected' : ''}`}
                  onClick={() => togglePart(opt.key)}>
                  <input type="checkbox" checked={interviewParts.includes(opt.key)} readOnly />
                  <span style={{ fontSize: '20px' }}>{opt.icon}</span>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '600' }}>{opt.label}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{opt.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', background: 'rgba(99,102,241,0.05)' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                <strong>Summary:</strong> {jobTitle}{companies.length ? ` at ${companies.join(', ')}` : ''} · {experience} · {interviewParts.length} parts selected
              </p>
            </div>

            <div className="form-actions">
              <button onClick={() => setStep(2)} className="btn btn-secondary">← Back</button>
              <button onClick={handleStart} className="btn btn-primary btn-lg" disabled={!interviewParts.length}>
                🎤 Start Interview
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MockSetup;
