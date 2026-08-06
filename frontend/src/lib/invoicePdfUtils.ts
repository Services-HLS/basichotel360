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

async function assertPdfBlob(blob: Blob): Promise<Blob> {
  if (!blob || blob.size < 100) {
    throw new Error('Empty PDF received from server');
  }

  const type = (blob.type || '').toLowerCase();
  const maybeText =
    type.includes('json') ||
    type.includes('text') ||
    type.includes('html') ||
    !type.includes('pdf');

  if (maybeText) {
    const header = await blob.slice(0, 5).text();
    if (header.startsWith('%PDF')) return blob;

    const text = await blob.text();
    try {
      const parsed = JSON.parse(text);
      throw new Error(
        parsed.message || parsed.error || 'PDF generation failed on server'
      );
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error(
          'Download did not return a valid PDF. Try again or use web download.'
        );
      }
      throw err;
    }
  }

  return blob;
}

/** Save PDF on web; on APK open share sheet (Save to Files / Print / etc.) */
export async function saveInvoicePdf(blob: Blob, filename: string): Promise<void> {
  const safeName = (filename.endsWith('.pdf') ? filename : `${filename}.pdf`).replace(
    /[^\w.-]+/g,
    '_'
  );
  const pdfBlob = await assertPdfBlob(blob);

  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const base64 = await blobToBase64(pdfBlob);

    // Flat path in Cache — avoids missing subdirectory / FileProvider path issues
    const path = safeName;

    await Filesystem.writeFile({
      path,
      data: base64,
      directory: Directory.Cache,
      recursive: true,
    });

    const { uri } = await Filesystem.getUri({
      directory: Directory.Cache,
      path,
    });

    if (!uri) {
      throw new Error('Could not create a shareable file URI for the invoice PDF');
    }

    try {
      // Android prefers `files` (FileProvider) over `url` for local PDFs
      await Share.share({
        title: 'Hotel360 Invoice',
        text: 'Invoice PDF',
        files: [uri],
        dialogTitle: 'Save or print invoice',
      });
    } catch (shareErr: unknown) {
      // Fallback for older Share plugin behavior
      try {
        await Share.share({
          title: 'Hotel360 Invoice',
          url: uri,
          dialogTitle: 'Save or print invoice',
        });
      } catch {
        const message =
          shareErr instanceof Error ? shareErr.message : 'Share sheet failed';
        throw new Error(
          `PDF saved on device but could not open share menu: ${message}`
        );
      }
    }
    return;
  }

  const url = URL.createObjectURL(pdfBlob);
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

  const pdfBlob = await assertPdfBlob(blob);
  const url = URL.createObjectURL(pdfBlob);
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
  if (!token) {
    throw new Error('Please login again to download the invoice');
  }

  const response = await fetch(`${apiUrl}/bookings/${bookingId}/invoice/pdf`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/pdf',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    try {
      const parsed = JSON.parse(text);
      throw new Error(
        parsed.message || parsed.error || `PDF download failed (${response.status})`
      );
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error(
          text.slice(0, 180) || `PDF download failed (${response.status})`
        );
      }
      throw err;
    }
  }

  const blob = await response.blob();
  return assertPdfBlob(blob);
}
