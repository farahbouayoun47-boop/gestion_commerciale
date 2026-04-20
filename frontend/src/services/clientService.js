import { getClients, getClientById, createClient, updateClient, deleteClient } from './apiService';
import { getStorageItem, setStorageItem } from '../utils/storage';
import { API_BASE_URL } from '../utils/constants';

const getAuthHeaders = () => {
  const token = getStorageItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

export const getClientsList = async () => {
  try {
    const rawClients = await getClients();
    console.log('Raw clients from API:', rawClients);
    
    // Transform and normalize clients data
    const transformedClients = (rawClients || []).map(client => {
      const transformed = {
        id: client.id,
        nom: client.nom || client.name || client.lastName || '',
        prenom: client.prenom || client.firstName || client.first_name || '',
        email: client.email || client.login || '',
        telephone: client.telephone || client.phone || '',
        entreprise: client.entreprise || client.company || '',
        adresse: client.adresse || client.address || '',
        role: client.role || 'client',
        is_active: client.is_active !== undefined ? client.is_active : true
      };
      console.log(`Transformed client #${client.id}: ${transformed.prenom} ${transformed.nom}`);
      return transformed;
    });
    
    console.log('Total transformed clients:', transformedClients.length);
    return transformedClients;
  } catch (error) {
    console.error('Erreur getClientsList:', error);
    return [];
  }
};

export const getClientByIdService = async (id) => {
  try {
    return await getClientById(id);
  } catch (error) {
    console.error('Erreur getClientByIdService:', error);
    return null;
  }
};

export const createClientService = async (clientData) => {
  try {
    return await createClient(clientData);
  } catch (error) {
    console.error('Erreur createClientService:', error);
    throw error;
  }
};

export const updateClientService = async (id, clientData) => {
  try {
    return await updateClient(id, clientData);
  } catch (error) {
    console.error('Erreur updateClientService:', error);
    throw error;
  }
};

export const deleteClientService = async (id) => {
  try {
    return await deleteClient(id);
  } catch (error) {
    console.error('Erreur deleteClientService:', error);
    throw error;
  }
};

export const getClientProfile = async () => {
  try {
    const userCookie = getStorageItem('user');
    const user = userCookie ? JSON.parse(userCookie) : null;
    if (!user) return null;

    // Pour l'instant, on utilise les données utilisateur stockées dans les cookies
    // Plus tard, on pourra faire un appel API pour récupérer le profil complet
    const [firstName = '', ...restName] = (user.name || '').split(' ');
    const lastName = restName.join(' ');

    return {
      firstName,
      lastName,
      email: user.email || '',
      phone: user.phone || '',
    };
  } catch (error) {
    console.error('Erreur getClientProfile:', error);
    return null;
  }
};

export const updateClientProfile = async (profileData) => {
  try {
    const userCookie = getStorageItem('user');
    const user = userCookie ? JSON.parse(userCookie) : null;
    if (!user) throw new Error('Profil introuvable');

    const profileName = [profileData.firstName, profileData.lastName].filter(Boolean).join(' ') || user.name;

    const updatedUser = {
      ...user,
      name: profileName,
      email: profileData.email?.trim().toLowerCase() || user.email,
      phone: profileData.phone || user.phone || '',
    };

    setStorageItem('user', JSON.stringify(updatedUser));

    // TODO: Appeler l'API pour mettre à jour le profil côté serveur
    // await updateClient(user.id, { name: profileName, email: updatedUser.email, phone: updatedUser.phone });

    return updatedUser;
  } catch (error) {
    console.error('Erreur updateClientProfile:', error);
    throw error;
  }
};

export const changePassword = async (passwordData) => {
  try {
    // TODO: Implémenter le changement de mot de passe via API
    // Pour l'instant, on simule le succès
    console.log('Changement de mot de passe demandé:', passwordData);
    return { success: true };
  } catch (error) {
    console.error('Erreur changePassword:', error);
    throw error;
  }
};

export const submitSupportForm = async (supportData) => {
  try {
    // TODO: Implémenter l'envoi du formulaire de support via API
    // Pour l'instant, on simule l'envoi
    console.log('Formulaire de support soumis:', supportData);
    return {
      id: `TKT-${Math.floor(100 + Math.random() * 900)}`,
      subject: supportData.subject,
      status: 'Ouvert',
      message: supportData.message,
    };
  } catch (error) {
    console.error('Erreur submitSupportForm:', error);
    throw error;
  }
};

export const getNotifications = async () => {
  // TODO: Récupérer les notifications via API
  // Pour l'instant, on retourne un tableau vide
  return [];
};

export const markNotificationAsRead = async (id) => {
  try {
    // TODO: Marquer la notification comme lue via API
    console.log('Notification marquée comme lue:', id);
    return { success: true };
  } catch (error) {
    console.error('Erreur markNotificationAsRead:', error);
    throw error;
  }
};

// Fonctions exportées pour la compatibilité
export { getClientsList as getClients };
export { createClientService as createClient };
export { updateClientService as updateClient };
export { deleteClientService as deleteClient };

export const getPendingUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/pending`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des utilisateurs en attente');
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur getPendingUsers:', error);
    return [];
  }
};

export const approveUser = async (id, approved = true) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}/approve`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ approved }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'approbation de l\'utilisateur');
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur approveUser:', error);
    throw error;
  }
};