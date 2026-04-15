const Navigation = ({ role, currentView, onChange, unreadSupport }) => {
  const adminMenu = [
    { key: 'overview', label: 'Tableau de bord' },
    { key: 'orders', label: 'Commandes' },
    { key: 'clients', label: 'Clients' },
    { key: 'products', label: 'Produits' },
    { key: 'support', label: 'Support' },
    { key: 'profile', label: 'Profil' },
  ];

  const clientMenu = [
    { key: 'overview', label: 'Tableau de bord' },
    { key: 'orders', label: 'Mes commandes' },
    { key: 'support', label: 'Support' },
    { key: 'profile', label: 'Profil' },
  ];

  const menu = role === 'admin' ? adminMenu : clientMenu;

  return (
    <aside className="hidden w-72 shrink-0 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-soft lg:block">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Espace {role === 'admin' ? 'administrateur' : 'client'}</p>
        <h2 className="mt-4 text-2xl font-semibold text-white">Gestion Commerciale</h2>
      </div>
      <nav className="space-y-2">
        {menu.map((item) => (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`w-full rounded-3xl px-4 py-3 text-left text-sm font-semibold transition ${currentView === item.key ? 'bg-slate-800 text-white ring-1 ring-sky-500/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
          >
            {item.label}
            {item.key === 'support' && unreadSupport > 0 && (
              <span className="ml-2 inline-flex rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-semibold text-white">{unreadSupport}</span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Navigation;
