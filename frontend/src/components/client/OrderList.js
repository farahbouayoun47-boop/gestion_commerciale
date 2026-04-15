import React, { useEffect, useState } from 'react';
import SearchBar from '../common/SearchBar';
import OrderCard from '../common/OrderCard';
import { getClientCommandes } from '../../services/orderService';
import { FILTER_STATUS_OPTIONS } from '../../utils/constants';

const OrderList = ({ onNavigate }) => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await getClientCommandes();
        setOrders(data);
        setFilteredOrders(data);
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  useEffect(() => {
    let filtered = orders.filter((order) => {
      const matchesSearch =
        order.id.toString().includes(searchQuery) ||
        order.date.includes(searchQuery) ||
        order.items.some((item) => item.label.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aValue, bValue;
      if (sortBy === 'date') {
        aValue = new Date(a.date);
        bValue = new Date(b.date);
      } else {
        aValue = a.id;
        bValue = b.id;
      }
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    setFilteredOrders(filtered);
  }, [orders, searchQuery, statusFilter, sortBy, sortOrder]);

  const handleViewDetails = (id) => {
    onNavigate('order-details', { orderId: id });
  };

  const handleDelete = (id) => {
    // Implement delete
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mes Commandes</h1>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <SearchBar
            onSearch={setSearchQuery}
            placeholder="Rechercher par numéro, date ou produit..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        >
          {FILTER_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        >
          <option value="date">Trier par date</option>
          <option value="id">Trier par numéro</option>
        </select>
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>
    </div>
  );
};

export default OrderList;