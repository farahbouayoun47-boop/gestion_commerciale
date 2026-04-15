import React from 'react';

const Sidebar = ({ currentPage, onNavigate, userName, onClose, onLogout }) => {
  const menuItems = [
    { id: 'orders', label: 'Commandes', icon: '' },
    { id: 'profile', label: 'Profil', icon: '' },
  ];

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold">Gestion Commerciale</h1>
        <button onClick={onClose} className="md:hidden">
          ✕
        </button>
      </div>
      <div className="px-4">
        <p className="text-sm text-slate-400">Bienvenue, {userName}</p>
      </div>
      <nav className="mt-8 flex-1">
        <ul>
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onNavigate(item.id)}
                className={`flex w-full items-center px-4 py-2 text-left hover:bg-slate-800 ${
                  currentPage === item.id ? 'bg-slate-800' : ''
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4">
        <button
          onClick={onLogout}
          className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
};

export default Sidebar;