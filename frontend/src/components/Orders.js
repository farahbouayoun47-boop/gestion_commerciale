import { useMemo, useState } from 'react';
import { formatCurrency, getStatusSpan } from '../utils';
import OrderEditForm from './client/OrderEditForm';

const Orders = ({ orders, onSelectOrder, role }) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingOrder, setEditingOrder] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const filteredOrders = useMemo(() => {
    const query = search.toLowerCase();
    return orders.filter((order) => {
      const matchQuery = order.numero.toLowerCase().includes(query) || order.client.toLowerCase().includes(query);
      const matchStatus = status === 'all' || order.status === status;
      const matchStartDate = !startDate || order.date >= startDate;
      const matchEndDate = !endDate || order.date <= endDate;
      return matchQuery && matchStatus && matchStartDate && matchEndDate;
    });
  }, [orders, search, status, startDate, endDate]);

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setShowEditForm(true);
  };

  const closeEditForm = () => {
    setEditingOrder(null);
    setShowEditForm(false);
  };

  const handleOrderSaved = () => {
    closeEditForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-auto">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une commande ou un client"
            className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-500"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full max-w-xs rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none"
        >
          <option value="all">Tous les statuts</option>
          <option value="En attente">En attente</option>
          <option value="En cours">En cours</option>
          <option value="Livrée">Livrée</option>
        </select>
        <div className="flex gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Date début"
            className="rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-500"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Date fin"
            className="rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-500"
          />
        </div>
      </div>
      <div className="overflow-hidden rounded-[1.75rem] border border-slate-800 bg-slate-900/90 shadow-soft">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
          <thead className="bg-slate-950/80 text-slate-400">
            <tr>
              <th className="px-6 py-4">Commande</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Montant</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-950/70">
                <td className="px-6 py-4 text-slate-100">{order.numero}</td>
                <td className="px-6 py-4 text-slate-300">{order.client}</td>
                <td className="px-6 py-4 text-slate-300">{order.date}</td>
                <td className="px-6 py-4 text-slate-100">{formatCurrency(order.amount)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusSpan(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onSelectOrder(order)}
                    className="rounded-3xl bg-slate-800 px-4 py-2 text-sm text-slate-100 transition hover:bg-slate-700 mr-2"
                  >
                    Détails
                  </button>
                  <button
                    onClick={() => handleEditOrder(order)}
                    className="rounded-3xl bg-amber-700 px-4 py-2 text-sm text-slate-100 transition hover:bg-amber-600"
                  >
                    Modifier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {role === 'admin' && (
        <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-white">Créer une nouvelle commande</h3>
          <p className="mt-2 text-slate-400">La création de commande est gérée dans le back-office en production.</p>
        </div>
      )}

      {/* Order Edit Form Modal */}
      {showEditForm && editingOrder && (
        <OrderEditForm
          order={editingOrder}
          onClose={closeEditForm}
          onSave={handleOrderSaved}
        />
      )}
    </div>
  );
};

export default Orders;
