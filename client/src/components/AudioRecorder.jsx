import { useState, useRef, useEffect } from 'react';

const AudioRecorder = ({ onTranscript, disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      const full = finalTranscript + interimTranscript;
      setTranscript(full);
      onTranscript?.(full);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      if (isRecording) {
        try { recognition.start(); } catch {}
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try { recognition.stop(); } catch {}
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error('Failed to start recording:', e);
      }
    }
  };

  if (!supported) {
    return (
      <div className="audio-recorder" style={{ opacity: 0.6 }}>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center' }}>
          🎤 Speech recognition not supported in this browser.<br />
          Use Chrome or Edge for voice input.
        </p>
      </div>
    );
  }

  return (
    <div className="audio-recorder">
      <button
        onClick={toggleRecording}
        disabled={disabled}
        className={`audio-recorder-btn ${isRecording ? 'recording' : 'idle'}`}
        title={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isRecording ? '⏹' : '🎤'}
      </button>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
        {isRecording ? '🔴 Listening...' : 'Click to start voice input'}
      </p>
      {transcript && (
        <div style={{
          width: '100%',
          padding: '12px 16px',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius)',
          fontSize: '14px',
          color: 'var(--text-primary)',
          maxHeight: '120px',
          overflowY: 'auto',
          lineHeight: '1.5',
        }}>
          {transcript}
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
