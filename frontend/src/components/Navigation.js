const Navigation = ({ role, currentView, onChange, unreadSupport = 0, userName, onLogout, onClose }) => {
  const adminMenu = [
    { key: 'overview', label: 'Tableau de bord' },
    { key: 'orders', label: 'Commandes' },
    { key: 'clients', label: 'Clients' },
    { key: 'profile', label: 'Profil' },
  ];

  const clientMenu = [
    { key: 'overview', label: 'Tableau de bord' },
    { key: 'orders', label: 'Mes commandes' },
    { key: 'profile', label: 'Profil' },
  ];

  const menu = role === 'admin' ? adminMenu : clientMenu;

  return (
    <aside className="w-72 shrink-0 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-soft">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          {userName && <p className="mt-2 text-sm text-slate-400">Bienvenue, {userName}</p>}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-slate-400 hover:bg-slate-800 md:hidden"
          >
            ✕
          </button>
        )}
      </div>

      <nav className="space-y-2">
        {menu.map((item) => (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`w-full rounded-3xl px-4 py-3 text-left text-sm font-semibold transition ${currentView === item.key ? 'bg-slate-800 text-white ring-1 ring-sky-500/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {onLogout && (
        <div className="mt-6 border-t border-slate-800 pt-6">
          <button
            onClick={onLogout}
            className="w-full rounded-3xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
          >
            Déconnexion
          </button>
        </div>
      )}
    </aside>
  );
};

export default Navigation;
