import React from 'react';
import { formatDate, formatPrice, getStatusBadgeClass } from '../../utils/formatters';

const OrderCard = ({ order, onViewDetails }) => {
  return (
    <div className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Commande #{order.id}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {formatDate(order.date)}
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
          {order.status}
        </span>
      </div>
      <div className="mt-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {order.items?.length || 0} article(s)
        </p>
        <p className="text-lg font-bold text-slate-900 dark:text-white">
          {formatPrice(order.amount || order.total || 0)}
        </p>
      </div>
      <div className="mt-4 flex space-x-2">
        <button
          onClick={() => onViewDetails(order.id)}
          className="flex-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Détails
        </button>
      </div>
    </div>
  );
};

export default OrderCard;