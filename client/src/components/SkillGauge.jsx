import { useEffect, useState } from 'react';

const SkillGauge = ({ score = 0, size = 160, label = 'Match Score' }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 200);
    return () => clearTimeout(timer);
  }, [score]);

  const getColor = () => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="score-gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          className="score-gauge-bg"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          className="score-gauge-fill"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ stroke: getColor() }}
        />
      </svg>
      <div className="score-gauge-value">
        <span className="score-gauge-number" style={{
          fontSize: size * 0.22,
          WebkitTextFillColor: getColor(),
        }}>{animatedScore}</span>
        <span className="score-gauge-label" style={{ fontSize: size * 0.07 }}>{label}</span>
      </div>
    </div>
  );
};

export default SkillGauge;
