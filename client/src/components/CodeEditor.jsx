import Editor from '@monaco-editor/react';

const LANGUAGE_MAP = {
  cpp: { label: 'C++', monacoId: 'cpp' },
  java: { label: 'Java', monacoId: 'java' },
  javascript: { label: 'JavaScript', monacoId: 'javascript' },
  python: { label: 'Python', monacoId: 'python' },
};

const CodeEditor = ({ language, onLanguageChange, code, onCodeChange, readOnly = false, height = '400px' }) => {
  return (
    <div className="code-editor-container">
      <div className="code-editor-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Language:</span>
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            disabled={readOnly}
            style={{ 
              background: 'var(--bg-secondary)', 
              color: 'var(--text-primary)', 
              border: '1px solid var(--border-glass)', 
              borderRadius: '4px', 
              padding: '2px 8px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {Object.entries(LANGUAGE_MAP).map(([key, val]) => (
              <option key={key} value={key} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{val.label}</option>
            ))}
          </select>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {readOnly ? '🔒 Read-only' : '✏️ Editable'}
        </span>
      </div>
      <Editor
        height={height}
        language={LANGUAGE_MAP[language]?.monacoId || 'javascript'}
        theme="vs-dark"
        value={code}
        onChange={onCodeChange}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, monospace",
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          tabSize: 4,
          automaticLayout: true,
          padding: { top: 12 },
          bracketPairColorization: { enabled: true },
        }}
        loading={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#1e1e1e', color: 'var(--text-muted)' }}>
            <div className="loading-spinner" style={{ width: 24, height: 24 }} />
          </div>
        }
      />
    </div>
  );
};

export default CodeEditor;
