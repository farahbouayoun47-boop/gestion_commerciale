// formatters.js
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

export const formatDateTime = (date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MAD',
  }).format(price);
};

export const formatNumber = (num) => {
  return new Intl.NumberFormat('fr-FR').format(num);
};

export const getStatusColor = (status) => {
  const colors = {
    'En attente': 'amber',
    'En cours': 'sky',
    'Livrée': 'emerald',
    'Annulée': 'rose',
  };
  return colors[status] || 'slate';
};

export const getStatusBadgeClass = (status) => {
  const color = getStatusColor(status);
  return `bg-${color}-500/15 text-${color}-300 ring-${color}-400/20`;
};

export const calculateTotalTTC = (items, tvaRate = 0.2) => {
  const ht = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return ht * (1 + tvaRate);
};

export const calculateTotalHT = (items) => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^(\+33|0)[1-9](\d{2}){4}$/;
  return re.test(phone);
};

export const getOrderProgress = (status) => {
  const progress = {
    'En attente': 25,
    'En cours': 50,
    'Livrée': 100,
    'Annulée': 0,
  };
  return progress[status] || 0;
};

export const getOrderSteps = () => [
  { label: 'Commande reçue', status: 'En attente' },
  { label: 'En préparation', status: 'En cours' },
  { label: 'Expédiée', status: 'En cours' },
  { label: 'Livrée', status: 'Livrée' },
];

export const getStepStatus = (currentStatus, stepStatus) => {
  if (currentStatus === 'Annulée') return 'cancelled';
  if (getOrderProgress(currentStatus) >= getOrderProgress(stepStatus)) return 'completed';
  if (getOrderProgress(currentStatus) > 0 && getOrderProgress(currentStatus) < getOrderProgress(stepStatus)) return 'current';
  return 'pending';
};