import { getOrders, getOrderById, createOrder, updateOrder, deleteOrder } from './apiService';

const sortOrdersByDate = (ordersList) => {
  return [...ordersList].sort((a, b) => {
    const dateA = new Date(a.date).getTime() || 0;
    const dateB = new Date(b.date).getTime() || 0;
    return dateB - dateA; // new orders first
  });
};

export const getClientCommandes = async () => {
  try {
    const orders = await getOrders();
    console.log('Raw orders from API:', orders);
    
    // Transform the data to match frontend expectations
    const transformedOrders = (orders || []).map(order => {
      const totalAmount = order.LigneCommandes ? 
        order.LigneCommandes.reduce((sum, ligne) => sum + parseFloat(ligne.prix_ttc || 0), 0) : 0;
      
      // Priorité: 1) client_name field, 2) client field, 3) Client relation, 4) Unknown
      let clientName = 'Client inconnu';
      let clientEmail = '';
      
      if (order.client_name && order.client_name !== 'Client inconnu') {
        // Direct client_name field from backend
        clientName = order.client_name;
        clientEmail = order.clientEmail || '';
      } else if (order.client && typeof order.client === 'string' && order.client !== 'Client inconnu') {
        // Direct client field as string
        clientName = order.client;
        clientEmail = order.clientEmail || '';
      } else if (order.User) {
        // Sequelize relation object from backend
        clientName = `${order.User.prenom || ''} ${order.User.nom || ''}`.trim() || 'Client inconnu';
        clientEmail = order.User.email || '';
      } else if (order.Client) {
        // Older relation naming fallback
        clientName = `${order.Client.prenom || ''} ${order.Client.nom || ''}`.trim() || 'Client inconnu';
        clientEmail = order.Client.email || '';
      } else if (order.client_id || order.user_id) {
        // Has client id but no relation loaded
        clientName = 'Client inconnu';
      }
      
      const lignesSource = order.LigneCommandes || order.lignes || [];
      const transformedLignes = lignesSource.map(ligne => ({
        code: ligne.code_article || ligne.code || '',
        label: ligne.details || ligne.code_article || ligne.label || '',
        qty: ligne.qte || ligne.qty || 1,
        price: parseFloat(ligne.prix_unitaire || ligne.price || 0) || 0
      }));
      
      const transformed = {
        id: order.id,
        numero: order.numero,
        date: order.date,
        address: order.adresse || order.address || '',
        adresse: order.adresse || order.address || '',
        client: clientName,
        clientEmail: clientEmail,
        client_id: order.client_id,
        delivery: order.delivery || null,
        tva: lignesSource[0]?.tva || order.tva || 0,
        amount: totalAmount,
        status: order.status || 'En attente',
        user_id: order.user_id,
        items: transformedLignes,
        lignes: lignesSource
      };
      
      console.log(`Transformed order #${order.numero}:`, transformed);
      return transformed;
    });
    
    console.log('Total transformed orders:', transformedOrders.length);
    return sortOrdersByDate(transformedOrders);
  } catch (error) {
    console.error('Erreur getClientCommandes:', error);
    return [];
  }
};

export const getCommandeById = async (id) => {
  try {
    return await getOrderById(id);
  } catch (error) {
    console.error('Erreur getCommandeById:', error);
    return null;
  }
};

export const createCommande = async (commandeData) => {
  try {
    return await createOrder(commandeData);
  } catch (error) {
    console.error('Erreur createCommande:', error);
    throw error;
  }
};

export const updateCommande = async (id, commandeData) => {
  try {
    return await updateOrder(id, commandeData);
  } catch (error) {
    console.error('Erreur updateCommande:', error);
    throw error;
  }
};

export const deleteCommande = async (id) => {
  try {
    return await deleteOrder(id);
  } catch (error) {
    console.error('Erreur deleteCommande:', error);
    throw error;
  }
};

export const downloadInvoice = async (id) => {
  try {
    const order = await getOrderById(id);
    const content = `Facture pour la commande ${order?.numero || id}\nClient: ${order?.client || 'N/A'}\nMontant: ${order?.amount || 0} MAD`;
    return new Blob([content], { type: 'application/pdf' });
  } catch (error) {
    console.error('Erreur downloadInvoice:', error);
    throw error;
  }
};

export const getCommandesByDateRange = async (startDate, endDate) => {
  try {
    const orders = await getOrders();
    return orders.filter((order) => order.date >= startDate && order.date <= endDate);
  } catch (error) {
    console.error('Erreur getCommandesByDateRange:', error);
    return [];
  }
};

export const getCommandesByStatus = async (status) => {
  try {
    const orders = await getOrders();
    return status === 'all' ? orders : orders.filter((order) => order.status === status);
  } catch (error) {
    console.error('Erreur getCommandesByStatus:', error);
    return [];
  }
};

export const getOrderStatistics = async () => {
  try {
    const orders = await getOrders();
    const totalOrders = orders.length;
    const pending = orders.filter((order) => order.status === 'En attente').length;
    const inProgress = orders.filter((order) => order.status === 'En cours').length;
    const delivered = orders.filter((order) => order.status === 'Livrée').length;
    const revenue = orders.reduce((sum, order) => sum + (order.amount || 0), 0);

    return { totalOrders, pending, inProgress, delivered, revenue };
  } catch (error) {
    console.error('Erreur getOrderStatistics:', error);
    return { totalOrders: 0, pending: 0, inProgress: 0, delivered: 0, revenue: 0 };
  }
};