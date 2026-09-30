import { useState } from 'react';
import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm rounded-2xl border border-base-800 bg-base-900 p-8 shadow-2xl"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-500/15">
            <Shield className="text-accent-400" size={24} />
          </div>
          <h1 className="text-lg font-semibold text-base-100">Section Armée 422</h1>
          <p className="text-sm text-base-400">Connexion membres</p>
        </div>

        <label className="mb-3 block text-sm">
          <span className="mb-1 block text-base-300">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-base-700 bg-base-850 px-3 py-2.5 text-base-100 outline-none focus:border-accent-500"
            placeholder="prenom.nom@section.local"
          />
        </label>

        <label className="mb-5 block text-sm">
          <span className="mb-1 block text-base-300">Mot de passe</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-base-700 bg-base-850 px-3 py-2.5 text-base-100 outline-none focus:border-accent-500"
            placeholder="••••••••"
          />
        </label>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent-500 px-4 py-2.5 font-medium text-base-950 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </motion.form>
    </div>
  );
}
