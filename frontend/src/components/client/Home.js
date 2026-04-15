import React, { useEffect, useState } from 'react';
import Statistics from '../common/Statistics';
import OrderCard from '../common/OrderCard';
import { getClientCommandes, getOrderStatistics } from '../../services/orderService';

const Home = ({ userName, onNavigate }) => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, ordersData] = await Promise.all([
          getOrderStatistics(),
          getClientCommandes(),
        ]);
        setStats(statsData);
        setRecentOrders(ordersData.slice(0, 3));
      } catch (error) {
        console.error('Error loading home data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleViewDetails = (id) => {
    onNavigate('order-details', { orderId: id });
  };

  const handleDelete = (id) => {
    // Implement delete
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Bienvenue, {userName} !
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Voici un aperçu de vos commandes et statistiques.
        </p>
      </div>

      <Statistics stats={stats} loading={loading} />

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Dernières Commandes
          </h2>
          <button
            onClick={() => onNavigate('orders')}
            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
          >
            Voir toutes →
          </button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recentOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;