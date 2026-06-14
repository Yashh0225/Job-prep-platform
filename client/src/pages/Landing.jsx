import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';

const features = [
  { icon: '🔍', title: 'Resume Analyzer', desc: 'AI-powered skill gap analysis comparing your resume against any job description. Get actionable insights instantly.' },
  { icon: '🗺️', title: 'Smart Roadmap', desc: 'Personalized study plans based on your timeline, target role, and current skills. Day-by-day preparation guide.' },
  { icon: '🎤', title: 'Mock Interviews', desc: 'Realistic mock interviews with DSA coding, technical, HR, and CS fundamentals. Company-specific questions.' },
  { icon: '💻', title: 'Code Editor', desc: 'LeetCode-style coding environment with C++, Java, JavaScript, and Python. Run test cases and get AI feedback.' },
  { icon: '🎯', title: 'AI Evaluation', desc: 'Get scored and detailed feedback on every answer. See your hire probability and specific improvement areas.' },
  { icon: '📊', title: 'Track Progress', desc: 'All your preparation sessions, mock interviews, and scores saved for reference and improvement tracking.' },
];

const steps = [
  { num: '01', title: 'Upload & Configure', desc: 'Upload your resume, paste a job description, or just enter a role and company name.' },
  { num: '02', title: 'AI Analysis', desc: 'Our AI analyzes skill gaps, generates personalized roadmaps, and creates interview questions.' },
  { num: '03', title: 'Practice & Improve', desc: 'Take mock interviews, solve coding problems, and get detailed feedback on every response.' },
];

const Landing = () => {
  const { user } = useAuth();

  return (
    <div style={{ overflow: 'hidden' }}>
      {/* Hero Section */}
      <section style={{
        minHeight: 'calc(100vh - var(--navbar-height))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '60px 24px',
        position: 'relative',
      }}>
        {/* Animated gradient orbs */}
        <div style={{
          position: 'absolute', width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          top: '-10%', right: '-10%', animation: 'float 6s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)',
          bottom: '-5%', left: '-5%', animation: 'float 8s ease-in-out infinite 1s',
        }} />

        <div style={{ maxWidth: '720px', position: 'relative', zIndex: 1 }} className="animate-in">
          <div className="badge badge-accent" style={{ marginBottom: '20px', fontSize: '12px' }}>
            ✨ AI-Powered Job Preparation
          </div>
          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: '900', lineHeight: '1.1', marginBottom: '20px',
          }}>
            <span style={{ color: 'var(--text-primary)' }}>Ace Your Next</span>
            <br />
            <span style={{
              background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Interview</span>
          </h1>
          <p style={{
            fontSize: '18px', color: 'var(--text-secondary)', lineHeight: '1.7',
            maxWidth: '560px', margin: '0 auto 40px',
          }}>
            Analyze resumes, build personalized study plans, and practice with realistic mock interviews tailored to your target companies.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to={user ? '/dashboard' : '/register'} className="btn btn-primary btn-lg">
              {user ? 'Go to Dashboard' : 'Start Free'} →
            </Link>
            <a href="#features" className="btn btn-secondary btn-lg">Learn More</a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{
        padding: '100px 24px', maxWidth: '1100px', margin: '0 auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '12px' }}>
            Everything You Need to{' '}
            <span style={{
              background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Prepare</span>
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
            A complete toolkit for job interview preparation, powered by AI.
          </p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
        }}>
          {features.map((f, i) => (
            <div key={i} className="glass-card" style={{
              padding: '28px', animation: `fadeIn 0.4s ease ${i * 0.1}s forwards`, opacity: 0,
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: 'var(--radius)',
                background: 'rgba(99,102,241,0.1)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '16px',
              }}>{f.icon}</div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '8px' }}>{f.title}</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section style={{
        padding: '100px 24px', background: 'var(--bg-secondary)',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '60px' }}>
            How It{' '}
            <span style={{
              background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Works</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', textAlign: 'left' }}>
            {steps.map((s, i) => (
              <div key={i} style={{
                display: 'flex', gap: '24px', alignItems: 'flex-start',
                animation: `fadeIn 0.4s ease ${i * 0.15}s forwards`, opacity: 0,
              }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: 'var(--accent-gradient)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', fontWeight: '800', color: 'white', flexShrink: 0,
                }}>{s.num}</div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '6px' }}>{s.title}</h3>
                  <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '100px 24px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '16px' }}>
            Ready to Get Started?
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Join PrepVault and start preparing for your dream job today.
          </p>
          <Link to={user ? '/dashboard' : '/register'} className="btn btn-primary btn-lg">
            {user ? 'Go to Dashboard' : 'Create Free Account'} →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '32px 24px', borderTop: '1px solid var(--border-glass)',
        textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)',
      }}>
        © 2026 PrepVault · AI-Powered Job Preparation
      </footer>
    </div>
  );
};

export default Landing;
