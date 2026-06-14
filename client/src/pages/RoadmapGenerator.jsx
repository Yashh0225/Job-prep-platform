import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import FileUpload from '../components/FileUpload';

const RoadmapGenerator = () => {
  const [inputMode, setInputMode] = useState('title_only');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [days, setDays] = useState(14);
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleGenerate = async () => {
    if (!jobTitle) return toast.error('Job title is required');
    if (inputMode === 'job_description' && !jobDescription) return toast.error('Please enter the job description');

    setLoading(true);
    const formData = new FormData();
    formData.append('jobTitle', jobTitle);
    formData.append('company', company);
    formData.append('daysAvailable', days.toString());
    formData.append('inputMode', inputMode);
    if (inputMode === 'job_description') formData.append('jobDescription', jobDescription);
    if (resumeFile) formData.append('resume', resumeFile);

    try {
      const res = await api.post('/roadmap/generate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Roadmap generated!');
      navigate(`/roadmap/${res.data.roadmap._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate roadmap');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="ai-loading">
          <div className="ai-loading-icon">🗺️</div>
          <p className="ai-loading-text">Generating your roadmap...</p>
          <p className="ai-loading-sub">Creating a personalized {days}-day study plan</p>
          <div className="loading-dots"><span /><span /><span /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '700px' }}>
        <div className="page-header animate-in">
          <h1>Roadmap Generator</h1>
          <p>Create a personalized interview preparation plan</p>
        </div>

        <div className="glass-card animate-in" style={{ padding: '32px' }}>
        {/* Input Mode */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            Preparation Mode
          </label>
          <div className="tabs">
            {[
              { key: 'title_only', label: '🎯 Role Only' },
              { key: 'title_company', label: '🏢 Role + Company' },
              { key: 'job_description', label: '📄 Full JD' },
            ].map(t => (
              <button key={t.key} className={`tab ${inputMode === t.key ? 'active' : ''}`} onClick={() => setInputMode(t.key)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-grid" style={{ marginBottom: '20px' }}>
          <div className="input-group">
            <label>Job Title *</label>
            <input className="input-field" placeholder="e.g. Frontend Developer" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
          </div>
          {(inputMode === 'title_company' || inputMode === 'job_description') && (
            <div className="input-group">
              <label>Company</label>
              <input className="input-field" placeholder="e.g. Google" value={company} onChange={e => setCompany(e.target.value)} />
            </div>
          )}
        </div>

        {inputMode === 'job_description' && (
          <div className="input-group" style={{ marginBottom: '20px' }}>
            <label>Job Description</label>
            <textarea className="input-field" rows={6} placeholder="Paste the full job description..." value={jobDescription} onChange={e => setJobDescription(e.target.value)} style={{ width: '100%' }} />
          </div>
        )}

        {/* Days Slider */}
        <div className="input-group" style={{ marginBottom: '20px' }}>
          <label>Days Until Interview: <strong style={{ color: 'var(--accent-primary)' }}>{days} days</strong></label>
          <input
            type="range" min="1" max="90" value={days} onChange={e => setDays(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>1 day</span><span>30 days</span><span>60 days</span><span>90 days</span>
          </div>
        </div>

        {/* Resume Upload (Optional) */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            Resume (optional — for personalized recommendations)
          </label>
          <FileUpload label="Upload Resume PDF" file={resumeFile} onFileSelect={setResumeFile} />
        </div>

          <button onClick={handleGenerate} className="btn btn-primary" disabled={loading || !jobTitle} style={{ padding: '12px 32px', fontSize: '15px', width: '100%' }}>
            {loading ? 'Generating...' : '✨ Generate Roadmap'}
          </button>
        </div>
      </div>
    </div>);
};

export default RoadmapGenerator;
