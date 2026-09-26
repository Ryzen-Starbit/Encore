import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Navbar() {
  const { currentUser, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  return (
    <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
      <Link to="/" className="text-2xl font-display font-semibold tracking-tight">Encore</Link>
      <div className="flex items-center gap-6 text-sm font-medium">
        <Link to="/" className="hover:text-marquee transition-colors">Explore</Link>
        {currentUser ? (
          <>
            <Link to="/profile" className="hover:text-marquee transition-colors">My Bookings</Link>
            {isAdmin && <Link to="/admin" className="hover:text-marquee transition-colors">Admin</Link>}
            <button onClick={handleLogout} className="text-ink/60 hover:text-ink transition-colors">Log out</button>
          </>
        ) : (
          <Link to="/login" className="glow-hover bg-marquee text-stage px-4 py-2 rounded-full transition-colors">Sign in</Link>
        )}
      </div>
    </nav>
  );
}