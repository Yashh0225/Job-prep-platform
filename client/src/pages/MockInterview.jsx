import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import CodeEditor from '../components/CodeEditor';
import AudioRecorder from '../components/AudioRecorder';

const MockInterview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runningCode, setRunningCode] = useState(false);

  // Current state
  const [activePart, setActivePart] = useState('');
  const [questionIdx, setQuestionIdx] = useState(0);

  // Response state
  const [textResponse, setTextResponse] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [mcqAnswer, setMcqAnswer] = useState('');
  const [responseMode, setResponseMode] = useState('text');
  const [testResults, setTestResults] = useState(null);
  const [codeError, setCodeError] = useState('');

  useEffect(() => {
    api.get(`/interview/${id}`)
      .then(res => {
        const intv = res.data.interview;
        setInterview(intv);
        setActivePart(intv.currentPart || intv.interviewParts[0]);
        setQuestionIdx(intv.currentQuestionIndex || 0);
        setLoading(false);
        initQuestion(intv, intv.currentPart || intv.interviewParts[0], intv.currentQuestionIndex || 0);
      })
      .catch(() => { toast.error('Failed to load interview'); navigate('/mock-setup'); });
  }, [id]);

  const initQuestion = (intv, part, idx) => {
    setTextResponse('');
    setMcqAnswer('');
    setTestResults(null);
    setCodeError('');
    setResponseMode('text');

    if (part === 'dsa') {
      const q = intv.parts.dsa?.questions?.[idx];
      if (q) {
        setCode(q.userCode || q.starterCode?.[q.selectedLanguage || 'javascript'] || '');
        setLanguage(q.selectedLanguage || 'javascript');
      }
    }
  };

  const getQuestions = (part) => {
    if (!interview) return [];
    if (part === 'cs_fundamentals') {
      const mcqs = interview.parts.cs_fundamentals?.questions || [];
      const texts = interview.parts.cs_fundamentals?.textQuestions || [];
      return [...mcqs.map(q => ({ ...q, _type: 'mcq' })), ...texts.map(q => ({ ...q, _type: 'text' }))];
    }
    return interview.parts[part]?.questions || [];
  };

  const currentQuestions = getQuestions(activePart);
  const currentQ = currentQuestions[questionIdx];
  const totalQuestions = currentQuestions.length;

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    if (activePart === 'dsa' && currentQ?.starterCode?.[lang]) {
      const q = interview.parts.dsa.questions[questionIdx];
      if (!q.userCode) setCode(currentQ.starterCode[lang]);
    }
  };

  // Run code against test cases
  const handleRunCode = async () => {
    setRunningCode(true);
    setCodeError('');
    try {
      const res = await api.post(`/interview/${id}/run-code`, {
        questionIndex: questionIdx, code, language,
      });
      setTestResults(res.data.visibleResults || res.data.results);
      toast.info(`${res.data.visibleResults?.filter(r => r.passed).length || 0}/${res.data.visibleResults?.length || 0} test cases passed`);
    } catch (err) {
      setCodeError('Code execution is temporarily unavailable. Your code has been saved — feel free to skip to the next question and come back later.');
    } finally {
      setRunningCode(false);
    }
  };

  // Submit DSA code
  const handleSubmitCode = async () => {
    setSubmitting(true);
    setCodeError('');
    try {
      const res = await api.post(`/interview/${id}/submit-code`, {
        questionIndex: questionIdx, code, language,
      });
      setInterview(prev => {
        const updated = { ...prev };
        updated.parts.dsa.questions[questionIdx] = res.data.question;
        return updated;
      });
      toast.success(`Score: ${res.data.question.score}/100`);
    } catch (err) {
      setCodeError('Submission is temporarily unavailable due to high demand. Your code has been saved — skip to the next question and come back later.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit text/audio/MCQ response
  const handleSubmitResponse = async () => {
    const response = responseMode === 'text' ? textResponse : textResponse;
    if (!response && activePart !== 'cs_fundamentals') return toast.error('Please provide a response');

    setSubmitting(true);
    try {
      const isMCQ = activePart === 'cs_fundamentals' && currentQ?._type === 'mcq';
      const payload = {
        part: activePart,
        questionIndex: isMCQ ? questionIdx : (activePart === 'cs_fundamentals' ? questionIdx - (interview.parts.cs_fundamentals?.questions?.length || 0) : questionIdx),
        response: isMCQ ? mcqAnswer : response,
        responseType: responseMode,
        isMCQ,
      };

      const res = await api.post(`/interview/${id}/respond`, payload);
      
      // Update local state
      setInterview(prev => {
        const updated = JSON.parse(JSON.stringify(prev));
        if (isMCQ) {
          updated.parts.cs_fundamentals.questions[questionIdx] = res.data.question;
        } else if (activePart === 'cs_fundamentals') {
          const textIdx = questionIdx - (updated.parts.cs_fundamentals?.questions?.length || 0);
          updated.parts.cs_fundamentals.textQuestions[textIdx] = res.data.question;
        } else {
          updated.parts[activePart].questions[questionIdx] = res.data.question;
        }
        return updated;
      });

      if (isMCQ) {
        // We still show score internally or save it silently, just toast success
        toast.success('Response saved successfully');
      } else {
        toast.success('Response saved successfully');
      }
      
      if (questionIdx < totalQuestions - 1) {
        setTimeout(goNext, 800);
      }
    } catch (err) {
      toast.error('Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  // Navigate questions
  const goNext = () => {
    if (questionIdx < totalQuestions - 1) {
      const nextIdx = questionIdx + 1;
      setQuestionIdx(nextIdx);
      initQuestion(interview, activePart, nextIdx);
      api.patch(`/interview/${id}/state`, { currentQuestionIndex: nextIdx }).catch(() => {});
    }
  };

  const goPrev = () => {
    if (questionIdx > 0) {
      const prevIdx = questionIdx - 1;
      setQuestionIdx(prevIdx);
      initQuestion(interview, activePart, prevIdx);
    }
  };

  // Switch parts
  const switchPart = (part) => {
    setActivePart(part);
    setQuestionIdx(0);
    initQuestion(interview, part, 0);
    api.patch(`/interview/${id}/state`, { currentPart: part, currentQuestionIndex: 0 }).catch(() => {});
  };

  // End interview
  const handleEndInterview = async () => {
    if (!window.confirm('Are you sure you want to end the interview? All unanswered questions will be skipped.')) return;
    setEvaluating(true);
    toast.info('Evaluating all responses... This may take a minute.');
    try {
      await api.post(`/interview/${id}/end`);
      toast.success('Interview completed! Viewing results...');
      navigate(`/mock-result/${id}`);
    } catch (err) {
      toast.info('AI evaluation was unavailable, but your answers are saved. Loading results...');
      // Navigate to results anyway — the questions, answers, and expected answers are already stored
      setTimeout(() => navigate(`/mock-result/${id}`), 1500);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="ai-loading"><div className="loading-spinner" /><p className="loading-text">Loading interview...</p></div>
      </div>
    );
  }

  if (evaluating) {
    return (
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="ai-loading" style={{ transform: 'scale(1.2)' }}>
          <div className="loading-spinner" />
          <p className="loading-text" style={{ marginTop: '20px', fontSize: '18px', fontWeight: '600' }}>Evaluating Results...</p>
        </div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '400px', lineHeight: '1.5' }}>
          Our AI is currently grading all your responses and generating personalized feedback. This usually takes 15-30 seconds.
        </p>
      </div>
    );
  }

  if (!interview || !currentQ) {
    return <div className="page-container"><p>No questions found.</p></div>;
  }

  const isSubmitted = currentQ.submitted;

  return (
    <div className="page-container" style={{ maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>
            {interview.jobTitle} {interview.companies?.length ? `@ ${interview.companies.join(', ')}` : ''}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Question {questionIdx + 1} of {totalQuestions}
          </p>
        </div>
        <button onClick={handleEndInterview} className="btn btn-danger btn-sm">End Interview</button>
      </div>

      {/* Part Tabs */}
      <div className="tabs" style={{ marginBottom: '20px' }}>
        {interview.interviewParts.map(part => {
          const partCompleted = interview.parts[part]?.completed;
          const labels = { dsa: '💻 DSA', technical: '🔧 Technical', hr: '🤝 HR', cs_fundamentals: '📚 CS Fundamentals' };
          return (
            <button key={part} className={`tab ${activePart === part ? 'active' : ''}`} onClick={() => switchPart(part)}>
              {partCompleted && '✅ '}{labels[part]}
            </button>
          );
        })}
      </div>

      {/* Progress */}
      <div className="progress-bar" style={{ marginBottom: '24px' }}>
        <div className="progress-bar-fill" style={{ width: `${((questionIdx + 1) / totalQuestions) * 100}%` }} />
      </div>

      {/* DSA Mode */}
      {activePart === 'dsa' && (
        <div className="interview-layout">
          {/* Problem Description */}
          <div className="interview-panel glass-card" style={{ padding: '24px', maxWidth: '45%', overflowY: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700' }}>{currentQ.title}</h2>
              <span className={`badge badge-${currentQ.difficulty === 'easy' ? 'success' : currentQ.difficulty === 'medium' ? 'warning' : 'danger'}`}>
                {currentQ.difficulty}
              </span>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7', whiteSpace: 'pre-wrap', marginBottom: '16px' }}>
              {currentQ.description}
            </p>

            {currentQ.constraints?.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>Constraints:</h4>
                {currentQ.constraints.map((c, i) => (
                  <p key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>• {c}</p>
                ))}
              </div>
            )}

            {currentQ.examples?.map((ex, i) => (
              <div key={i} style={{ marginBottom: '12px', padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Example {i + 1}:</p>
                <p style={{ fontSize: '13px', fontFamily: 'monospace' }}>Input: {ex.input}</p>
                <p style={{ fontSize: '13px', fontFamily: 'monospace' }}>Output: {ex.output}</p>
                {ex.explanation && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{ex.explanation}</p>}
              </div>
            ))}

            {/* Test Results */}
            {testResults && (
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Test Results:</h4>
                <div className="test-cases">
                  {testResults.map((r, i) => (
                    <div key={i} className="test-case">
                      <div className={`test-case-status ${r.passed ? 'pass' : 'fail'}`}>{r.passed ? '✓' : '✕'}</div>
                      <div style={{ flex: 1 }}>
                        <span>Case {i + 1}: </span>
                        {!r.passed && <span style={{ color: 'var(--danger)' }}>Expected {r.expected}, got {r.actual}</span>}
                        {r.passed && <span style={{ color: 'var(--success)' }}>Passed</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Feedback */}
            {isSubmitted && currentQ.aiEvaluation && (
              <div style={{ marginTop: '16px', padding: '14px', background: 'rgba(99,102,241,0.05)', borderRadius: 'var(--radius)', border: '1px solid var(--border-accent)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>AI Feedback</span>
                  <span className="badge badge-accent">{currentQ.score}/100</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{currentQ.aiEvaluation}</p>
              </div>
            )}
          </div>

          {/* Code Editor */}
          <div className="interview-panel" style={{ flex: 1 }}>
            <CodeEditor language={language} onLanguageChange={handleLanguageChange} code={code} onCodeChange={setCode} readOnly={isSubmitted} height="calc(100vh - 380px)" />
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <button onClick={handleRunCode} className="btn btn-secondary" disabled={runningCode || isSubmitted}>
                {runningCode ? '⏳ Running...' : '▶ Run'}
              </button>
              <button onClick={handleSubmitCode} className="btn btn-primary" disabled={submitting || isSubmitted}>
                {submitting ? '⏳ Submitting...' : isSubmitted ? '✅ Submitted' : '📤 Submit'}
              </button>
            </div>

            {/* Friendly error banner */}
            {codeError && (
              <div style={{
                marginTop: '12px',
                padding: '14px 18px',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: 'var(--radius)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                flexWrap: 'wrap',
              }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <p style={{ fontSize: '14px', color: 'var(--warning)', fontWeight: '600', marginBottom: '2px' }}>⚠️ Service Temporarily Unavailable</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{codeError}</p>
                </div>
                {questionIdx < totalQuestions - 1 && (
                  <button onClick={goNext} className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                    Skip to Next →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Technical / HR Mode */}
      {(activePart === 'technical' || activePart === 'hr') && (
        <div style={{ width: '100%' }}>
          <div className="glass-card interview-question animate-in">
            {activePart === 'hr' && currentQ.category && (
              <span className="badge badge-info" style={{ marginBottom: '12px' }}>{currentQ.category}</span>
            )}
            <h2 style={{ fontSize: '18px', fontWeight: '600', lineHeight: '1.5' }}>{currentQ.question}</h2>
          </div>

          {!isSubmitted && (
            <>
              <div className="tabs" style={{ marginBottom: '16px' }}>
                <button className={`tab ${responseMode === 'text' ? 'active' : ''}`} onClick={() => setResponseMode('text')}>✍️ Text</button>
                <button className={`tab ${responseMode === 'audio' ? 'active' : ''}`} onClick={() => setResponseMode('audio')}>🎤 Audio</button>
              </div>

              {responseMode === 'text' ? (
                <textarea className="input-field" rows={6} placeholder="Type your answer here..." value={textResponse} onChange={e => setTextResponse(e.target.value)} style={{ width: '100%', marginBottom: '16px' }} />
              ) : (
                <div style={{ marginBottom: '16px' }}>
                  <AudioRecorder onTranscript={setTextResponse} />
                </div>
              )}

              <button onClick={handleSubmitResponse} className="btn btn-primary" disabled={submitting || !textResponse}>
                {submitting ? '⏳ Saving...' : '💾 Save & Next'}
              </button>
            </>
          )}

          {isSubmitted && (
            <div className="glass-card animate-in" style={{ padding: '20px', marginTop: '16px', borderLeft: '4px solid var(--success)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--success)' }}>✅ Answer Saved</span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '8px' }}>
                <strong>Your answer:</strong> {currentQ.userResponse}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>AI evaluation will be available at the end of the interview.</p>
            </div>
          )}
        </div>
      )}

      {/* CS Fundamentals Mode */}
      {activePart === 'cs_fundamentals' && (
        <div style={{ width: '100%' }}>
          <div className="glass-card interview-question animate-in">
            {currentQ.topic && <span className="badge badge-info" style={{ marginBottom: '12px' }}>{currentQ.topic}</span>}
            <span className="badge badge-accent" style={{ marginBottom: '12px', marginLeft: '8px' }}>
              {currentQ._type === 'mcq' ? 'MCQ' : 'Descriptive'}
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: '600', lineHeight: '1.5' }}>{currentQ.question}</h2>
          </div>

          {/* MCQ */}
          {currentQ._type === 'mcq' && !isSubmitted && (
            <>
              <div className="mcq-options" style={{ marginBottom: '16px' }}>
                {currentQ.options?.map((opt, i) => (
                  <div key={i} className={`mcq-option ${mcqAnswer === opt ? 'selected' : ''}`} onClick={() => setMcqAnswer(opt)}>
                    <div className="mcq-option-marker">{String.fromCharCode(65 + i)}</div>
                    {opt}
                  </div>
                ))}
              </div>
              <button onClick={handleSubmitResponse} className="btn btn-primary" disabled={submitting || !mcqAnswer}>
                {submitting ? '⏳ Saving...' : '💾 Save & Next'}
              </button>
            </>
          )}

          {/* MCQ Result (Hidden during interview) */}
          {currentQ._type === 'mcq' && isSubmitted && (
            <div className="glass-card animate-in" style={{ padding: '20px', marginTop: '16px', borderLeft: '4px solid var(--success)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--success)' }}>✅ Answer Saved</span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '8px' }}>
                <strong>Your choice:</strong> {currentQ.userAnswer}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Correct answer and explanation will be available at the end of the interview.</p>
            </div>
          )}

          {/* Descriptive */}
          {currentQ._type === 'text' && !isSubmitted && (
            <>
              <div className="tabs" style={{ marginBottom: '16px' }}>
                <button className={`tab ${responseMode === 'text' ? 'active' : ''}`} onClick={() => setResponseMode('text')}>✍️ Text</button>
                <button className={`tab ${responseMode === 'audio' ? 'active' : ''}`} onClick={() => setResponseMode('audio')}>🎤 Audio</button>
              </div>
              {responseMode === 'text' ? (
                <textarea className="input-field" rows={5} placeholder="Type your answer..." value={textResponse} onChange={e => setTextResponse(e.target.value)} style={{ width: '100%', marginBottom: '16px' }} />
              ) : (
                <div style={{ marginBottom: '16px' }}><AudioRecorder onTranscript={setTextResponse} /></div>
              )}
              <button onClick={handleSubmitResponse} className="btn btn-primary" disabled={submitting || !textResponse}>
                {submitting ? '⏳ Saving...' : '💾 Save & Next'}
              </button>
            </>
          )}

          {currentQ._type === 'text' && isSubmitted && (
            <div className="glass-card animate-in" style={{ padding: '20px', marginTop: '16px', borderLeft: '4px solid var(--success)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--success)' }}>✅ Answer Saved</span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '8px' }}>
                <strong>Your answer:</strong> {currentQ.userResponse}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>AI evaluation will be available at the end of the interview.</p>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)' }}>
        <button onClick={goPrev} className="btn btn-secondary" disabled={questionIdx === 0}>← Previous</button>
        <span style={{ fontSize: '14px', color: 'var(--text-muted)', alignSelf: 'center' }}>
          {questionIdx + 1} / {totalQuestions}
        </span>
        {questionIdx < totalQuestions - 1 ? (
          <button onClick={goNext} className="btn btn-primary">Next →</button>
        ) : (
          <button onClick={handleEndInterview} className="btn btn-success">Finish & Get Results</button>
        )}
      </div>
    </div>
  );
};

export default MockInterview;
