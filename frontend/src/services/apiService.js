import { API_BASE_URL } from '../utils/constants';
import { getCookie } from '../utils/cookies';

const getAuthHeaders = () => {
  const token = getCookie('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

export const getOrders = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/commandes`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des commandes');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Erreur de connexion au serveur');
  }
};

export const getOrderById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/commandes/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Erreur lors de la récupération de la commande');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Erreur de connexion au serveur');
  }
};

export const createOrder = async (orderData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/commandes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la création de la commande');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Erreur de connexion au serveur');
  }
};

export const updateOrder = async (id, orderData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/commandes/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la mise à jour de la commande');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Erreur de connexion au serveur');
  }
};

export const deleteOrder = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/commandes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la suppression de la commande');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Erreur de connexion au serveur');
  }
};

export const getClients = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/clients`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des clients');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Erreur de connexion au serveur');
  }
};

export const getClientById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Erreur lors de la récupération du client');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Erreur de connexion au serveur');
  }
};

export const createClient = async (clientData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/clients`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role: 'client', ...clientData }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la création du client');
    }

    return await response.json();
  } catch (error) {
    console.error('createClient failed:', API_BASE_URL + '/clients', error);
    throw new Error(error.message || `Erreur de connexion au serveur (${API_BASE_URL})`);
  }
};

export const updateClient = async (id, clientData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(clientData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la mise à jour du client');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Erreur de connexion au serveur');
  }
};

export const deleteClient = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la suppression du client');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Erreur de connexion au serveur');
  }
};