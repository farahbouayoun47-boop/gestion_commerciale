import { orders } from '../data';

const STORAGE_KEY = 'gestion_commandes';

const getStoredOrders = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [...orders];
};

const saveOrders = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

const sortOrdersByDate = (ordersList) => {
  return [...ordersList].sort((a, b) => {
    const dateA = new Date(a.date).getTime() || 0;
    const dateB = new Date(b.date).getTime() || 0;
    return dateB - dateA; // new orders first
  });
};

export const getClientCommandes = async () => {
  const allOrders = getStoredOrders();
  const user = getCurrentUser();

  const visibleOrders = user?.role === 'client'
    ? allOrders.filter((order) =>
        order.clientEmail === user.email ||
        order.client === user.name ||
        order.client === user.email
      )
    : allOrders;

  return sortOrdersByDate(visibleOrders);
};

export const getCommandeById = async (id) => {
  const allOrders = getStoredOrders();
  return allOrders.find((order) => order.id === id || order.numero === id) || null;
};

export const createCommande = async (commandeData) => {
  const allOrders = getStoredOrders();
  const nextId = `CMD-${Math.floor(1000 + Math.random() * 9000)}`;
  const newOrder = {
    ...commandeData,
    id: nextId,
    numero: nextId,
    status: commandeData.status || 'En attente',
    amount: commandeData.items.reduce((sum, item) => sum + item.qty * item.price, 0),
  };
  const updated = [newOrder, ...allOrders];
  saveOrders(updated);
  return newOrder;
};

export const updateCommande = async (id, commandeData) => {
  const allOrders = getStoredOrders();
  const updated = allOrders.map((order) =>
    order.id === id || order.numero === id ? { ...order, ...commandeData } : order
  );
  saveOrders(updated);
  return updated.find((order) => order.id === id || order.numero === id);
};

export const deleteCommande = async (id) => {
  const allOrders = getStoredOrders();
  const updated = allOrders.filter((order) => order.id !== id && order.numero !== id);
  saveOrders(updated);
  return { success: true };
};

export const downloadInvoice = async (id) => {
  const order = await getCommandeById(id);
  const content = `Facture pour la commande ${order?.numero || id}\nClient: ${order?.client || 'N/A'}\nMontant: ${order?.amount || 0} MAD`;
  return new Blob([content], { type: 'application/pdf' });
};

export const getCommandesByDateRange = async (startDate, endDate) => {
  const allOrders = getStoredOrders();
  return allOrders.filter((order) => order.date >= startDate && order.date <= endDate);
};

export const getCommandesByStatus = async (status) => {
  const allOrders = getStoredOrders();
  return status === 'all' ? allOrders : allOrders.filter((order) => order.status === status);
};

export const getOrderStatistics = async () => {
  const allOrders = getStoredOrders();
  const totalOrders = allOrders.length;
  const pending = allOrders.filter((order) => order.status === 'En attente').length;
  const inProgress = allOrders.filter((order) => order.status === 'En cours').length;
  const delivered = allOrders.filter((order) => order.status === 'Livrée').length;
  const revenue = allOrders.reduce((sum, order) => sum + (order.amount || 0), 0);

  return { totalOrders, pending, inProgress, delivered, revenue };
};