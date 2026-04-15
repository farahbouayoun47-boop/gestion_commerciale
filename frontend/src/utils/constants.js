// constants.js
export const ORDER_STATUS = {
  PENDING: 'En attente',
  IN_PROGRESS: 'En cours',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

export const NOTIFICATION_MESSAGES = {
  ORDER_CREATED: 'Commande créée avec succès',
  ORDER_UPDATED: 'Commande mise à jour',
  ORDER_DELETED: 'Commande supprimée',
  PROFILE_UPDATED: 'Profil mis à jour',
  PASSWORD_CHANGED: 'Mot de passe changé',
  SUPPORT_SUBMITTED: 'Demande de support envoyée',
};

export const FILTER_STATUS_OPTIONS = [
  { value: 'all', label: 'Toutes' },
  { value: 'En attente', label: 'En attente' },
  { value: 'En cours', label: 'En cours' },
  { value: 'Livrée', label: 'Livrée' },
  { value: 'Annulée', label: 'Annulée' },
];

export const API_BASE_URL = 'http://localhost:3001/api'; // Adjust as needed

export const ITEMS_PER_PAGE = 10;

export const NOTIFICATION_DURATION = 5000;