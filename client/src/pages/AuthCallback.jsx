import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const AuthCallback = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      localStorage.setItem('prepvault_token', token);
      api.get('/auth/me')
        .then(res => {
          login(token, res.data.user);
          navigate('/dashboard');
        })
        .catch(() => navigate('/login'));
    } else {
      navigate('/login');
    }
  }, []);

  return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <p className="loading-text">Signing you in...</p>
    </div>
  );
};

export default AuthCallback;
