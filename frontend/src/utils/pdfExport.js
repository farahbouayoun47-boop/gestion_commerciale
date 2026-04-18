import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const getImageDataUrl = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = src;
  });

export const exportOrderToPdf = async (order) => {
  if (!order) return;

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 40;

  let logoDataUrl = null;
  try {
    logoDataUrl = await getImageDataUrl('/logo192.png');
  } catch (error) {
    console.error('PDF logo load failed:', error);
  }

  const logoWidth = 130;
  const logoHeight = 45;
  const headerTop = 20;
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', margin, headerTop, logoWidth, logoHeight);
  }

  const titleY = headerTop + logoHeight + 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('BON DE COMMANDE', margin, titleY);

  const separatorY = titleY + 8;
  doc.setLineWidth(0.8);
  doc.line(margin, separatorY, 560, separatorY);

  const orderBoxY = separatorY + 20;
  const orderBoxHeight = 70;
  const orderBoxWidth = 250;
  doc.setDrawColor(0);
  doc.setLineWidth(0.7);
  doc.rect(margin, orderBoxY, orderBoxWidth, orderBoxHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('N° commande', margin + 8, orderBoxY + 18);
  doc.text('Date', margin + 8, orderBoxY + 34);
  doc.text('Statut', margin + 8, orderBoxY + 50);
  doc.setFont('helvetica', 'normal');
  doc.text(String(order.numero || order.id), margin + 110, orderBoxY + 18);
  doc.text(String(order.date || ''), margin + 110, orderBoxY + 34);
  doc.text(String(order.status || 'En attente'), margin + 110, orderBoxY + 50);

  const customerBoxX = margin + orderBoxWidth + 20;
  const customerBoxWidth = 250;
  const customerBoxHeight = orderBoxHeight;
  doc.rect(customerBoxX, orderBoxY, customerBoxWidth, customerBoxHeight);
  doc.setFont('helvetica', 'bold');
  doc.text('Client / Fournisseur', customerBoxX + 8, orderBoxY + 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(order.client || 'N/A', customerBoxX + 8, orderBoxY + 34);
  doc.text(order.clientEmail || order.email || '', customerBoxX + 8, orderBoxY + 48);
  doc.text(order.address || order.adresse || '', customerBoxX + 8, orderBoxY + 62);

  const tableY = orderBoxY + orderBoxHeight + 25;
  const rawItems = order.items && order.items.length > 0 ? order.items : order.lignes && order.lignes.length > 0 ? order.lignes : [{ code: '-', label: '-', qty: 0, price: 0 }];
  const normalizedItems = rawItems.map((item) => ({
    code: item.code || item.code_article || '-',
    label: item.label || item.details || item.code_article || '-',
    qty: Number(item.qty ?? item.qte ?? 0),
    price: Number(item.price ?? item.prix_unitaire ?? 0),
  }));

  const tableBody = normalizedItems.map((item) => [
    item.code,
    item.label,
    item.qty,
    formatCurrency(item.price),
    formatCurrency(item.qty * item.price),
  ]);

  autoTable(doc, {
    head: [[
      'Article',
      'Désignation',
      'Qté',
      'Prix unitaire',
      'Total HT',
    ]],
    body: tableBody,
    startY: tableY,
    theme: 'grid',
    headStyles: { fillColor: [63, 81, 181], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 6 },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 220 },
      2: { cellWidth: 50 },
      3: { cellWidth: 90 },
      4: { cellWidth: 90 },
    },
  });

  const finalY = (doc.lastAutoTable?.finalY ?? tableY) + 20;
  const htValue = normalizedItems.reduce((sum, item) => sum + ((item.qty || 0) * (item.price || 0)), 0);
  const tvaRate = order.tva || 20;
  const tvaValue = htValue * (tvaRate / 100);
  const totalTtc = htValue + tvaValue;

  const summaryBoxX = 320;
  const summaryBoxY = finalY;
  const summaryBoxWidth = 220;
  const summaryBoxHeight = 60;
  doc.setDrawColor(0);
  doc.setLineWidth(0.7);
  doc.rect(summaryBoxX, summaryBoxY, summaryBoxWidth, summaryBoxHeight);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Sous-total HT :', summaryBoxX + 10, summaryBoxY + 18);
  doc.text(formatCurrency(htValue), summaryBoxX + 130, summaryBoxY + 18, { align: 'right' });
  doc.text(`TVA (${tvaRate}%) :`, summaryBoxX + 10, summaryBoxY + 34);
  doc.text(formatCurrency(tvaValue), summaryBoxX + 130, summaryBoxY + 34, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text('Total TTC :', summaryBoxX + 10, summaryBoxY + 52);
  doc.text(formatCurrency(totalTtc), summaryBoxX + 130, summaryBoxY + 52, { align: 'right' });

  const fileName = `BonCommande_${order.numero || order.id}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};

const formatCurrency = (value) => {
  return `${Number(value || 0).toFixed(2)} MAD`;
};
