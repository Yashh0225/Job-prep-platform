import { useState, useRef } from 'react';

const FileUpload = ({ label = 'Upload PDF', accept = '.pdf', onFileSelect, file }) => {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      onFileSelect(droppedFile);
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      style={{
        padding: '32px',
        border: `2px dashed ${dragOver ? 'var(--accent-primary)' : 'var(--border-glass)'}`,
        borderRadius: 'var(--radius-lg)',
        background: dragOver ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-glass)',
        cursor: 'pointer',
        transition: 'var(--transition)',
        textAlign: 'center',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => onFileSelect(e.target.files[0])}
        style={{ display: 'none' }}
      />
      <div style={{ fontSize: '36px', marginBottom: '12px' }}>
        {file ? '📄' : '📁'}
      </div>
      <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>
        {file ? file.name : label}
      </p>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
        {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Drag & drop or click to browse'}
      </p>
      {file && (
        <button
          onClick={(e) => { e.stopPropagation(); onFileSelect(null); }}
          className="btn btn-ghost btn-sm"
          style={{ marginTop: '8px', color: 'var(--danger)' }}
        >
          Remove
        </button>
      )}
    </div>
  );
};

export default FileUpload;
