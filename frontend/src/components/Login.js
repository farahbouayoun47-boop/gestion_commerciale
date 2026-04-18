import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { getCookie } from '../utils/cookies';

const Login = () => {
  const [formData, setFormData] = useState({
    name: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const { login } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const credentials = {
        login: formData.name,
        password: formData.password,
      };

      const result = await login(credentials);
      if (result.success) {
        addNotification('Connexion réussie', 'success');
        const userCookie = getCookie('user');
        const userData = userCookie ? JSON.parse(userCookie) : null;
        navigate(userData?.role === 'admin' ? '/admin' : '/client');
      } else {
        addNotification(result.message || 'Erreur de connexion', 'error');
        setMessage(result.message || 'Erreur de connexion');
      }
    } catch (error) {
      addNotification('Erreur lors de la connexion', 'error');
      setMessage('Erreur lors de la connexion');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.25),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.18),_transparent_25%)]" />
        <div className="relative w-full overflow-hidden rounded-[2rem] border border-slate-700 bg-slate-900/80 shadow-2xl backdrop-blur-xl">
          <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr]">
            <div className="relative px-8 py-10 sm:px-12 sm:py-12">
              <div className="mb-8">
                <p className="text-sm uppercase tracking-[0.32em] text-cyan-300">Gestion Commerciale</p>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Connexion sécurisée</h1>
                <p className="mt-4 max-w-xl text-slate-400">Accédez à votre espace après une connexion valide. Les comptes sont créés uniquement par l'administrateur.</p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="name" className="text-sm font-medium text-slate-300">
                    Nom ou email
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                    placeholder="Nom ou email"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="text-sm font-medium text-slate-300">Mot de passe</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                    placeholder="••••••••"
                  />
                </div>

                {message && <p className="rounded-3xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">{message}</p>}

                <button
                  type="submit"
                  className="w-full rounded-3xl bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
                >
                  Se connecter
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-400">
                  Les comptes sont créés uniquement par l'administrateur.
                </p>
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-cyan-500/10 via-slate-900 to-slate-950 px-8 py-10">
              <div>
                <p className="text-sm uppercase tracking-[0.32em] text-cyan-300">Bienvenue</p>
                <h2 className="mt-6 text-4xl font-semibold text-white">Votre espace de gestion</h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;