import React, { useState } from 'react';
import { submitSupportForm } from '../../services/clientService';
import { useNotification } from '../../contexts/NotificationContext';

const Support = () => {
  const [form, setForm] = useState({
    category: '',
    subject: '',
    message: '',
  });
  const { addNotification } = useNotification();

  const categories = [
    'Commande',
    'Paiement',
    'Livraison',
    'Produit',
    'Technique',
    'Autre',
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitSupportForm(form);
      addNotification('Demande de support envoyée', 'success');
      setForm({ category: '', subject: '', message: '' });
    } catch (error) {
      addNotification('Erreur lors de l\'envoi', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Support & Contact</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Formulaire de Support
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Catégorie
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Sélectionnez une catégorie</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Sujet
              </label>
              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Message
              </label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                rows={5}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Envoyer
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Informations de Contact
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Email</p>
              <a
                href="mailto:support@gestioncommerciale.com"
                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
              >
                support@gestioncommerciale.com
              </a>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Téléphone</p>
              <a
                href="tel:+33123456789"
                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
              >
                +33 1 23 45 67 89
              </a>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Horaires</p>
              <p className="text-slate-900 dark:text-white">
                Lundi - Vendredi: 9h - 18h<br />
                Samedi: 10h - 16h
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;