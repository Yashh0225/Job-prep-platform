import { BrowserRouter, Routes, Route } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import RoadmapGenerator from './pages/RoadmapGenerator';
import RoadmapView from './pages/RoadmapView';
import MockSetup from './pages/MockSetup';
import MockInterview from './pages/MockInterview';
import MockResult from './pages/MockResult';
import History from './pages/History';
import { useAuth } from './context/AuthContext';

const AppLayout = ({ children }) => {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      {user && <Sidebar />}
      <main style={user ? { marginLeft: 'var(--sidebar-width)' } : {}}>
        {children}
      </main>
    </>
  );
};

const ProtectedPage = ({ children }) => (
  <ProtectedRoute>
    {children}
  </ProtectedRoute>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppLayout>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-otp" element={<VerifyOTP />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Protected */}
              <Route path="/dashboard" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
              <Route path="/analyze" element={<ProtectedPage><ResumeAnalyzer /></ProtectedPage>} />
              <Route path="/analyze/:id" element={<ProtectedPage><ResumeAnalyzer /></ProtectedPage>} />
              <Route path="/roadmap" element={<ProtectedPage><RoadmapGenerator /></ProtectedPage>} />
              <Route path="/roadmap/:id" element={<ProtectedPage><RoadmapView /></ProtectedPage>} />
              <Route path="/mock-setup" element={<ProtectedPage><MockSetup /></ProtectedPage>} />
              <Route path="/mock-interview/:id" element={<ProtectedPage><MockInterview /></ProtectedPage>} />
              <Route path="/mock-result/:id" element={<ProtectedPage><MockResult /></ProtectedPage>} />
              <Route path="/history" element={<ProtectedPage><History /></ProtectedPage>} />
            </Routes>
          </AppLayout>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
