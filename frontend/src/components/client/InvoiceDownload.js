import React, { useState } from 'react';
import { downloadInvoice } from '../../services/orderService';
import { useNotification } from '../../contexts/NotificationContext';

const InvoiceDownload = ({ orderId }) => {
  const [downloading, setDownloading] = useState(false);
  const { addNotification } = useNotification();

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await downloadInvoice(orderId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      addNotification('Facture téléchargée avec succès', 'success');
    } catch (error) {
      addNotification('Erreur lors du téléchargement', 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Téléchargement Facture</h1>

      <div className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Facture Commande #{orderId}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Téléchargez votre facture au format PDF.
        </p>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {downloading ? 'Téléchargement...' : 'Télécharger PDF'}
        </button>
      </div>
    </div>
  );
};

export default InvoiceDownload;