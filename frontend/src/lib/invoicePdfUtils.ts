import { Capacitor } from '@capacitor/core';
import html2pdf from 'html2pdf.js';

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Save PDF on web; on APK open share sheet (Save to Files / Print / etc.) */
export async function saveInvoicePdf(blob: Blob, filename: string): Promise<void> {
  const safeName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const base64 = await blobToBase64(blob);
    const path = `invoices/${safeName.replace(/[^\w.-]+/g, '_')}`;

    await Filesystem.writeFile({
      path,
      data: base64,
      directory: Directory.Cache,
    });

    const { uri } = await Filesystem.getUri({
      directory: Directory.Cache,
      path,
    });

    await Share.share({
      title: 'Hotel360 Invoice',
      text: 'Invoice PDF',
      url: uri,
      dialogTitle: 'Save or print invoice',
    });
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Open share / print flow — on web opens PDF tab and triggers print dialog */
export async function printInvoicePdf(blob: Blob, filename: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await saveInvoicePdf(blob, filename);
    return;
  }

  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');
  if (!printWindow) {
    URL.revokeObjectURL(url);
    throw new Error('Please allow popups to print the invoice');
  }

  printWindow.onload = () => {
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };
}

export async function htmlContentToPdfBlob(htmlContent: string): Promise<Blob> {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = htmlContent;
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-10000px';
  wrapper.style.top = '0';
  wrapper.style.width = '794px';
  document.body.appendChild(wrapper);

  try {
    const blob = (await html2pdf()
      .set({
        margin: [8, 8, 8, 8],
        filename: 'invoice.pdf',
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(wrapper)
      .outputPdf('blob')) as Blob;
    return blob;
  } finally {
    document.body.removeChild(wrapper);
  }
}

export async function fetchBookingInvoicePdf(
  bookingId: string,
  apiUrl: string
): Promise<Blob> {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${apiUrl}/bookings/${bookingId}/invoice/pdf`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/pdf',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `PDF download failed (${response.status})`);
  }

  return response.blob();
}
