import * as XLSX from 'xlsx';

export const importOrdersFromExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Group rows by ID Commande to reconstruct order objects
        const ordersMap = new Map();

        jsonData.forEach((row) => {
          const orderId = row['ID Commande'];
          
          if (!ordersMap.has(orderId)) {
            ordersMap.set(orderId, {
              id: orderId,
              numero: row['Numéro'] || orderId,
              clientEmail: row['Email Client'] || '',
              date: row['Date'] || new Date().toISOString().split('T')[0],
              status: row['Statut'] || 'En attente',
              tva: row['TVA (%)'] || 20,
              items: [],
            });
          }

          const order = ordersMap.get(orderId);

          // Only add item if it has meaningful data
          if (row['Code Article'] && row['Code Article'] !== '-') {
            order.items.push({
              code: row['Code Article'] || '',
              label: row['Désignation'] || '',
              qty: parseInt(row['Quantité']) || 0,
              price: parseFloat(row['Prix Unitaire (DH)']) || 0,
            });
          }
        });

        // Convert map to array
        const importedOrders = Array.from(ordersMap.values());

        // Calculate amounts
        importedOrders.forEach((order) => {
          order.amount = order.items.reduce((sum, item) => sum + item.qty * item.price, 0);
        });

        resolve(importedOrders);
      } catch (error) {
        reject(new Error(`Erreur lors de la lecture du fichier : ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };

    reader.readAsBinaryString(file);
  });
};
