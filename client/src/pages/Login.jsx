import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isSignup) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    }
  };
  const handleGoogle = async () => {
    setError('');
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-20 px-6">
      <h1 className="text-3xl mb-1">{isSignup ? 'Create account' : 'Welcome back'}</h1>
      <p className="text-ink/60 mb-8 text-sm">
        {isSignup ? 'Sign up to start booking events.' : 'Sign in to manage your bookings.'}
      </p>
      {error && (
        <p className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg mb-4">{error}</p>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border border-ink/15 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="border border-ink/15 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          className="bg-ink text-canvas rounded-lg py-3 text-sm font-medium hover:bg-accent transition-colors"
        >
          {isSignup ? 'Sign up' : 'Sign in'}
        </button>
      </form>
      <div className="flex items-center gap-3 my-5 text-xs text-ink/40">
        <div className="flex-1 h-px bg-ink/10" /> OR <div className="flex-1 h-px bg-ink/10" />
      </div>
      <button
        onClick={handleGoogle}
        className="w-full border border-ink/15 rounded-lg py-3 text-sm font-medium hover:bg-ink/5 transition-colors"
      >
        Continue with Google
      </button>
      <p className="text-center text-sm text-ink/60 mt-6">
        {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => setIsSignup(!isSignup)}
          className="text-accent font-medium hover:underline"
        >
          {isSignup ? 'Sign in' : 'Sign up'}
        </button>
      </p>
    </div>
  );
}
