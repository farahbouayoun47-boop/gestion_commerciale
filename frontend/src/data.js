export const users = [
  {
    id: 1,
    role: 'admin',
    name: 'Admin Gestion',
    email: 'admin@gestion.com',
    password: 'admin123',
    company: 'Gestion Commerciale',
  },
  {
    id: 2,
    role: 'client',
    name: 'Sara Benali',
    email: 'client@gestion.com',
    password: 'client123',
    company: 'SBC Entreprise',
    phone: '+212 600 123 456',
    address: '23 Rue des Fleurs, Casablanca',
  },
];

export const products = [
  { id: 1, sku: 'ART-1001', name: 'Clavier mécanique', stock: 24, price: 420 },
  { id: 2, sku: 'ART-1002', name: 'Souris sans fil', stock: 56, price: 220 },
  { id: 3, sku: 'ART-1003', name: 'Écran 24"', stock: 14, price: 1300 },
  { id: 4, sku: 'ART-1004', name: 'Chaise de bureau', stock: 9, price: 920 },
];

export const clients = [
  {
    id: 2,
    name: 'Sara Benali',
    company: 'SBC Entreprise',
    email: 'client@gestion.com',
    phone: '+212 600 123 456',
    address: '23 Rue des Fleurs, Casablanca',
    orders: 6,
    totalSpend: 18240,
  },
  {
    id: 3,
    name: 'Karim Ziane',
    company: 'Ziane Market',
    email: 'karim@zianemarket.ma',
    phone: '+212 650 987 321',
    address: '45 Avenue Hassan II, Rabat',
    orders: 10,
    totalSpend: 34500,
  },
  {
    id: 4,
    name: 'Nora Azouzi',
    company: 'Azouzi Import',
    email: 'nora@azouzi.ma',
    phone: '+212 661 543 210',
    address: '12 Boulevard Mohammed V, Marrakech',
    orders: 4,
    totalSpend: 8220,
  },
];

export const orders = [
  {
    id: 'CMD-1001',
    client: 'Sara Benali',
    clientEmail: 'client@gestion.com',
    numero: 'CMD-1001',
    date: '2026-04-05',
    status: 'En attente',
    amount: 2850,
    tva: 20,
    address: '23 Rue des Fleurs, Casablanca',
    delivery: '2026-04-12',
    items: [
      { code: 'ART-1001', label: 'Clavier mécanique', qty: 3, price: 420 },
      { code: 'ART-1002', label: 'Souris sans fil', qty: 2, price: 220 },
    ],
  },
  {
    id: 'CMD-1002',
    client: 'Karim Ziane',
    clientEmail: 'karim@zianemarket.ma',
    numero: 'CMD-1002',
    date: '2026-04-06',
    status: 'En cours',
    amount: 5980,
    tva: 20,
    address: '45 Avenue Hassan II, Rabat',
    delivery: '2026-04-14',
    items: [
      { code: 'ART-1003', label: 'Écran 24"', qty: 2, price: 1300 },
      { code: 'ART-1004', label: 'Chaise de bureau', qty: 3, price: 920 },
    ],
  },
  {
    id: 'CMD-1003',
    client: 'Nora Azouzi',
    clientEmail: 'nora@azouzi.ma',
    numero: 'CMD-1003',
    date: '2026-04-03',
    status: 'Livrée',
    amount: 2100,
    tva: 20,
    address: '12 Boulevard Mohammed V, Marrakech',
    delivery: '2026-04-10',
    items: [
      { code: 'ART-1002', label: 'Souris sans fil', qty: 5, price: 220 },
      { code: 'ART-1001', label: 'Clavier mécanique', qty: 1, price: 420 },
    ],
  },
];

export const supportTickets = [
  {
    id: 'TKT-001',
    subject: 'Facture introuvable',
    status: 'Ouvert',
    client: 'Sara Benali',
    date: '2026-04-07',
    message: 'Je n’arrive pas à télécharger ma facture de commande CMD-1001.',
  },
  {
    id: 'TKT-002',
    subject: 'Demande de délai de livraison',
    status: 'En cours',
    client: 'Karim Ziane',
    date: '2026-04-08',
    message: 'Puis-je décaler la livraison de CMD-1002 de trois jours ?',
  },
];
