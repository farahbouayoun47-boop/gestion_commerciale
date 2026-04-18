import React, { useState, useEffect } from 'react';
import { updateCommande } from '../../services/orderService';
import { formatPrice } from '../../utils/formatters';

const OrderEditForm = ({ order, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    numero: '',
    date: '',
    adresse: '',
    status: 'En attente',
    items: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (order) {
      setFormData({
        numero: order.numero || '',
        date: order.date || '',
        adresse: order.adresse || order.address || '',
        status: order.status || 'En attente',
        items: order.items && order.items.length > 0 
          ? order.items.map(item => ({
              code: item.code || '',
              label: item.label || '',
              qty: item.qty || 1,
              price: item.price || 0
            }))
          : []
      });
    }
  }, [order]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'qty' || field === 'price' ? parseFloat(value) || 0 : value
    };
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { code: '', label: '', qty: 1, price: 0 }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!formData.numero.trim()) {
        setError('Le numéro de commande est obligatoire');
        setLoading(false);
        return;
      }

      if (!formData.date) {
        setError('La date est obligatoire');
        setLoading(false);
        return;
      }

      if (formData.items.length === 0) {
        setError('La commande doit contenir au moins un article');
        setLoading(false);
        return;
      }

      const payload = {
        numero: formData.numero,
        date: formData.date,
        adresse: formData.adresse,
        status: formData.status,
        items: formData.items
      };

      const result = await updateCommande(order.id, payload);
      setSuccess('Commande mise à jour avec succès');
      
      setTimeout(() => {
        if (onSave) {
          onSave(result || payload);
        }
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Erreur lors de la mise à jour de la commande');
      console.error('Error updating order:', err);
    } finally {
      setLoading(false);
    }
  };

  const total = calculateTotal();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-slate-800">
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Modifier la Commande #{formData.numero}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 space-y-6 p-6">
            {/* Messages */}
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-100">
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
            {success && (
              <div className="rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-100">
                <p className="text-sm font-medium">{success}</p>
              </div>
            )}

            {/* Informations Générales */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Informations Générales
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Numéro de commande
                  </label>
                  <input
                    type="text"
                    name="numero"
                    value={formData.numero}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Adresse de livraison
                  </label>
                  <input
                    type="text"
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Statut
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="En attente">En attente</option>
                    <option value="En cours">En cours</option>
                    <option value="Livrée">Livrée</option>
                    <option value="Annulée">Annulée</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Articles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Articles
                </h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  + Ajouter un article
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-600 dark:text-slate-300">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-600 dark:text-slate-300">Désignation</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-600 dark:text-slate-300">Quantité</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-600 dark:text-slate-300">Prix Unit.</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-600 dark:text-slate-300">Total</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-600 dark:text-slate-300">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {formData.items.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={item.code}
                            onChange={(e) => handleItemChange(index, 'code', e.target.value)}
                            placeholder="Code"
                            className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={item.label}
                            onChange={(e) => handleItemChange(index, 'label', e.target.value)}
                            placeholder="Désignation"
                            className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                            min="1"
                            className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-right text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                            min="0"
                            step="0.01"
                            className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-right text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                          />
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-slate-900 dark:text-white">
                          {formatPrice(item.qty * item.price)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="inline-flex items-center rounded-lg bg-red-100 p-2 text-red-600 transition-colors hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                          >
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {formData.items.length === 0 && (
                <p className="py-8 text-center text-slate-500 dark:text-slate-400">
                  Aucun article. Cliquez sur "+ Ajouter un article" pour commencer.
                </p>
              )}
            </div>

            {/* Résumé */}
            {formData.items.length > 0 && (
              <div className="flex justify-end">
                <div className="space-y-2 rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
                  <div className="flex justify-between gap-8">
                    <span className="text-slate-600 dark:text-slate-400">Montant total HT:</span>
                    <span className="font-medium text-slate-900 dark:text-white">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-700/50">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Mise à jour...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderEditForm;
