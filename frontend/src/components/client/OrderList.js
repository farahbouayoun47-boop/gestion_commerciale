import React, { useEffect, useState } from 'react';
import { getClientCommandes } from '../../services/orderService';
import { formatPrice } from '../../utils/formatters';
import { exportOrderToPdf } from '../../utils/pdfExport';

const OrderList = ({ onNavigate }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const ordersPerPage = 5;

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      console.log('Loading client orders...');
      const data = await getClientCommandes();
      console.log('Client orders loaded:', data?.length || 0);
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetailsModal(true);
  };

  const closeOrderDetailsModal = () => {
    setSelectedOrder(null);
    setShowOrderDetailsModal(false);
  };

  const handleDownloadPDF = async (order) => {
    await exportOrderToPdf(order);
  };

  if (loading && orders.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <div className="text-center py-8">
          <p className="text-slate-600 dark:text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  const filteredOrders = (orders || []).filter((order) => {
    const query = searchQuery.toLowerCase();
    const matchQuery = order.numero?.toLowerCase().includes(query) || String(order.id).includes(query);
    const matchStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchStartDate = !startDate || order.date >= startDate;
    const matchEndDate = !endDate || order.date <= endDate;
    return matchQuery && matchStatus && matchStartDate && matchEndDate;
  });

  const startIndex = (currentPage - 1) * ordersPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + ordersPerPage);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  return (
    <div className="space-y-8">
      {/* Statistics Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Commandes</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{orders.length}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/20">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">En attente</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{orders.filter(o => o.status === 'En attente').length}</p>
            </div>
            <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900/20">
              <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Livrées</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{orders.filter(o => o.status === 'Livrée').length}</p>
            </div>
            <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/20">
              <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List Section */}
      <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        {/* Header with Actions */}
        <div className="mb-8 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Mes Commandes</h2>
          </div>



          {/* Filters */}
          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Rechercher numéro / commande"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="En attente">En attente</option>
              <option value="En cours">En cours</option>
              <option value="Livrée">Livrée</option>
              <option value="Annulée">Annulée</option>
            </select>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Numéro</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Date</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Montant</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Statut</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-700 dark:bg-slate-800">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    Aucune commande trouvée
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                    <td className="px-6 py-4 text-slate-900 dark:text-white font-medium border-r border-slate-100 dark:border-slate-700">{order.numero || order.id}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-700">{order.date}</td>
                    <td className="px-6 py-4 text-right text-slate-900 dark:text-white font-medium border-r border-slate-100 dark:border-slate-700">{formatPrice(order.amount || 0)}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-700">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'Livrée' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                        order.status === 'En attente' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                        order.status === 'En cours' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                        'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button
                        onClick={() => handleOrderDetails(order)}
                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Détails
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(order)}
                        className="inline-flex items-center rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                      >
                        PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Page {currentPage} sur {totalPages}
            </div>
            <div className="space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Précédent
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Order Details Modal */}
      {showOrderDetailsModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-800">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Détails de la commande #{selectedOrder.numero || selectedOrder.id}
              </h2>
              <button
                onClick={closeOrderDetailsModal}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Numéro</label>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{selectedOrder.numero || selectedOrder.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Date</label>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{selectedOrder.date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Montant</label>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{formatPrice(selectedOrder.amount || 0)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Statut</label>
                  <p className="mt-1">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedOrder.status === 'Livrée' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                      selectedOrder.status === 'En attente' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      selectedOrder.status === 'En cours' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                      'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {selectedOrder.status}
                    </span>
                  </p>
                </div>
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Articles</label>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
                        <p className="font-medium text-slate-900 dark:text-white">{item.label || item.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Quantité: {item.qty || item.quantity}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Prix: {formatPrice(item.price || 0)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleDownloadPDF(selectedOrder)}
                  className="flex-1 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-700"
                >
                  Télécharger PDF
                </button>
                <button
                  onClick={closeOrderDetailsModal}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Edit Form Modal */}
    </div>
  );
};

export default OrderList;