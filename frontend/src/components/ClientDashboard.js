import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import OrderList from './client/OrderList';
import OrderDetails from './client/OrderDetails';
import ClientProfile from './client/ClientProfile';
const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState('orders');
  const [pageParams, setPageParams] = useState({});

  // Check if user account is approved
  if (!user?.is_active) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-amber-100 p-4 dark:bg-amber-900/20">
                <svg className="h-8 w-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Compte en attente d'approbation</h2>
              <p className="mt-4 text-slate-600 dark:text-slate-400">
                Bienvenue {user?.nom} {user?.prenom}! Votre compte a été créé avec succès, mais il est actuellement en attente d'approbation par l'administrateur.
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                📧 Un email de confirmation a été envoyé à <strong>{user?.email}</strong>
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
              <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">Étapes suivantes:</p>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                  <span>Compte créé</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 font-bold">⏳</span>
                  <span>En attente d'approbation par l'administrateur</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 dark:text-slate-500 font-bold">→</span>
                  <span>Accès à votre tableau de bord</span>
                </li>
              </ul>
            </div>

            <div className="pt-4">
              <button
                onClick={logout}
                className="w-full rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                Déconnexion
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Vous allez recevoir un email dès que votre compte sera approuvé.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleNavigate = (page, params = {}) => {
    setCurrentPage(page);
    setPageParams(params);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'orders':
        return <OrderList onNavigate={handleNavigate} />;
      case 'order-details':
        return <OrderDetails orderId={pageParams.orderId} onNavigate={handleNavigate} />;
      case 'profile':
        return <ClientProfile />;
      default:
        return <OrderList onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="h-screen bg-slate-100 dark:bg-slate-900">
      <main className="h-full overflow-y-auto p-6">
        {/* Header Section */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Mon Tableau de Bord</h1>
            <p className="text-slate-600 dark:text-slate-400">Bienvenue, {user?.nom} {user?.prenom}. Consultez vos commandes et votre profil.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 flex items-center gap-2"
                title="Accéder au tableau de bord administrateur"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin
              </button>
            )}
            <button
              onClick={() => handleNavigate('profile')}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Profil
            </button>
            <button
              onClick={logout}
              className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Déconnexion
            </button>
          </div>
        </div>

        {renderPage()}
      </main>
    </div>
  );
};

export default ClientDashboard;