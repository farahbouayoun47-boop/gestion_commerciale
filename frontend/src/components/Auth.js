import { useState } from 'react';
import { users } from '../data';

const Auth = ({ onLogin, onSignup }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setForm((state) => ({ ...state, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const normalizedEmail = form.email.trim().toLowerCase();

    if (isLogin) {
      const user = users.find((userItem) => userItem.email === normalizedEmail && userItem.password === form.password);
      if (!user) {
        setError('Email ou mot de passe incorrect');
        return;
      }
      onLogin(user);
      return;
    }

    if (!form.name || !form.email || !form.password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    onSignup({
      id: Date.now(),
      role: 'client',
      name: form.name,
      email: normalizedEmail,
      password: form.password,
      company: 'Nouveau client',
      phone: '',
      address: '',
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl rounded-[2rem] border border-slate-800 bg-slate-900/90 p-10 shadow-soft backdrop-blur-xl">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Gestion commerciale</p>
          <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">{isLogin ? 'Connexion' : 'Créer un compte'}</h1>
          <p className="mt-3 text-slate-400">Accédez à votre espace client ou administrateur.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {!isLogin && (
            <label className="block">
              <span className="text-sm text-slate-300">Nom complet</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-500"
                placeholder="Sara Benali"
              />
            </label>
          )}
          <label className="block">
            <span className="text-sm text-slate-300">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-500"
              placeholder="client@gestion.com"
            />
          </label>
          <label className="block">
            <span className="text-sm text-slate-300">Mot de passe</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-500"
              placeholder="********"
            />
          </label>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button className="w-full rounded-3xl bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:from-sky-400 hover:to-indigo-400">
            {isLogin ? 'Se connecter' : 'Créer un compte'}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-400">
          <span>{isLogin ? 'Pas encore de compte ?' : 'Déjà inscrit ?'}</span>
          <button
            type="button"
            className="font-semibold text-white underline underline-offset-4"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
          >
            {isLogin ? 'Créer un compte' : 'Connexion'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
