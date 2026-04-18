import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getClientCommandes, createCommande, updateCommande, deleteCommande } from '../services/orderService';
import { getClientsList, createClientService, updateClientService, deleteClientService } from '../services/clientService';
import { formatPrice } from '../utils/formatters';
import { exportOrdersToExcel } from '../utils/excelExport';
import { exportOrderToPdf } from '../utils/pdfExport';
import { importOrdersFromExcel } from '../utils/excelImport';
import { getCookie } from '../utils/cookies';
const statusOptions = ['En attente', 'En cours', 'Livrée', 'Annulée'];

const initialOrderForm = {
  id: '',
  numero: '',
  client: '',
  clientId: '',
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
  nom: '',
  prenom: '',
  telephone: '',
  entreprise: '',
  adresse: '',
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
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [quickClientForm, setQuickClientForm] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    entreprise: '',
    adresse: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [orderData, clientData] = await Promise.all([
        getClientCommandes(), 
        getClientsList()
      ]);

      const enrichedOrders = (orderData || []).map((order) => {
        let clientName = order.client;

        if ((!clientName || clientName === 'Client inconnu') && order.User) {
          clientName = `${order.User.prenom || ''} ${order.User.nom || ''}`.trim();
        }

        if ((!clientName || clientName === 'Client inconnu') && order.client_id) {
          const client = clientData.find((c) => String(c.id) === String(order.client_id));
          if (client) {
            clientName = `${client.prenom || ''} ${client.nom || ''}`.trim();
          }
        }

        return {
          ...order,
          client: clientName || 'Client inconnu',
        };
      });

      setOrders(enrichedOrders);
      setClients(clientData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setOrders([]);
      setClients([]);
    }
    setLoading(false);
  };

  const syncClientNames = async () => {
    // Update client names for orders with "Client inconnu" using client_id
    try {
      setMessage('Synchronisation en cours...');
      const ordersToSync = orders.filter(o => o.client === 'Client inconnu' && o.client_id);
      
      if (ordersToSync.length === 0) {
        setMessage('Aucune commande à synchroniser.');
        return;
      }
      
      let syncedCount = 0;
      for (const order of ordersToSync) {
        // Find the client by ID
        const client = clients.find(c => c.id === order.client_id);
        
        if (client) {
          const clientName = `${client.prenom} ${client.nom}`;
          console.log(`Syncing order ${order.numero}: ${order.client} -> ${clientName}`);
          
          // Update ONLY the client name and email fields
          await updateCommande(order.id, { 
            client: clientName,
            clientEmail: client.email 
          });
          syncedCount++;
        } else {
          console.warn(`Client ${order.client_id} not found for order ${order.numero}`);
        }
      }
      
      setMessage(`${syncedCount} commande(s) synchronisée(s) avec succès.`);
      await loadData();
    } catch (error) {
      setMessage(`Erreur lors de la synchronisation: ${error.message}`);
      console.error('Sync error:', error);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user || !user.id) {
      setMessage('Erreur: Utilisateur non authentifié. Veuillez vous reconnecter.');
      return;
    }

    try {
      setLoading(true);
      const importedOrders = await importOrdersFromExcel(file);
      
      // Save to storage via creating each one
      for (const order of importedOrders) {
        // Add user_id to each imported order
        order.user_id = user.id;
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
    const { name, value } = e.target;

    if (name === 'client') {
      const trimmedValue = value.trim();
      const matchedClient = clients.find((c) => {
        const fullName = `${c.prenom} ${c.nom}`.trim();
        const altName = `${c.nom} ${c.prenom}`.trim();
        return [fullName, altName].some((nameValue) => nameValue.toLowerCase() === trimmedValue.toLowerCase());
      });

      setOrderForm({
        ...orderForm,
        client: value,
        clientId: matchedClient?.id || '',
        clientEmail: matchedClient?.email || orderForm.clientEmail,
      });
    } else {
      setOrderForm({ ...orderForm, [name]: value });
    }
  };

  const handleClientChange = (e) => {
    setClientForm({ ...clientForm, [e.target.name]: e.target.value });
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!orderForm.numero || !orderForm.date || !orderForm.itemLabel || !orderForm.client) {
      setMessage('Complétez tous les champs requis (numéro, date, article, client).');
      return;
    }

    if (!user || !user.id) {
      setMessage('Erreur: Utilisateur non authentifié. Veuillez vous reconnecter.');
      return;
    }

    const orderData = {
      numero: orderForm.numero.trim(),
      client: orderForm.client.trim(),
      client_id: orderForm.clientId || undefined,
      clientEmail: orderForm.clientEmail?.trim() || '',
      date: orderForm.date,
      adresse: orderForm.address?.trim() || '',
      delivery: orderForm.delivery?.trim() || '',
      status: orderForm.status,
      lignes: [{
        code_article: orderForm.itemCode?.trim() || '',
        qte: Number(orderForm.itemQty),
        prix_unitaire: Number(orderForm.itemPrice),
        tva: Number(orderForm.tva),
        prix_ttc: Number(orderForm.itemQty) * Number(orderForm.itemPrice) * (1 + Number(orderForm.tva) / 100),
        details: orderForm.itemLabel?.trim() || ''
      }]
    };

    if (user?.role !== 'admin') {
      orderData.user_id = user.id;
    } else if (orderForm.clientId) {
      orderData.user_id = orderForm.clientId;
    }

    if (editingOrder) {
      orderData.modified_by = user.name;
    }

    try {
      if (editingOrder) {
        console.log('Updating order:', orderForm.id, orderData);
        await updateCommande(orderForm.id, orderData);
        setMessage('Commande mise à jour avec succès.');
      } else {
        console.log('Creating new order:', orderData);
        await createCommande(orderData);
        setMessage('Commande ajoutée avec succès.');
      }

      await loadData();
      resetOrderForm();
    } catch (error) {
      const message = error?.message || 'Erreur inconnue';
      setMessage(`Erreur: ${message}`);
      console.error('Order submit error:', error);
    }
  };

  const handleClientSubmit = async (e) => {
    e.preventDefault();
    if (!clientForm.nom || !clientForm.prenom) {
      setMessage('Complétez le nom et le prénom du client.');
      return;
    }

    const clientData = {
      nom: clientForm.nom,
      prenom: clientForm.prenom,
      telephone: clientForm.telephone,
      entreprise: clientForm.entreprise,
      adresse: clientForm.adresse,
    };

    try {
      if (editingClient) {
        await updateClientService(clientForm.id, clientData);
        setMessage('Client mis à jour.');
      } else {
        const defaultLoginBase = `${clientForm.prenom}.${clientForm.nom}`.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
        const login = `${defaultLoginBase || 'client'}@client.local`;
        const password = `Pwd${Math.random().toString(36).slice(2, 10)}`;

        const userData = {
          nom: clientForm.nom,
          prenom: clientForm.prenom,
          email: login,
          login,
          password,
          role: 'client',
        };

        const userResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getCookie('token')}`,
          },
          body: JSON.stringify(userData),
        });

        if (!userResponse.ok) {
          const error = await userResponse.json();
          throw new Error(error.message || 'Erreur lors de la création du compte utilisateur');
        }

        await createClientService(clientData);
        setMessage(`Client et compte utilisateur créés avec succès. Login: ${login}, Mot de passe: ${password}`);
      }

      await loadData();
      resetClientForm();
    } catch (error) {
      const message = error?.message || 'Erreur inconnue';
      if (message.toLowerCase().includes('token invalide') || message.toLowerCase().includes('unauthorized')) {
        setMessage('Accès non autorisé. Vérifiez votre connexion ou utilisez un compte valide.');
      } else {
        setMessage(`Erreur lors de l'enregistrement du client : ${message}`);
      }
    }
  };


  const handleOrderEdit = (order) => {
    const orderItems = order.items || order.lignes || [];
    const selectedClient = clients.find(c => `${c.prenom} ${c.nom}` === order.client);
    
    setEditingOrder(true);
    setOrderForm({
      id: order.id,
      numero: order.numero,
      client: order.client,
      clientId: selectedClient?.id || '',
      clientEmail: order.clientEmail || selectedClient?.email || '',
      date: order.date,
      status: order.status,
      address: order.address || '',
      delivery: order.delivery || '',
      itemCode: orderItems[0]?.code || '',
      itemLabel: orderItems[0]?.label || '',
      itemQty: orderItems[0]?.qty || 1,
      itemPrice: orderItems[0]?.price || 0,
      tva: order.tva || 20,
    });
  };

  const handleClientEdit = (client) => {
    setEditingClient(true);
    setClientForm({
      id: client.id,
      nom: client.nom,
      prenom: client.prenom,
      telephone: client.telephone || '',
      entreprise: client.entreprise || '',
      adresse: client.adresse || '',
    });
  };

  const handleOrderDelete = async (id) => {
    await deleteCommande(id);
    setMessage('Commande supprimée.');
    await loadData();
  };

  const handleClientDelete = async (id) => {
    try {
      await deleteClientService(id);
      setMessage('Client supprimé.');
      await loadData();
    } catch (error) {
      setMessage(`Erreur lors de la suppression: ${error.message}`);
    }
  };

  const handleOrderDetails = (order) => {
    const orderItems = order.items || order.lignes || [];
    const selectedClient = clients.find(c => `${c.prenom} ${c.nom}` === order.client);
    
    setSelectedOrder(order);
    setDetailEditMode(false);
    setDetailForm({
      ...initialOrderForm,
      id: order.id,
      numero: order.numero,
      client: order.client,
      client_id: selectedClient?.id || '',
      clientEmail: order.clientEmail || selectedClient?.email || '',
      date: order.date || '',
      status: order.status || 'En attente',
      address: order.address || '',
      delivery: order.delivery || '',
      itemCode: orderItems[0]?.code || '',
      itemLabel: orderItems[0]?.label || '',
      itemQty: orderItems[0]?.qty || 1,
      itemPrice: orderItems[0]?.price || 0,
      tva: order.tva !== undefined ? order.tva : orderItems[0]?.tva || 20,
    });
    setShowOrderDetailsModal(true);
  };

  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for client dropdown
    if (name === 'client') {
      const selectedClient = clients.find(c => `${c.prenom} ${c.nom}` === value);
      setDetailForm({ 
        ...detailForm, 
        client: value,
        client_id: selectedClient?.id || '',
        clientEmail: selectedClient?.email || ''
      });
    } else {
      setDetailForm({ ...detailForm, [name]: value });
    }
  };

  const handleSaveDetails = async () => {
    if (!selectedOrder) return;

    const tvaValue = detailForm.tva !== undefined && detailForm.tva !== ''
      ? Number(detailForm.tva)
      : selectedOrder.tva || selectedOrder.items?.[0]?.tva || 0;

    const qtyValue = detailForm.itemQty !== undefined && detailForm.itemQty !== ''
      ? Number(detailForm.itemQty)
      : selectedOrder.items?.[0]?.qty || 1;

    const priceValue = detailForm.itemPrice !== undefined && detailForm.itemPrice !== ''
      ? Number(detailForm.itemPrice)
      : selectedOrder.items?.[0]?.price || 0;

    const updatedData = {
      numero: detailForm.numero || selectedOrder.numero,
      client: detailForm.client || selectedOrder.client,
      client_id: detailForm.client_id || selectedOrder.client_id,
      clientEmail: detailForm.clientEmail || selectedOrder.clientEmail,
      date: detailForm.date || selectedOrder.date,
      adresse: detailForm.address || selectedOrder.address,
      delivery: detailForm.delivery || selectedOrder.delivery,
      status: detailForm.status || selectedOrder.status,
      lignes: [{
        code_article: detailForm.itemCode || selectedOrder.items?.[0]?.code || selectedOrder.lignes?.[0]?.code_article || '',
        qte: qtyValue,
        prix_unitaire: priceValue,
        tva: tvaValue,
        prix_ttc: parseFloat((qtyValue * priceValue * (1 + tvaValue / 100)).toFixed(2)),
        details: detailForm.itemLabel || selectedOrder.items?.[0]?.label || selectedOrder.lignes?.[0]?.details || ''
      }],
      modified_by: user?.name,
    };

    try {
      console.log('Saving order details:', selectedOrder.id, updatedData);
      const response = await updateCommande(selectedOrder.id, updatedData);
      
      // Extract commande from response (backend returns { commande: {...}, changes: {...} })
      const updatedOrder = response?.commande || response;
      
      // Update the orders list in state
      await loadData();

      // Use the response to update selectedOrder
      if (updatedOrder && updatedOrder.id) {
        setSelectedOrder(updatedOrder);
      }
      
      setDetailEditMode(false);
      setMessage('Commande mise à jour avec succès.');
    } catch (error) {
      const message = error?.message || 'Erreur inconnue';
      setMessage(`Erreur lors de la mise à jour: ${message}`);
    }
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

  const handleQuickClientChange = (e) => {
    setQuickClientForm({ ...quickClientForm, [e.target.name]: e.target.value });
  };

  const handleQuickAddClient = async (e) => {
    e.preventDefault();
    if (!quickClientForm.nom || !quickClientForm.prenom) {
      setMessage('Complétez le nom et le prénom du client.');
      return;
    }

    try {
      const defaultLoginBase = `${quickClientForm.prenom}.${quickClientForm.nom}`
        .toLowerCase()
        .replace(/\s+/g, '.')
        .replace(/[^a-z0-9.]/g, '');
      const login = `${defaultLoginBase || 'client'}@client.local`;
      const password = `Pwd${Math.random().toString(36).slice(2, 10)}`;

      const userResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getCookie('token')}`,
        },
        body: JSON.stringify({
          nom: quickClientForm.nom,
          prenom: quickClientForm.prenom,
          email: login,
          login,
          password,
          role: 'client',
        }),
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.message || 'Erreur lors de la création du compte utilisateur');
      }

      const newClient = await createClientService(quickClientForm);
      setMessage(`Client ajouté avec succès. Login: ${login}, Mot de passe: ${password}`);
      setShowAddClientModal(false);
      
      const newClientName = `${quickClientForm.prenom} ${quickClientForm.nom}`;
      setQuickClientForm({
        nom: '',
        prenom: '',
        telephone: '',
        entreprise: '',
        adresse: '',
      });
      
      await loadData();
      
      // Auto-select the newly created client
      setOrderForm({ 
        ...orderForm, 
        client: newClientName,
        clientId: newClient?.id || '',
        clientEmail: newClient?.email || ''
      });
    } catch (error) {
      setMessage(`Erreur lors de l'ajout du client : ${error.message}`);
    }
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
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard Administrateur</h1>
              <p className="text-slate-600 dark:text-slate-400">Bienvenue, {user?.name}. Gérez les commandes et les clients depuis ici.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={() => setActiveTab('profile')}
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Profil
              </button>
              <button
                onClick={logout}
                className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Déconnexion
              </button>
            </div>
          </div>

          {/* Message Alert */}
          {message && (
            <div className="rounded-lg bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-100 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Clients</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{clients.length}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/20">
                  <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Commandes</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{orders.length}</p>
                </div>
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                  <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-3 border-b border-slate-200 pb-4 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('orders')}
              className={`rounded-lg px-6 py-2.5 text-sm font-medium transition-all duration-200 ${
                activeTab === 'orders'
                  ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
              }`}
            >
              Commandes
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`rounded-lg px-6 py-2.5 text-sm font-medium transition-all duration-200 ${
                activeTab === 'clients'
                  ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
              }`}
            >
              Clients
            </button>
          </div>

        {(() => {
          if (loading) {
            return <div className="rounded-3xl bg-white p-6 shadow dark:bg-slate-800">Chargement...</div>;
          }
          if (activeTab === 'orders') {
            const filteredOrders = (orders || []).filter((order) => {
              const query = searchQuery.toLowerCase();
              const matchQuery = order.numero.toLowerCase().includes(query) || order.client.toLowerCase().includes(query);
              const matchStatus = statusFilter === 'all' || order.status === statusFilter;
              const matchStartDate = !startDate || order.date >= startDate;
              const matchEndDate = !endDate || order.date <= endDate;
              return matchQuery && matchStatus && matchStartDate && matchEndDate;
            });

            const startIndex = (currentPage - 1) * ordersPerPage;
            const paginatedOrders = filteredOrders.slice(startIndex, startIndex + ordersPerPage);
            const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

            return (
              <div className="grid gap-8 xl:grid-cols-[3fr_1fr]">
                {/* Orders List Section */}
                <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                  {/* Header with Actions */}
                  <div className="mb-8 space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Liste des commandes</h2>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => resetOrderForm()}
                          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                          Nouvelle commande
                        </button>
                      </div>
                    </div>

                    {/* Export/Import Actions */}
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        onClick={() => exportOrdersToExcel(filteredOrders)}
                        className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      >
                        Télécharger Excel
                      </button>
                      <button
                        onClick={handleImportClick}
                        className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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

                    {/* Filters */}
                    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr]">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        placeholder="Rechercher numéro / client"
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
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Client</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Date</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Montant</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Statut</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-700 dark:bg-slate-800">
                        {paginatedOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                            <td className="px-6 py-4 text-slate-900 dark:text-white font-medium border-r border-slate-100 dark:border-slate-700 last:border-r-0">{order.numero}</td>
                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-700 last:border-r-0">{order.client}</td>
                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-700 last:border-r-0">{order.date}</td>
                            <td className="px-6 py-4 text-right text-slate-900 dark:text-white font-medium border-r border-slate-100 dark:border-slate-700 last:border-r-0">{formatPrice(order.amount || 0)}</td>
                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-700 last:border-r-0">
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
                                onClick={() => handleOrderEdit(order)}
                                className="inline-flex items-center rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                              >
                                Modifier
                              </button>
                              <button
                                onClick={() => handleOrderDelete(order.id)}
                                className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                              >
                                Supprimer
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-between">
                      <div className="text-sm text-slate-700 dark:text-slate-300">
                        Affichage de {Math.min((currentPage - 1) * ordersPerPage + 1, filteredOrders.length)} à {Math.min(currentPage * ordersPerPage, filteredOrders.length)} sur {filteredOrders.length} commandes
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          Précédent
                        </button>
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          Page {currentPage} sur {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          Suivant
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                {/* Order Form Section */}
                <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {editingOrder ? 'Modifier commande' : 'Ajouter commande'}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      {editingOrder ? 'Modifiez les informations de la commande' : 'Créez une nouvelle commande pour un client'}
                    </p>
                  </div>

                  <form className="space-y-6" onSubmit={handleOrderSubmit}>
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 pb-2 dark:border-slate-700">
                        Informations générales
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Numéro commande *
                          </label>
                          <input
                            name="numero"
                            value={orderForm.numero}
                            onChange={handleOrderChange}
                            placeholder="Ex: CMD-001"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Client *
                          </label>
                          <div className="flex gap-2">
                            <input
                              name="client"
                              value={orderForm.client}
                              onChange={handleOrderChange}
                              placeholder="Nom du client"
                              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowAddClientModal(true)}
                              className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              title="Ajouter un nouveau client"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Email client
                          </label>
                          <input
                            name="clientEmail"
                            type="email"
                            value={orderForm.clientEmail}
                            onChange={handleOrderChange}
                            placeholder="client@example.com"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Statut *
                          </label>
                          <select
                            name="status"
                            value={orderForm.status}
                            onChange={handleOrderChange}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            required
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Dates and Delivery */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 pb-2 dark:border-slate-700">
                        Dates et livraison
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Date commande *
                          </label>
                          <input
                            name="date"
                            type="date"
                            value={orderForm.date}
                            onChange={handleOrderChange}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Date livraison
                          </label>
                          <input
                            name="delivery"
                            type="date"
                            value={orderForm.delivery}
                            onChange={handleOrderChange}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Adresse de livraison
                        </label>
                        <input
                          name="address"
                          value={orderForm.address}
                          onChange={handleOrderChange}
                          placeholder="123 Rue de la Paix, 75000 Paris"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Product Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 pb-2 dark:border-slate-700">
                        Informations produit
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Code article
                          </label>
                          <input
                            name="itemCode"
                            value={orderForm.itemCode}
                            onChange={handleOrderChange}
                            placeholder="ART-001"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Article
                          </label>
                          <input
                            name="itemLabel"
                            value={orderForm.itemLabel}
                            onChange={handleOrderChange}
                            placeholder="Ordinateur portable"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Quantité *
                          </label>
                          <input
                            name="itemQty"
                            type="number"
                            min="1"
                            value={orderForm.itemQty}
                            onChange={handleOrderChange}
                            placeholder="1"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Prix HT (DH) *
                          </label>
                          <input
                            name="itemPrice"
                            type="number"
                            min="0"
                            step="0.01"
                            value={orderForm.itemPrice}
                            onChange={handleOrderChange}
                            placeholder="100.00"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            TVA (%)
                          </label>
                          <input
                            name="tva"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={orderForm.tva}
                            onChange={handleOrderChange}
                            placeholder="20.00"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex flex-col gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                      <button
                        type="submit"
                        className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        {editingOrder ? 'Enregistrer les modifications' : 'Créer la commande'}
                      </button>
                      {editingOrder && (
                        <button
                          type="button"
                          onClick={resetOrderForm}
                          className="w-full rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
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
              <div className="grid gap-8 xl:grid-cols-[2fr_1fr]">
                {/* Clients List Section */}
                <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                  <div className="mb-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Liste des clients</h2>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                          Gérez votre base de données clients
                        </p>
                      </div>
                      <button
                        onClick={() => resetClientForm()}
                        className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        Nouveau client
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                      <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Nom</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Prénom</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Téléphone</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Entreprise</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Adresse</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-700 dark:bg-slate-800">
                        {(clients || []).map((client) => (
                          <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                            <td className="px-6 py-4 text-slate-900 dark:text-white font-medium border-r border-slate-100 dark:border-slate-700 last:border-r-0">{client.nom}</td>
                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-700 last:border-r-0">{client.prenom}</td>
                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-mono border-r border-slate-100 dark:border-slate-700 last:border-r-0">{client.telephone || '-'}</td>
                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-700 last:border-r-0">{client.entreprise || '-'}</td>
                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300 max-w-xs truncate border-r border-slate-100 dark:border-slate-700 last:border-r-0" title={client.adresse}>{client.adresse || '-'}</td>
                            <td className="px-6 py-4 text-right space-x-3">
                              <button
                                onClick={() => handleClientEdit(client)}
                                className="inline-flex items-center rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                              >
                                Modifier
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Êtes-vous sûr de vouloir supprimer le client ${client.nom} ${client.prenom} ?`)) {
                                    handleClientDelete(client.id);
                                  }
                                }}
                                className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                              >
                                Supprimer
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {clients && clients.length === 0 && (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">Aucun client</h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Commencez par ajouter votre premier client.</p>
                    </div>
                  )}
                </section>

                {/* Client Form Section */}
                <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {editingClient ? 'Modifier client' : 'Ajouter client'}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      {editingClient ? 'Modifiez les informations du client' : 'Ajoutez un nouveau client à votre base de données'}
                    </p>
                  </div>

                  <form className="space-y-6" onSubmit={handleClientSubmit}>
                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 pb-2 dark:border-slate-700">
                        Informations personnelles
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Nom *
                          </label>
                          <input
                            name="nom"
                            value={clientForm.nom}
                            onChange={handleClientChange}
                            placeholder="Dupont"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Prénom *
                          </label>
                          <input
                            name="prenom"
                            value={clientForm.prenom}
                            onChange={handleClientChange}
                            placeholder="Jean"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Téléphone
                        </label>
                        <input
                          name="telephone"
                          value={clientForm.telephone}
                          onChange={handleClientChange}
                          placeholder="+33 6 12 34 56 78"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Company Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 pb-2 dark:border-slate-700">
                        Informations entreprise
                      </h3>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Entreprise
                        </label>
                        <input
                          name="entreprise"
                          value={clientForm.entreprise}
                          onChange={handleClientChange}
                          placeholder="ABC Corporation"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Adresse
                        </label>
                        <input
                          name="adresse"
                          value={clientForm.adresse}
                          onChange={handleClientChange}
                          placeholder="123 Rue de la Paix, 75000 Paris"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Identifiants créés automatiquement à partir du nom du client */}
                    {!editingClient && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        Le login et le mot de passe sont créés automatiquement lors de l'ajout du client.
                      </div>
                    )}

                    {/* Form Actions */}
                    <div className="flex flex-col gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                      <button
                        type="submit"
                        className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        {editingClient ? 'Enregistrer les modifications' : 'Ajouter le client'}
                      </button>
                      {editingClient && (
                        <button
                          type="button"
                          onClick={resetClientForm}
                          className="w-full rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
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
              <div className="max-w-2xl mx-auto">
                <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Mon Profil</h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      Gérez vos informations personnelles et votre mot de passe
                    </p>
                  </div>

                  <form className="space-y-8" onSubmit={handleProfileSubmit}>
                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 pb-2 dark:border-slate-700">
                        Informations personnelles
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Nom complet *
                          </label>
                          <input
                            name="name"
                            value={profileForm.name}
                            onChange={handleProfileChange}
                            placeholder="Votre nom complet"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Email *
                          </label>
                          <input
                            name="email"
                            type="email"
                            value={profileForm.email}
                            onChange={handleProfileChange}
                            placeholder="votre.email@example.com"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Password Change */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 pb-2 dark:border-slate-700">
                        Changer le mot de passe
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Laissez ces champs vides si vous ne souhaitez pas changer votre mot de passe.
                      </p>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Mot de passe actuel
                          </label>
                          <input
                            name="currentPassword"
                            type="password"
                            value={profileForm.currentPassword}
                            onChange={handleProfileChange}
                            placeholder="Votre mot de passe actuel"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                              Nouveau mot de passe
                            </label>
                            <input
                              name="newPassword"
                              type="password"
                              value={profileForm.newPassword}
                              onChange={handleProfileChange}
                              placeholder="Minimum 8 caractères"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                              Confirmer le mot de passe
                            </label>
                            <input
                              name="confirmPassword"
                              type="password"
                              value={profileForm.confirmPassword}
                              onChange={handleProfileChange}
                              placeholder="Répétez le nouveau mot de passe"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex flex-col gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                      <button
                        type="submit"
                        className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        Mettre à jour le profil
                      </button>
                    </div>
                  </form>
                </section>
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
                  <button
                    onClick={handleEditFromModal}
                    className="rounded-md bg-amber-600 px-4 py-2 text-sm text-white hover:bg-amber-700"
                  >
                    Modifier
                  </button>
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
                        <select
                          name="client"
                          value={detailForm.client}
                          onChange={handleDetailChange}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                        >
                          <option value="">Sélectionner un client</option>
                          {clients.map((client) => (
                            <option key={client.id} value={`${client.prenom} ${client.nom}`}>
                              {client.prenom} {client.nom}
                            </option>
                          ))}
                        </select>
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
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Modifié par</p>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedOrder.modified_by || 'N/A'}</p>
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
                        ((selectedOrder.items || selectedOrder.lignes || [])).map((item, index) => {
                          const code = item.code || item.code_article || 'N/A';
                          const label = item.label || item.details || item.code_article || 'N/A';
                          const qty = item.qty || item.qte || 1;
                          const price = parseFloat(item.price || item.prix_unitaire || 0) || 0;

                          return (
                            <tr key={index} className="border-b border-slate-100 dark:border-slate-600">
                              <td className="py-2">{selectedOrder.id}</td>
                              <td className="py-2">{selectedOrder.numero}</td>
                              <td className="py-2">{code}</td>
                              <td className="py-2">{label}</td>
                              <td className="text-right py-2">{qty}</td>
                              <td className="text-right py-2">{formatPrice(price)}</td>
                              <td className="text-right py-2">{formatPrice(price * qty)}</td>
                            </tr>
                          );
                        })
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

      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-800">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Ajouter un client
              </h2>
              <button
                onClick={() => setShowAddClientModal(false)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickAddClient} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nom *
                </label>
                <input
                  name="nom"
                  value={quickClientForm.nom}
                  onChange={handleQuickClientChange}
                  placeholder="Dupont"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Prénom *
                </label>
                <input
                  name="prenom"
                  value={quickClientForm.prenom}
                  onChange={handleQuickClientChange}
                  placeholder="Jean"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Téléphone
                </label>
                <input
                  name="telephone"
                  value={quickClientForm.telephone}
                  onChange={handleQuickClientChange}
                  placeholder="06 12 34 56 78"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Entreprise
                </label>
                <input
                  name="entreprise"
                  value={quickClientForm.entreprise}
                  onChange={handleQuickClientChange}
                  placeholder="SARL Dupont"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Adresse
                </label>
                <input
                  name="adresse"
                  value={quickClientForm.adresse}
                  onChange={handleQuickClientChange}
                  placeholder="123 Rue de la Paix, 75000 Paris"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Ajouter
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  </div>
  );
};

export default AdminDashboard;
