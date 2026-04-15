import React, { useEffect, useState } from 'react';
import { getCommandeById } from '../../services/orderService';
import { formatDate, formatPrice, getOrderProgress, getOrderSteps, getStepStatus } from '../../utils/formatters';

const OrderDetails = ({ orderId, onNavigate }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const data = await getCommandeById(orderId);
        setOrder(data);
      } catch (error) {
        console.error('Error loading order:', error);
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [orderId]);

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!order) {
    return <div>Commande non trouvée</div>;
  }

  const steps = getOrderSteps();
  const progress = getOrderProgress(order.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <button
          onClick={() => onNavigate('orders')}
          className="mr-4 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
        >
          ← Retour
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Détails de la Commande #{order.id}
        </h1>
      </div>

      <div className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Informations Générales
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">ID commande</p>
            <p className="font-medium text-slate-900 dark:text-white">{order.id}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Numéro commande</p>
            <p className="font-medium text-slate-900 dark:text-white">{order.numero}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Date</p>
            <p className="font-medium text-slate-900 dark:text-white">{formatDate(order.date)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Statut</p>
            <p className="font-medium text-slate-900 dark:text-white">{order.status}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Progression de la Commande
        </h2>
        <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700">
          <div
            className="bg-indigo-600 h-2.5 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="mt-4 flex justify-between">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div
                className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-medium ${
                  getStepStatus(order.status, step.status) === 'completed'
                    ? 'bg-green-500 text-white'
                    : getStepStatus(order.status, step.status) === 'current'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-300 text-slate-600 dark:bg-slate-600 dark:text-slate-400'
                }`}
              >
                {index + 1}
              </div>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{step.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Articles
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="text-left py-2">Code article</th>
              <th className="text-left py-2">Désignation</th>
              <th className="text-right py-2">Quantité</th>
              <th className="text-right py-2">Prix unit.</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={index} className="border-b border-slate-100 dark:border-slate-700">
                <td className="py-2">{item.code || 'N/A'}</td>
                <td className="py-2">{item.label}</td>
                <td className="text-right py-2">{item.qty}</td>
                <td className="text-right py-2">{formatPrice(item.price)}</td>
                <td className="text-right py-2">{formatPrice(item.price * item.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Récapitulatif Financier
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Montant HT</span>
            <span>{formatPrice((order.amount || order.total || 0) / (1 + (order.tva || 20) / 100))}</span>
          </div>
          <div className="flex justify-between">
            <span>Montant TVA ({order.tva || 20}%)</span>
            <span>{formatPrice((order.amount || order.total || 0) - (order.amount || order.total || 0) / (1 + (order.tva || 20) / 100))}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t border-slate-200 dark:border-slate-700 pt-2">
            <span>Total TTC</span>
            <span>{formatPrice(order.amount || order.total || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;