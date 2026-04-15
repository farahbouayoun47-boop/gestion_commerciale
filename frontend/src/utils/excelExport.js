import * as XLSX from 'xlsx';

export const exportOrdersToExcel = (orders) => {
  // Flatten order data for Excel
  const excelData = [];

  orders.forEach((order) => {
    if (order.items && order.items.length > 0) {
      order.items.forEach((item, index) => {
        excelData.push({
          'ID Commande': order.id,
          'Numéro': order.numero,
          'Email Client': order.clientEmail,
          'Date': order.date || '',
          'Statut': order.status || 'En attente',
          'Ligne #': index + 1,
          'Code Article': item.code || '',
          'Désignation': item.label || '',
          'Quantité': item.qty || 0,
          'Prix Unitaire (DH)': item.price || 0,
          'Montant (DH)': (item.qty || 0) * (item.price || 0),
          'TVA (%)': order.tva || 0,
          'TVA (DH)': ((item.qty || 0) * (item.price || 0) * (order.tva || 0)) / 100,
          'Total avec TVA (DH)': ((item.qty || 0) * (item.price || 0) * (1 + (order.tva || 0) / 100)),
        });
      });
    } else {
      excelData.push({
        'ID Commande': order.id,
        'Numéro': order.numero,
        'Email Client': order.clientEmail,
        'Date': order.date || '',
        'Statut': order.status || 'En attente',
        'Ligne #': '-',
        'Code Article': '-',
        'Désignation': '-',
        'Quantité': 0,
        'Prix Unitaire (DH)': 0,
        'Montant (DH)': 0,
        'TVA (%)': order.tva || 0,
        'TVA (DH)': 0,
        'Total avec TVA (DH)': 0,
      });
    }
  });

  // Create workbook and worksheet
  const ws = XLSX.utils.json_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Commandes');

  // Set column widths
  ws['!cols'] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 8 },
    { wch: 15 },
    { wch: 20 },
    { wch: 10 },
    { wch: 16 },
    { wch: 14 },
    { wch: 10 },
    { wch: 12 },
    { wch: 16 },
  ];

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `Commandes_${timestamp}.xlsx`;

  // Trigger download
  XLSX.writeFile(wb, filename);
};

export const exportOrderToExcel = (order) => {
  if (!order) return;

  const rows = [
    ['Bon de commande'],
    [],
    ['Référence', order.numero || order.id],
    ['Date', order.date || ''],
    ['Client', order.client || ''],
    ['Email', order.clientEmail || ''],
    ['Statut', order.status || 'En attente'],
    ['Adresse livraison', order.address || ''],
    ['Date de livraison', order.delivery || ''],
    [],
    ['ID', 'Code article', 'Désignation', 'Quantité', 'Prix unitaire (DH)', 'Total HT (DH)'],
  ];

  const items = order.items && order.items.length > 0 ? order.items : [{ code: '-', label: '-', qty: 0, price: 0 }];
  items.forEach((item, index) => {
    const totalHt = (item.qty || 0) * (item.price || 0);
    rows.push([
      order.id,
      item.code || 'N/A',
      item.label || '-',
      item.qty || 0,
      item.price || 0,
      totalHt,
    ]);
  });

  const htValue = items.reduce((sum, item) => sum + ((item.qty || 0) * (item.price || 0)), 0);
  const tvaRate = order.tva || 20;
  const tvaValue = htValue * (tvaRate / 100);
  const totalTtc = htValue + tvaValue;

  rows.push([]);
  rows.push(['', '', '', '', 'Sous-total HT', htValue]);
  rows.push(['', '', '', '', `TVA (${tvaRate}%)`, tvaValue]);
  rows.push(['', '', '', '', 'Total TTC', totalTtc]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Bon de commande');

  ws['!cols'] = [
    { wch: 12 },
    { wch: 16 },
    { wch: 24 },
    { wch: 10 },
    { wch: 18 },
    { wch: 16 },
  ];

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `BonCommande_${order.numero || order.id}_${timestamp}.xlsx`;
  XLSX.writeFile(wb, filename);
};
