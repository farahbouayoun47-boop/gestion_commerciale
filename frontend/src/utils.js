export const formatCurrency = (value) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MAD',
  }).format(value);
};

export const statusClasses = {
  'En attente': 'bg-amber-500/15 text-amber-300 ring-amber-400/20',
  'En cours': 'bg-sky-500/15 text-sky-300 ring-sky-400/20',
  Livrée: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/20',
  Ouvert: 'bg-rose-500/15 text-rose-300 ring-rose-400/20',
  'En cours': 'bg-sky-500/15 text-sky-300 ring-sky-400/20',
};

export const getStatusSpan = (status) => {
  return statusClasses[status] || 'bg-slate-500/15 text-slate-300 ring-slate-400/20';
};

export const calcStats = (orders) => {
  return {
    totalOrders: orders.length,
    pending: orders.filter((order) => order.status === 'En attente').length,
    inProgress: orders.filter((order) => order.status === 'En cours').length,
    delivered: orders.filter((order) => order.status === 'Livrée').length,
    revenue: orders.reduce((sum, order) => sum + order.amount, 0),
  };
};
