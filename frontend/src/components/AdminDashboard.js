import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getClientCommandes, createCommande, updateCommande, deleteCommande } from '../services/orderService';
import { getClients, createClient, updateClient, deleteClient } from '../services/clientService';
import { formatPrice } from '../utils/formatters';
import { exportOrdersToExcel } from '../utils/excelExport';
import { exportOrderToPdf } from '../utils/pdfExport';
import { importOrdersFromExcel } from '../utils/excelImport';

const statusOptions = ['En attente', 'En cours', 'Livrée', 'Annulée'];

const initialOrderForm = {
  id: '',
  numero: '',
  client: '',
  clientEmail: '',
  date: '',
  status: 'En attente',
  address: '',
  delivery: '',
  itemCode: '',
  itemLabel: '',
  itemQty: 1,
  itemPrice: 0,
  tva: 20,
};

const initialClientForm = {
  id: '',
  name: '',
  email: '',
  phone: '',
  company: '',
  address: '',
};

const AdminDashboard = () => {
  const { user, logout, updateProfile } = useAuth();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderForm, setOrderForm] = useState(initialOrderForm);
  const [clientForm, setClientForm] = useState(initialClientForm);
  const [editingOrder, setEditingOrder] = useState(false);
  const [editingClient, setEditingClient] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [detailEditMode, setDetailEditMode] = useState(false);
  const [detailForm, setDetailForm] = useState(initialOrderForm);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [orderData, clientData] = await Promise.all([getClientCommandes(), getClients()]);
    setOrders(orderData);
    setClients(clientData);
    setLoading(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const importedOrders = await importOrdersFromExcel(file);
      
      // Save to storage via creating each one
      for (const order of importedOrders) {
        await createCommande(order);
      }
      
      setMessage(`${importedOrders.length} commande(s) importée(s) avec succès.`);
      loadData();
    } catch (error) {
      setMessage(`Erreur lors de l'import : ${error.message}`);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const resetOrderForm = () => {
    setOrderForm(initialOrderForm);
    setEditingOrder(false);
  };

  const resetClientForm = () => {
    setClientForm(initialClientForm);
    setEditingClient(false);
  };

  const handleOrderChange = (e) => {
    setOrderForm({ ...orderForm, [e.target.name]: e.target.value });
  };

  const handleClientChange = (e) => {
    setClientForm({ ...clientForm, [e.target.name]: e.target.value });
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!orderForm.client || !orderForm.clientEmail || !orderForm.numero || !orderForm.date || !orderForm.itemLabel) {
      setMessage('Complétez tous les champs de la commande.');
      return;
    }

    const item = {
      code: orderForm.itemCode,
      label: orderForm.itemLabel,
      qty: Number(orderForm.itemQty),
      price: Number(orderForm.itemPrice),
    };

    const orderData = {
      numero: orderForm.numero,
      client: orderForm.client,
      clientEmail: orderForm.clientEmail,
      date: orderForm.date,
      status: orderForm.status,
      address: orderForm.address,
      delivery: orderForm.delivery,
      items: [item],
      tva: Number(orderForm.tva),
      amount: item.qty * item.price * (1 + Number(orderForm.tva) / 100),
    };

    if (editingOrder) {
      await updateCommande(orderForm.id, orderData);
      setMessage('Commande mise à jour.');
    } else {
      await createCommande(orderData);
      setMessage('Commande ajoutée.');
    }

    await loadData();
    resetOrderForm();
  };

  const handleClientSubmit = async (e) => {
    e.preventDefault();
    if (!clientForm.name || !clientForm.email) {
      setMessage('Complétez le nom et l’email du client.');
      return;
    }

    const clientData = {
      name: clientForm.name,
      email: clientForm.email,
      phone: clientForm.phone,
      company: clientForm.company,
      address: clientForm.address,
    };

    if (editingClient) {
      await updateClient(clientForm.id, clientData);
      setMessage('Client mis à jour.');
    } else {
      await createClient(clientData);
      setMessage('Client ajouté.');
    }

    await loadData();
    resetClientForm();
  };

  const handleOrderEdit = (order) => {
    setEditingOrder(true);
    setOrderForm({
      id: order.id,
      numero: order.numero,
      client: order.client,
      clientEmail: order.clientEmail || '',
      date: order.date,
      status: order.status,
      address: order.address || '',
      delivery: order.delivery || '',
      itemCode: order.items?.[0]?.code || '',
      itemLabel: order.items?.[0]?.label || '',
      itemQty: order.items?.[0]?.qty || 1,
      itemPrice: order.items?.[0]?.price || 0,
      tva: order.tva || 20,
    });
  };

  const handleClientEdit = (client) => {
    setEditingClient(true);
    setClientForm({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
      address: client.address,
    });
  };

  const handleOrderDelete = async (id) => {
    await deleteCommande(id);
    setMessage('Commande supprimée.');
    await loadData();
  };

  const handleClientDelete = async (id) => {
    await deleteClient(id);
    setMessage('Client supprimé.');
    await loadData();
  };

  const handleOrderDetails = (order) => {
    setSelectedOrder(order);
    setDetailEditMode(false);
    setDetailForm({
      ...initialOrderForm,
      id: order.id,
      numero: order.numero,
      client: order.client,
      clientEmail: order.clientEmail || '',
      date: order.date || '',
      status: order.status || 'En attente',
      address: order.address || '',
      delivery: order.delivery || '',
      itemCode: order.items?.[0]?.code || '',
      itemLabel: order.items?.[0]?.label || '',
      itemQty: order.items?.[0]?.qty || 1,
      itemPrice: order.items?.[0]?.price || 0,
      tva: order.tva || 20,
    });
    setShowOrderDetailsModal(true);
  };

  const handleDetailChange = (e) => {
    setDetailForm({ ...detailForm, [e.target.name]: e.target.value });
  };

  const handleSaveDetails = async () => {
    if (!selectedOrder) return;

    const item = {
      code: detailForm.itemCode,
      label: detailForm.itemLabel,
      qty: Number(detailForm.itemQty),
      price: Number(detailForm.itemPrice),
    };

    const updatedData = {
      numero: detailForm.numero,
      client: detailForm.client,
      clientEmail: detailForm.clientEmail,
      date: detailForm.date,
      status: detailForm.status,
      address: detailForm.address,
      delivery: detailForm.delivery,
      items: [item],
      tva: Number(detailForm.tva),
      amount: item.qty * item.price * (1 + Number(detailForm.tva) / 100),
    };

    await updateCommande(selectedOrder.id, updatedData);
    await loadData();
    setSelectedOrder({ ...selectedOrder, ...updatedData });
    setDetailEditMode(false);
    setMessage('Commande mise à jour.');
  };

  const handleEditFromModal = () => {
    setDetailEditMode(true);
  };

  const handleDownloadDetails = async () => {
    if (!selectedOrder) return;
    const orderToExport = detailEditMode
      ? {
          ...selectedOrder,
          numero: detailForm.numero,
          client: detailForm.client,
          clientEmail: detailForm.clientEmail,
          date: detailForm.date,
          status: detailForm.status,
          address: detailForm.address,
          delivery: detailForm.delivery,
          items: [{
            code: detailForm.itemCode,
            label: detailForm.itemLabel,
            qty: Number(detailForm.itemQty),
            price: Number(detailForm.itemPrice),
          }],
          tva: Number(detailForm.tva),
          amount: Number(detailForm.itemQty) * Number(detailForm.itemPrice) * (1 + Number(detailForm.tva) / 100),
        }
      : selectedOrder;
    await exportOrderToPdf(orderToExport);
  };

  const handleCancelDetailEdit = () => {
    if (!selectedOrder) return;
    setDetailEditMode(false);
    setDetailForm({
      ...initialOrderForm,
      id: selectedOrder.id,
      numero: selectedOrder.numero,
      client: selectedOrder.client,
      clientEmail: selectedOrder.clientEmail || '',
      date: selectedOrder.date || '',
      status: selectedOrder.status || 'En attente',
      address: selectedOrder.address || '',
      delivery: selectedOrder.delivery || '',
      itemCode: selectedOrder.items?.[0]?.code || '',
      itemLabel: selectedOrder.items?.[0]?.label || '',
      itemQty: selectedOrder.items?.[0]?.qty || 1,
      itemPrice: selectedOrder.items?.[0]?.price || 0,
      tva: selectedOrder.tva || 20,
    });
  };

  const closeOrderDetailsModal = () => {
    setSelectedOrder(null);
    setShowOrderDetailsModal(false);
    setDetailEditMode(false);
  };

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      setMessage('Les mots de passe ne correspondent pas.');
      return;
    }
    if (profileForm.newPassword && profileForm.currentPassword !== 'RitaFer@2026') {
      setMessage('Mot de passe actuel incorrect.');
      return;
    }

    // Update user info
    const updatedData = {
      name: profileForm.name,
      email: profileForm.email,
    };
    if (profileForm.newPassword) {
      updatedData.password = profileForm.newPassword;
    }
    await updateProfile(updatedData);
    setMessage('Profil mis à jour.');
    setProfileForm({
      ...profileForm,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard Administrateur</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Bienvenue, {user?.name}. Gérez les commandes et les clients depuis ici.</p>
          </div>
          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
            <button
              onClick={() => setActiveTab('profile')}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Profil
            </button>
            <button
              onClick={logout}
              className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Déconnexion
            </button>
          </div>
        </div>

        {message && (
          <div className="rounded-lg bg-emerald-100 p-4 text-slate-900 dark:bg-emerald-900/20 dark:text-emerald-100">
            {message}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow dark:bg-slate-800">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Clients</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">{clients.length}</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow dark:bg-slate-800">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Commandes</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">{orders.length}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          <button
            onClick={() => setActiveTab('orders')}
            className={`rounded-full px-5 py-3 text-sm font-semibold ${activeTab === 'orders' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 shadow dark:bg-slate-800 dark:text-slate-200'}`}
          >
            Commandes
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`rounded-full px-5 py-3 text-sm font-semibold ${activeTab === 'clients' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 shadow dark:bg-slate-800 dark:text-slate-200'}`}
          >
            Clients
          </button>
        </div>

        {(() => {
          if (loading) {
            return <div className="rounded-3xl bg-white p-6 shadow dark:bg-slate-800">Chargement...</div>;
          }
          if (activeTab === 'orders') {
            const filteredOrders = orders.filter((order) => {
              const query = searchQuery.toLowerCase();
              const matchQuery = order.numero.toLowerCase().includes(query) || order.client.toLowerCase().includes(query);
              const matchStatus = statusFilter === 'all' || order.status === statusFilter;
              const matchStartDate = !startDate || order.date >= startDate;
              const matchEndDate = !endDate || order.date <= endDate;
              return matchQuery && matchStatus && matchStartDate && matchEndDate;
            });

            const startIndex = (currentPage - 1) * ordersPerPage;
            const paginatedOrders = filteredOrders.slice(startIndex, startIndex + ordersPerPage);

            return (
              <div className="grid gap-6 xl:grid-cols-[3fr_1fr]">
                <section className="rounded-3xl bg-white p-6 shadow dark:bg-slate-800">
                  <div className="flex flex-col gap-3 mb-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Liste des commandes</h2>
                      <button
                        onClick={() => resetOrderForm()}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
                      >
                        Nouvelle commande
                      </button>
                    </div>
                    <div className="flex flex-col gap-2 md:flex-row">
                      <button
                        onClick={() => exportOrdersToExcel(filteredOrders)}
                        className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
                      >
                         Télécharger Excel
                      </button>
                      <button
                        onClick={handleImportClick}
                        className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                      >
                         Importer Excel
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                    <div className="mt-4 grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr]">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        placeholder="Rechercher numéro / client"
                        className="w-full rounded-3xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                      />
                      <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                      >
                        <option value="all">Tous les statuts</option>
                        <option value="En attente">En attente</option>
                        <option value="En cours">En cours</option>
                        <option value="Livrée">Livrée</option>
                        <option value="Annulée">Annulée</option>
                      </select>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                          className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                        />
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                          className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left text-slate-500 uppercase">Numéro</th>
                          <th className="px-4 py-3 text-left text-slate-500 uppercase">Client</th>
                          <th className="px-4 py-3 text-left text-slate-500 uppercase">Date</th>
                          <th className="px-4 py-3 text-right text-slate-500 uppercase">Montant</th>
                          <th className="px-4 py-3 text-left text-slate-500 uppercase">Statut</th>
                          <th className="px-4 py-3 text-right text-slate-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {paginatedOrders.map((order) => (
                          <tr key={order.id}>
                            <td className="px-4 py-3 text-slate-900 dark:text-white">{order.numero}</td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{order.client}</td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{order.date}</td>
                            <td className="px-4 py-3 text-right text-slate-900 dark:text-white">{formatPrice(order.amount || 0)}</td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{order.status}</td>
                            <td className="px-4 py-3 text-right space-x-2">
                              <button
                                onClick={() => handleOrderDetails(order)}
                                className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                              >
                                Détails
                              </button>
                              <button
                                onClick={() => handleOrderEdit(order)}
                                className="rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                              >
                                Modifier
                              </button>
                              <button
                                onClick={() => handleOrderDelete(order.id)}
                                className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                              >
                                Supprimer
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="rounded-3xl bg-white p-6 shadow dark:bg-slate-800">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                    {editingOrder ? 'Modifier commande' : 'Ajouter commande'}
                  </h2>
                  <form className="space-y-4" onSubmit={handleOrderSubmit}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        name="numero"
                        value={orderForm.numero}
                        onChange={handleOrderChange}
                        placeholder="Numéro commande"
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                      <input
                        name="client"
                        value={orderForm.client}
                        onChange={handleOrderChange}
                        placeholder="Nom du client"
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                      <input
                        name="clientEmail"
                        type="email"
                        value={orderForm.clientEmail}
                        onChange={handleOrderChange}
                        placeholder="Email client"
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        name="date"
                        type="date"
                        value={orderForm.date}
                        onChange={handleOrderChange}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                      <select
                        name="status"
                        value={orderForm.status}
                        onChange={handleOrderChange}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        name="address"
                        value={orderForm.address}
                        onChange={handleOrderChange}
                        placeholder="Adresse de livraison"
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                      <input
                        name="delivery"
                        type="date"
                        value={orderForm.delivery}
                        onChange={handleOrderChange}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <input
                        name="itemCode"
                        value={orderForm.itemCode}
                        onChange={handleOrderChange}
                        placeholder="Code article"
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                      <input
                        name="itemLabel"
                        value={orderForm.itemLabel}
                        onChange={handleOrderChange}
                        placeholder="Article"
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                      <input
                        name="itemQty"
                        type="number"
                        min="1"
                        value={orderForm.itemQty}
                        onChange={handleOrderChange}
                        placeholder="Quantité"
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        name="itemPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={orderForm.itemPrice}
                        onChange={handleOrderChange}
                        placeholder="Prix HT (DH)"
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                      <input
                        name="tva"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={orderForm.tva}
                        onChange={handleOrderChange}
                        placeholder="TVA (%)"
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button type="submit" className="rounded-full bg-indigo-600 px-5 py-2 text-sm text-white hover:bg-indigo-700">
                        {editingOrder ? 'Enregistrer' : 'Ajouter'}
                      </button>
                      {editingOrder && (
                        <button type="button" onClick={resetOrderForm} className="rounded-full border border-slate-300 px-5 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                          Annuler
                        </button>
                      )}
                    </div>
                  </form>
                </section>
              </div>
            );
          }
          if (activeTab === 'clients') {
            return (
              <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
                <section className="rounded-3xl bg-white p-6 shadow dark:bg-slate-800">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Liste des clients</h2>
                    <button
                      onClick={() => resetClientForm()}
                      className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
                    >
                      Nouveau client
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left text-slate-500 uppercase">Nom</th>
                          <th className="px-4 py-3 text-left text-slate-500 uppercase">Email</th>
                          <th className="px-4 py-3 text-left text-slate-500 uppercase">Téléphone</th>
                          <th className="px-4 py-3 text-left text-slate-500 uppercase">Entreprise</th>
                          <th className="px-4 py-3 text-right text-slate-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {clients.map((client) => (
                          <tr key={client.id}>
                            <td className="px-4 py-3 text-slate-900 dark:text-white">{client.name}</td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{client.email}</td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{client.phone}</td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{client.company}</td>
                            <td className="px-4 py-3 text-right space-x-2">
                              <button
                                onClick={() => handleClientEdit(client)}
                                className="rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                              >
                                Modifier
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="rounded-3xl bg-white p-6 shadow dark:bg-slate-800">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                    {editingClient ? 'Modifier client' : 'Ajouter client'}
                  </h2>
                  <form className="space-y-4" onSubmit={handleClientSubmit}>
                    <div className="grid gap-4">
                      <input
                        name="name"
                        value={clientForm.name}
                        onChange={handleClientChange}
                        placeholder="Nom"
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                      <input
                        name="email"
                        type="email"
                        value={clientForm.email}
                        onChange={handleClientChange}
                        placeholder="Email"
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                      <input
                        name="phone"
                        value={clientForm.phone}
                        onChange={handleClientChange}
                        placeholder="Téléphone"
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                      <input
                        name="company"
                        value={clientForm.company}
                        onChange={handleClientChange}
                        placeholder="Entreprise"
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                      <input
                        name="address"
                        value={clientForm.address}
                        onChange={handleClientChange}
                        placeholder="Adresse"
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button type="submit" className="rounded-full bg-indigo-600 px-5 py-2 text-sm text-white hover:bg-indigo-700">
                        {editingClient ? 'Enregistrer' : 'Ajouter'}
                      </button>
                      {editingClient && (
                        <button type="button" onClick={resetClientForm} className="rounded-full border border-slate-300 px-5 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                          Annuler
                        </button>
                      )}
                    </div>
                  </form>
                </section>
              </div>
            );
          }
          if (activeTab === 'profile') {
            return (
              <div className="rounded-3xl bg-white p-6 shadow dark:bg-slate-800">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Mon Profil</h2>
                <form className="space-y-4" onSubmit={handleProfileSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      name="name"
                      value={profileForm.name}
                      onChange={handleProfileChange}
                      placeholder="Nom"
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                    <input
                      name="email"
                      type="email"
                      value={profileForm.email}
                      onChange={handleProfileChange}
                      placeholder="Email"
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <input
                      name="currentPassword"
                      type="password"
                      value={profileForm.currentPassword}
                      onChange={handleProfileChange}
                      placeholder="Mot de passe actuel"
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                    <input
                      name="newPassword"
                      type="password"
                      value={profileForm.newPassword}
                      onChange={handleProfileChange}
                      placeholder="Nouveau mot de passe"
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                    <input
                      name="confirmPassword"
                      type="password"
                      value={profileForm.confirmPassword}
                      onChange={handleProfileChange}
                      placeholder="Confirmer nouveau mot de passe"
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="submit" className="rounded-full bg-indigo-600 px-5 py-2 text-sm text-white hover:bg-indigo-700">
                      Mettre à jour
                    </button>
                  </div>
                </form>
              </div>
            );
          }
          return null;
        })()}
      </div>

      {/* Order Details Modal */}
      {showOrderDetailsModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-w-4xl w-full mx-4 bg-white dark:bg-slate-800 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Détails de la Commande #{selectedOrder.id}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Numéro : {selectedOrder.numero}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {!detailEditMode ? (
                    <button
                      onClick={handleEditFromModal}
                      className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
                    >
                      Modifier
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSaveDetails}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
                      >
                        Enregistrer
                      </button>
                      <button
                        onClick={handleCancelDetailEdit}
                        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        Annuler
                      </button>
                    </>
                  )}
                  <button
                    onClick={handleDownloadDetails}
                    className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
                  >
                    📄 Télécharger PDF
                  </button>
                  <button
                    onClick={closeOrderDetailsModal}
                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Fermer
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-lg bg-slate-50 p-6 dark:bg-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    Informations Générales
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">ID commande</p>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedOrder.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Numéro commande</p>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedOrder.numero}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Client</p>
                      {detailEditMode ? (
                        <input
                          name="client"
                          value={detailForm.client}
                          onChange={handleDetailChange}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                        />
                      ) : (
                        <p className="font-medium text-slate-900 dark:text-white">{selectedOrder.client}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Email client</p>
                      {detailEditMode ? (
                        <input
                          name="clientEmail"
                          type="email"
                          value={detailForm.clientEmail}
                          onChange={handleDetailChange}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                        />
                      ) : (
                        <p className="font-medium text-slate-900 dark:text-white">{selectedOrder.clientEmail}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Date</p>
                      {detailEditMode ? (
                        <input
                          name="date"
                          type="date"
                          value={detailForm.date}
                          onChange={handleDetailChange}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                        />
                      ) : (
                        <p className="font-medium text-slate-900 dark:text-white">{selectedOrder.date}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Statut</p>
                      {detailEditMode ? (
                        <select
                          name="status"
                          value={detailForm.status}
                          onChange={handleDetailChange}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="font-medium text-slate-900 dark:text-white">{selectedOrder.status}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Adresse</p>
                      {detailEditMode ? (
                        <input
                          name="address"
                          value={detailForm.address}
                          onChange={handleDetailChange}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                        />
                      ) : (
                        <p className="font-medium text-slate-900 dark:text-white">{selectedOrder.address || 'N/A'}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Date de livraison</p>
                      {detailEditMode ? (
                        <input
                          name="delivery"
                          type="date"
                          value={detailForm.delivery}
                          onChange={handleDetailChange}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                        />
                      ) : (
                        <p className="font-medium text-slate-900 dark:text-white">{selectedOrder.delivery || 'N/A'}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 p-6 dark:bg-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    Articles
                  </h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-600">
                        <th className="text-left py-2">ID</th>
                        <th className="text-left py-2">Numéro</th>
                        <th className="text-left py-2">Code article</th>
                        <th className="text-left py-2">Désignation</th>
                        <th className="text-right py-2">Quantité</th>
                        <th className="text-right py-2">Prix unitaire</th>
                        <th className="text-right py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailEditMode ? (
                        <tr className="border-b border-slate-100 dark:border-slate-600">
                          <td className="py-2">{selectedOrder.id}</td>
                          <td className="py-2">{selectedOrder.numero}</td>
                          <td className="py-2">
                            <input
                              name="itemCode"
                              value={detailForm.itemCode}
                              onChange={handleDetailChange}
                              className="w-full rounded-xl border border-slate-200 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                            />
                          </td>
                          <td className="py-2">
                            <input
                              name="itemLabel"
                              value={detailForm.itemLabel}
                              onChange={handleDetailChange}
                              className="w-full rounded-xl border border-slate-200 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                            />
                          </td>
                          <td className="text-right py-2">
                            <input
                              name="itemQty"
                              type="number"
                              min="1"
                              value={detailForm.itemQty}
                              onChange={handleDetailChange}
                              className="w-full rounded-xl border border-slate-200 px-2 py-1 text-sm text-right dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                            />
                          </td>
                          <td className="text-right py-2">
                            <input
                              name="itemPrice"
                              type="number"
                              min="0"
                              step="0.01"
                              value={detailForm.itemPrice}
                              onChange={handleDetailChange}
                              className="w-full rounded-xl border border-slate-200 px-2 py-1 text-sm text-right dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                            />
                          </td>
                          <td className="text-right py-2">{formatPrice(detailForm.itemQty * detailForm.itemPrice)}</td>
                        </tr>
                      ) : (
                        selectedOrder.items.map((item, index) => (
                          <tr key={index} className="border-b border-slate-100 dark:border-slate-600">
                            <td className="py-2">{selectedOrder.id}</td>
                            <td className="py-2">{selectedOrder.numero}</td>
                            <td className="py-2">{item.code || 'N/A'}</td>
                            <td className="py-2">{item.label}</td>
                            <td className="text-right py-2">{item.qty}</td>
                            <td className="text-right py-2">{formatPrice(item.price)}</td>
                            <td className="text-right py-2">{formatPrice(item.price * item.qty)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-lg bg-slate-50 p-6 dark:bg-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    Récapitulatif Financier
                  </h3>
                  <div className="space-y-2">
                    {detailEditMode ? (
                      (() => {
                        const itemTotal = Number(detailForm.itemQty) * Number(detailForm.itemPrice);
                        const tvaRate = Number(detailForm.tva) || 0;
                        const ht = itemTotal;
                        const tvaAmount = ht * (tvaRate / 100);
                        const total = ht + tvaAmount;
                        return (
                          <>
                            <div className="flex justify-between">
                              <span>Montant HT</span>
                              <span>{formatPrice(ht)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Montant TVA ({tvaRate}%)</span>
                              <span>{formatPrice(tvaAmount)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg border-t border-slate-200 dark:border-slate-600 pt-2">
                              <span>Total TTC</span>
                              <span>{formatPrice(total)}</span>
                            </div>
                          </>
                        );
                      })()
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span>Montant HT</span>
                          <span>{formatPrice((selectedOrder.amount || 0) / (1 + (selectedOrder.tva || 20) / 100))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Montant TVA ({selectedOrder.tva || 20}%)</span>
                          <span>{formatPrice((selectedOrder.amount || 0) - (selectedOrder.amount || 0) / (1 + (selectedOrder.tva || 20) / 100))}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t border-slate-200 dark:border-slate-600 pt-2">
                          <span>Total TTC</span>
                          <span>{formatPrice(selectedOrder.amount || 0)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
