import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './client/Sidebar';
import OrderList from './client/OrderList';
import OrderDetails from './client/OrderDetails';
import ClientProfile from './client/ClientProfile';
const ClientDashboard = () => {
  const [currentPage, setCurrentPage] = useState('orders');
  const [pageParams, setPageParams] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const userName = user?.name || 'Utilisateur';

  const handleNavigate = (page, params = {}) => {
    setCurrentPage(page);
    setPageParams(params);
    setSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  const handleLogout = () => {
    logout();
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
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-slate-900 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          userName={userName}
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile menu button */}
        <div className="md:hidden bg-white dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-600 dark:text-slate-400"
          >
            ☰
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </main>
      </div>

    </div>
  );
};

export default ClientDashboard;