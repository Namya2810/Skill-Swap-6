import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

import Landing    from './pages/Landing';
import Login      from './pages/Login';
import Register   from './pages/Register';
import Dashboard  from './pages/Dashboard';
import Profile    from './pages/Profile';
import Community  from './pages/Community';
import Peers      from './pages/Peers';
import Mentorship from './pages/Mentorship';
import Feedback   from './pages/Feedback';
import Messages   from './pages/Messages';
import Feed       from './pages/Feed';

const Guard = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>;

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/"           element={<Landing />} />
            <Route path="/login"      element={<Login />} />
            <Route path="/register"   element={<Register />} />
            <Route path="/dashboard"  element={<Guard><Dashboard /></Guard>} />
            <Route path="/feed"       element={<Guard><Feed /></Guard>} />
            <Route path="/profile"    element={<Guard><Profile /></Guard>} />
            <Route path="/community"  element={<Guard><Community /></Guard>} />
            <Route path="/peers"      element={<Guard><Peers /></Guard>} />
            <Route path="/mentorship" element={<Guard><Mentorship /></Guard>} />
            <Route path="/messages"   element={<Guard><Messages /></Guard>} />
            <Route path="/feedback"   element={<Guard><Feedback /></Guard>} />
            <Route path="*"           element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
