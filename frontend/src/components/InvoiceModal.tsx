

import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Printer, 
  Download, 
  X, 
  FileText, 
  Loader2, 
  Building, 
  User, 
  Phone, 
  Calendar,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Mail,
  MapPin,
  Clock,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { formatGuestsForDisplay } from '@/lib/guestUtils';
import { cn } from '@/lib/utils';
import {
  fetchBookingInvoicePdf,
  htmlContentToPdfBlob,
  printInvoicePdf,
  saveInvoicePdf,
} from '@/lib/invoicePdfUtils';

interface InvoiceModalProps {
  bookingId: string;
  source?: 'database' | 'google_sheets';
  onClose: () => void;
  onDownload?: () => void;
  allowPrint?: boolean;
  allowDownload?: boolean;
  bookingData?: any;
  userData?: any;
}

const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

const InvoiceModal = ({ 
  bookingId, 
  source = 'google_sheets',
  onClose,
  onDownload,
  allowPrint = true,
  allowDownload = true,
  bookingData,
  userData
}: InvoiceModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(source === 'database');
  const [isDownloading, setIsDownloading] = useState(false);
  const [databaseInvoice, setDatabaseInvoice] = useState<any>(null);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Get current user from localStorage
    const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setCurrentUser(storedUser);

    if (source === 'database' && bookingId) {
      fetchDatabaseInvoice();
    } else {
      setLoading(false);
    }
  }, [bookingId, source]);

  // ========== DATABASE FUNCTIONS ==========
  const fetchDatabaseInvoice = async () => {
    try {
      setLoading(true);
      setDatabaseError(null);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${NODE_BACKEND_URL}/bookings/${bookingId}/invoice`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setDatabaseInvoice(result.data);
      } else {
        throw new Error(result.message || 'Invalid invoice data');
      }
    } catch (error: any) {
      console.error('Error fetching database invoice:', error);
      setDatabaseError(error.message || 'Failed to load invoice from database');
      toast({
        title: "Error Loading Invoice",
        description: "Could not fetch invoice data from database",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadDatabaseInvoice = async () => {
    try {
      setIsDownloading(true);
      const blob = await fetchBookingInvoicePdf(bookingId, NODE_BACKEND_URL);
      const invoiceNum = databaseInvoice?.invoiceNumber || bookingId;
      await saveInvoicePdf(blob, `invoice-${invoiceNum}.pdf`);

      toast({
        title: '✅ Invoice PDF ready',
        description: Capacitor.isNativePlatform()
          ? 'Choose Save or Print from the share menu'
          : 'Invoice PDF downloaded successfully',
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Database download error:', error);
      toast({
        title: 'Download Failed',
        description: error.message || 'Failed to download invoice PDF',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // ========== GOOGLE SHEETS FUNCTIONS ==========
  const downloadGoogleSheetsInvoice = async () => {
    try {
      setIsDownloading(true);
      if (!bookingData) {
        throw new Error('Booking data not found');
      }

      const user = userData || currentUser;
      const nights = calculateNights(bookingData.fromDate, bookingData.toDate);
      const htmlContent = createGoogleSheetsPrintHTML(bookingData, user, nights);
      const blob = await htmlContentToPdfBlob(htmlContent);
      await saveInvoicePdf(
        blob,
        `invoice-${bookingId}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
      );

      toast({
        title: '✅ Invoice PDF ready',
        description: Capacitor.isNativePlatform()
          ? 'Choose Save or Print from the share menu'
          : 'Invoice PDF downloaded successfully',
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Google Sheets download error:', error);
      toast({
        title: 'Download Failed',
        description: error?.message || 'Could not download invoice PDF',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDatabasePrint = async (invoice: any) => {
    try {
      setIsDownloading(true);
      const blob = await fetchBookingInvoicePdf(bookingId, NODE_BACKEND_URL);
      const invoiceNum = invoice?.invoiceNumber || bookingId;
      await printInvoicePdf(blob, `invoice-${invoiceNum}.pdf`);
    } catch (error: any) {
      console.error('Database print error:', error);
      toast({
        title: 'Print Error',
        description: error.message || 'Failed to print invoice PDF',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGoogleSheetsPrint = async () => {
    try {
      if (!bookingData) {
        toast({
          title: 'Error',
          description: 'Booking data not found for printing',
          variant: 'destructive',
        });
        return;
      }

      setIsDownloading(true);
      const user = userData || currentUser;
      const nights = calculateNights(bookingData.fromDate, bookingData.toDate);
      const htmlContent = createGoogleSheetsPrintHTML(bookingData, user, nights);
      const blob = await htmlContentToPdfBlob(htmlContent);
      await printInvoicePdf(blob, `invoice-${bookingId}.pdf`);
    } catch (error: any) {
      console.error('Google Sheets print error:', error);
      toast({
        title: 'Print Error',
        description: error?.message || 'Failed to print invoice',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    if (source === 'database' && databaseInvoice) {
      void handleDatabasePrint(databaseInvoice);
    } else if (source === 'google_sheets' && bookingData) {
      void handleGoogleSheetsPrint();
    } else {
      toast({
        title: 'Error',
        description: 'No invoice data available for printing',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = () => {
    if (source === 'database') {
      void downloadDatabaseInvoice();
    } else {
      void downloadGoogleSheetsInvoice();
    }
  };

  // ========== HTML GENERATORS ==========
  const createDatabasePrintHTML = (invoice: any) => {
    const formatDate = (dateStr: string) => {
      if (!dateStr) return 'N/A';
      try {
        const date = new Date(dateStr);
        return format(date, 'dd MMM yyyy');
      } catch {
        return dateStr;
      }
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
      }).format(amount || 0);
    };

    const statusColor = (status: string) => {
      switch(status?.toLowerCase()) {
        case 'completed': return 'completed';
        case 'cancelled': return 'cancelled';
        default: return 'booked';
      }
    };

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice - ${invoice.booking.id}</title>
        <style>
          ${getPrintStyles()}
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="invoice-header">
            <h1 class="hotel-name">${invoice.hotel.name}</h1>
            <p class="invoice-title">TAX INVOICE</p>
            <p class="invoice-number">${invoice.invoiceNumber}</p>
            <div class="hotel-info">
              <p>${invoice.hotel.address}</p>
              <p>Phone: ${invoice.hotel.phone} | Email: ${invoice.hotel.email}</p>
              ${invoice.hotel.gstin ? `<p>GSTIN: ${invoice.hotel.gstin}</p>` : ''}
            </div>
          </div>
          
          <div class="details-grid">
            <div class="section">
              <h3 class="section-title">CUSTOMER DETAILS</h3>
              <div class="detail-item">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${invoice.customer.name}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${invoice.customer.phone}</span>
              </div>
              ${invoice.customer.email ? `
              <div class="detail-item">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${invoice.customer.email}</span>
              </div>
              ` : ''}
              ${invoice.customer.idNumber ? `
              <div class="detail-item">
                <span class="detail-label">${invoice.customer.idType}:</span>
                <span class="detail-value">${invoice.customer.idNumber}</span>
              </div>
              ` : ''}
            </div>
            
            <div class="section">
              <h3 class="section-title">BOOKING DETAILS</h3>
              <div class="detail-item">
                <span class="detail-label">Booking ID:</span>
                <span class="detail-value">${invoice.booking.id}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Room:</span>
                <span class="detail-value">${invoice.booking.roomNumber} (${invoice.booking.roomType})</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Check-In:</span>
                <span class="detail-value">${formatDate(invoice.booking.fromDate)} ${invoice.booking.fromTime || ''}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Check-Out:</span>
                <span class="detail-value">${formatDate(invoice.booking.toDate)} ${invoice.booking.toTime || ''}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Nights:</span>
                <span class="detail-value">${invoice.booking.nights}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Status:</span>
                <span class="detail-value">
                  <span class="status-badge status-${statusColor(invoice.booking.status)}">
                    ${invoice.booking.status.toUpperCase()}
                  </span>
                </span>
              </div>
            </div>
          </div>
          
          <h3 class="section-title">PAYMENT BREAKDOWN</h3>
          <table class="payment-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.charges.map((charge: any) => `
                <tr>
                  <td>${charge.description}</td>
                  <td class="amount-cell">${formatCurrency(charge.amount)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td class="total-cell">TOTAL AMOUNT</td>
                <td class="amount-cell total-cell">
                  ${formatCurrency(invoice.total)}
                </td>
              </tr>
            </tbody>
          </table>
          
          ${invoice.payment ? `
          <div class="payment-info">
            <h3 class="section-title">PAYMENT INFORMATION</h3>
            <div class="detail-item">
              <span class="detail-label">Payment Method:</span>
              <span class="detail-value">${invoice.payment.method}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Payment Status:</span>
              <span class="detail-value">
                <span class="status-badge status-${['paid', 'completed'].includes(invoice.payment.status) ? 'completed' : invoice.payment.status === 'partial' ? 'partial' : 'cancelled'}">
                  ${invoice.payment.status.toUpperCase()}
                </span>
              </span>
            </div>
            ${invoice.payment.transactionId ? `
            <div class="detail-item">
              <span class="detail-label">Transaction ID:</span>
              <span class="detail-value">${invoice.payment.transactionId}</span>
            </div>
            ` : ''}
          </div>
          ` : ''}
          
          <div class="footer-section">
            <p class="thank-you">Thank you for choosing ${invoice.hotel.name}!</p>
            <p class="invoice-note">${invoice.footer.note}</p>
            <div class="signature-section">
              <div class="signature-line"></div>
              <p class="signature-label">Authorized Signature</p>
            </div>
          </div>
        </div>
        
        <div class="print-footer">
          Printed on: ${format(new Date(), 'dd MMM yyyy hh:mm a')}
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(() => window.print(), 500);
          };
          window.onafterprint = function() {
            setTimeout(() => window.close(), 500);
          };
        </script>
      </body>
      </html>
    `;
  };

  const createGoogleSheetsPrintHTML = (booking: any, user: any, nights: number) => {
     const hotelName = user?.hotelName || user?.name || 'Hotel Name';
    const formatDate = (dateStr: string) => {
      if (!dateStr) return 'N/A';
      try {
        const date = new Date(dateStr);
        return format(date, 'dd MMM yyyy');
      } catch {
        return dateStr;
      }
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
      }).format(amount || 0);
    };

    const statusColor = (status: string) => {
      switch(status?.toLowerCase()) {
        case 'completed': return 'completed';
        case 'cancelled': return 'cancelled';
        case 'maintenance': return 'maintenance';
        case 'blocked': return 'blocked';
        default: return 'booked';
      }
    };

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice - ${booking.bookingId || bookingId}</title>
        <style>
          ${getPrintStyles()}
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="invoice-header">
            <h1 class="hotel-name">${hotelName}</h1>
            <p class="invoice-title">INVOICE</p>
            <p class="invoice-number">INV-${(booking.bookingId || bookingId).substring(0, 8).toUpperCase()}</p>
            <div class="hotel-info">
              <p>${user?.address || 'Hotel Address'}</p>
              ${user?.phone ? `<p>Phone: ${user.phone}</p>` : ''}
              ${user?.email ? `<p>Email: ${user.email}</p>` : ''}
              ${user?.gstin ? `<p>GSTIN: ${user.gstin}</p>` : ''}
            </div>
          </div>
          
          <div class="details-grid">
            <div class="section">
              <h3 class="section-title">CUSTOMER DETAILS</h3>
              <div class="detail-item">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${booking.customerName || 'N/A'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${booking.customerPhone || 'N/A'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Booking ID:</span>
                <span class="detail-value">${booking.bookingId || bookingId}</span>
              </div>
            </div>
            
            <div class="section">
              <h3 class="section-title">BOOKING DETAILS</h3>
              <div class="detail-item">
                <span class="detail-label">Room:</span>
                <span class="detail-value">${booking.roomNumber || 'N/A'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Check-In:</span>
                <span class="detail-value">${formatDate(booking.fromDate)} ${booking.fromTime || ''}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Check-Out:</span>
                <span class="detail-value">${formatDate(booking.toDate)} ${booking.toTime || ''}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Nights:</span>
                <span class="detail-value">${nights} night${nights !== 1 ? 's' : ''}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Created:</span>
                <span class="detail-value">${formatDate(booking.createdAt)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Status:</span>
                <span class="detail-value">
                  <span class="status-badge status-${statusColor(booking.status)}">
                    ${(booking.status || 'N/A').toUpperCase()}
                  </span>
                </span>
              </div>
            </div>
          </div>
          
          <h3 class="section-title">PAYMENT BREAKDOWN</h3>
          <table class="payment-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Room Charges ${nights > 0 ? `(${nights} night${nights !== 1 ? 's' : ''})` : ''}</td>
                <td class="amount-cell">${formatCurrency(booking.amount || 0)}</td>
              </tr>
              ${booking.service ? `
              <tr>
                <td>Service Charges ${user?.serviceChargePercentage ? `(${user.serviceChargePercentage}%)` : ''}</td>
                <td class="amount-cell">${formatCurrency(booking.service)}</td>
              </tr>
              ` : ''}
              ${booking.gst ? `
              <tr>
                <td>GST ${user?.gstPercentage ? `(${user.gstPercentage}%)` : ''}</td>
                <td class="amount-cell">${formatCurrency(booking.gst)}</td>
              </tr>
              ` : ''}
              <tr class="total-row">
                <td class="total-cell">TOTAL AMOUNT</td>
                <td class="amount-cell total-cell">
                  ${formatCurrency(booking.total || 
                    (booking.amount || 0) + 
                    (booking.service || 0) + 
                    (booking.gst || 0)
                  )}
                </td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer-section">
            <p class="thank-you">Thank you for choosing ${hotelName}!</p>
            <p class="invoice-note">This is a computer-generated invoice. No signature required.</p>
            <div class="signature-section">
              <div class="signature-line"></div>
              <p class="signature-label">Authorized Signature</p>
            </div>
          </div>
        </div>
        
        <div class="print-footer">
          Printed on: ${format(new Date(), 'dd MMM yyyy hh:mm a')}
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(() => window.print(), 500);
          };
          window.onafterprint = function() {
            setTimeout(() => window.close(), 500);
          };
        </script>
      </body>
      </html>
    `;
  };

  // ========== HELPER FUNCTIONS ==========
  const calculateNights = (fromDate: string, toDate: string): number => {
    if (!fromDate || !toDate) return 0;
    try {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      if (isNaN(from.getTime()) || isNaN(to.getTime())) return 0;
      const timeDiff = Math.abs(to.getTime() - from.getTime());
      const nights = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      return nights > 0 ? nights : 1;
    } catch {
      return 0;
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDateDisplay = (dateString: string): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return format(date, 'dd MMM yyyy');
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string): string => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'blocked': return 'bg-purple-100 text-purple-800';
      case 'booked': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPrintStyles = () => {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      }
      
      body {
        padding: 30px;
        color: #1f2937;
        background: white;
        line-height: 1.5;
      }
      
      .invoice-container {
        max-width: 800px;
        margin: 0 auto;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 40px;
        background: white;
      }
      
      .invoice-header {
        text-align: center;
        margin-bottom: 40px;
        padding-bottom: 20px;
        border-bottom: 2px solid #3b82f6;
      }
      
      .hotel-name {
        font-size: 28px;
        font-weight: 700;
        color: #111827;
        margin-bottom: 8px;
      }
      
      .invoice-title {
        font-size: 18px;
        color: #6b7280;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 2px;
      }
      
      .invoice-number {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 20px;
      }
      
      .hotel-info {
        color: #6b7280;
        font-size: 14px;
        line-height: 1.6;
      }
      
      .details-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        margin: 30px 0;
      }
      
      .section {
        margin-bottom: 20px;
      }
      
      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .detail-item {
        margin-bottom: 12px;
        display: flex;
        justify-content: space-between;
      }
      
      .detail-label {
        color: #6b7280;
        font-weight: 500;
        min-width: 120px;
      }
      
      .detail-value {
        color: #111827;
        font-weight: 600;
        text-align: right;
      }
      
      .payment-table {
        width: 100%;
        border-collapse: collapse;
        margin: 30px 0;
      }
      
      .payment-table th {
        background-color: #f9fafb;
        padding: 12px 16px;
        text-align: left;
        color: #374151;
        font-weight: 600;
        border-bottom: 2px solid #e5e7eb;
      }
      
      .payment-table td {
        padding: 12px 16px;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .amount-cell {
        text-align: right;
        font-weight: 500;
      }
      
      .total-row {
        background-color: #f0f9ff;
      }
      
      .total-cell {
        font-weight: 700;
        font-size: 18px;
        color: #111827;
      }
      
      .payment-info {
        margin: 30px 0;
        padding: 20px;
        background: #f9fafb;
        border-radius: 6px;
      }
      
      .footer-section {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 2px solid #e5e7eb;
        text-align: center;
      }
      
      .thank-you {
        font-size: 16px;
        font-weight: 600;
        color: #111827;
        margin-bottom: 10px;
      }
      
      .invoice-note {
        color: #6b7280;
        font-size: 14px;
        margin-bottom: 20px;
      }
      
      .signature-section {
        margin-top: 40px;
      }
      
      .signature-line {
        width: 200px;
        height: 1px;
        background: #6b7280;
        margin: 0 auto 8px;
      }
      
      .signature-label {
        color: #6b7280;
        font-size: 14px;
      }
      
      .print-footer {
        margin-top: 20px;
        font-size: 12px;
        color: #9ca3af;
        text-align: center;
      }
      
      .status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .status-completed { background: #d1fae5; color: #065f46; }
      .status-cancelled { background: #fee2e2; color: #991b1b; }
      .status-booked { background: #dbeafe; color: #1e40af; }
      .status-maintenance { background: #fef3c7; color: #92400e; }
      .status-blocked { background: #e9d5ff; color: #6b21a8; }
      
      @media print {
        body {
          padding: 20px;
        }
        .invoice-container {
          border: none;
          padding: 0;
        }
      }
    `;
  };

  // ========== RENDER LOGIC ==========
  if (!bookingId) return null;

  // Prepare data for rendering
  const renderBooking = bookingData || databaseInvoice?.booking;
  const renderCustomer = bookingData 
    ? { 
        name: bookingData.customerName, 
        phone: bookingData.customerPhone 
      }
    : databaseInvoice?.customer;

  const nights = renderBooking 
    ? calculateNights(renderBooking.fromDate, renderBooking.toDate)
    : 0;

  const user = userData || currentUser;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          'flex max-h-[min(92dvh,90vh)] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:rounded-lg',
          // Close (X): centered icon, no border/ring
          '[&>button]:right-3 [&>button]:top-3 [&>button]:flex [&>button]:h-9 [&>button]:w-9',
          '[&>button]:items-center [&>button]:justify-center [&>button]:rounded-full',
          '[&>button]:border-0 [&>button]:bg-transparent [&>button]:p-0 [&>button]:shadow-none',
          '[&>button]:ring-0 [&>button]:ring-offset-0 [&>button]:outline-none',
          '[&>button]:focus:ring-0 [&>button]:focus:ring-offset-0 [&>button]:focus-visible:ring-0',
          '[&>button]:focus-visible:outline-none [&>button]:hover:bg-muted/60',
          'sm:[&>button]:right-4 sm:[&>button]:top-4'
        )}
      >
        <div className="shrink-0 border-b px-4 pb-3 pt-4 pr-12">
          <DialogHeader className="space-y-3 text-left">
            <div className="flex min-w-0 items-start gap-2">
              <FileText className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
              <div className="min-w-0">
                <DialogTitle className="text-xl sm:text-2xl">INVOICE</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  Booking #{bookingId}
                  {!allowPrint && !allowDownload
                    ? ' • View only (Basic plan)'
                    : source === 'database'
                      ? ' • Pro Plan'
                      : ' • Basic Plan'}
                </DialogDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {renderBooking?.status && (
                <Badge className={getStatusColor(renderBooking.status)}>
                  {renderBooking.status.toUpperCase()}
                </Badge>
              )}
            </div>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Loading Invoice...</p>
            <p className="text-sm text-muted-foreground mt-2">Please wait</p>
          </div>
        ) : databaseError && source === 'database' ? (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                <h3 className="text-lg font-semibold text-destructive mb-2">
                  Failed to Load Invoice
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {databaseError}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose}>
                    <X className="w-4 h-4 mr-2" />
                    Close
                  </Button>
                  <Button onClick={fetchDatabaseInvoice}>
                    <Loader2 className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Hotel Header */}
            <div className="text-center border-b pb-6" id="invoice-content">
              <div className="mb-4 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
                <Building className="h-8 w-8 shrink-0 text-primary" />
                <h1 className="text-xl font-bold text-primary sm:text-3xl">
                  {source === 'database' && databaseInvoice 
                    ? databaseInvoice.hotel.name 
                    : user?.hotelName || user?.name || 'Hotel Name'
                  }
                </h1>
              </div>
              <div className="space-y-2 text-muted-foreground">
                <p className="flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {source === 'database' && databaseInvoice 
                    ? databaseInvoice.hotel.address 
                    : user?.address || 'Hotel Address'
                  }
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm">
                  {source === 'database' && databaseInvoice ? (
                    <>
                      {databaseInvoice.hotel.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {databaseInvoice.hotel.phone}
                        </span>
                      )}
                      {databaseInvoice.hotel.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {databaseInvoice.hotel.email}
                        </span>
                      )}
                      {databaseInvoice.hotel.gstin && (
                        <span>GSTIN: {databaseInvoice.hotel.gstin}</span>
                      )}
                    </>
                  ) : (
                    <>
                      {user?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {user.phone}
                        </span>
                      )}
                      {user?.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {user.email}
                        </span>
                      )}
                      {user?.gstin && (
                        <span>GSTIN: {user.gstin}</span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Details */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                    <User className="w-5 h-5" />
                    Customer Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium break-words text-right sm:text-left">{renderCustomer?.name || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium break-words text-right sm:text-left">{renderCustomer?.phone || 'N/A'}</span>
                    </div>
                    {source === 'database' && databaseInvoice?.customer?.email && (
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium break-all text-right sm:text-left">{databaseInvoice.customer.email}</span>
                      </div>
                    )}
                    {source === 'database' && databaseInvoice?.customer?.idNumber && (
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-muted-foreground">
                          {databaseInvoice.customer.idType}:
                        </span>
                        <span className="font-medium break-all text-right sm:text-left">{databaseInvoice.customer.idNumber}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Booking Details */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                    <Calendar className="w-5 h-5" />
                    Booking Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Booking ID:</span>
                      <span className="font-medium">{bookingId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Room:</span>
                      <span className="font-medium">
                        {renderBooking?.roomNumber || 'N/A'}
                        {source === 'database' && databaseInvoice?.booking?.roomType && 
                          ` (${databaseInvoice.booking.roomType})`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Check-In:</span>
                      <span className="font-medium">
                        {formatDateDisplay(renderBooking?.fromDate)}
                        {renderBooking?.fromTime && `, ${renderBooking.fromTime}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Check-Out:</span>
                      <span className="font-medium">
                        {formatDateDisplay(renderBooking?.toDate)}
                        {renderBooking?.toTime && `, ${renderBooking.toTime}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{nights} night{nights !== 1 ? 's' : ''}</span>
                    </div>
                    {source === 'database' && databaseInvoice?.booking?.guests && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Guests:</span>
                        <span className="font-medium flex items-center gap-1">
                          <Users className="w-4 h-4" /> {formatGuestsForDisplay(databaseInvoice.booking.guests)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Breakdown */}
            <Card>
              <CardContent className="p-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold mb-6">
                  <CreditCard className="w-5 h-5" />
                  Payment Breakdown
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Description</th>
                        <th className="text-right py-3 px-4 font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {source === 'database' && databaseInvoice ? (
                        <>
                          {databaseInvoice.charges.map((charge: any, index: number) => (
                            <tr key={index} className="border-b">
                              <td className="py-3 px-4">{charge.description}</td>
                              <td className="text-right py-3 px-4 font-medium">
                                {formatCurrency(charge.amount)}
                              </td>
                            </tr>
                          ))}
                        </>
                      ) : (
                        <>
                          <tr className="border-b">
                            <td className="py-3 px-4">
                              <div className="font-medium">Room Charges</div>
                              {nights > 0 && (
                                <div className="text-sm text-muted-foreground">
                                  {nights} night{nights !== 1 ? 's' : ''}
                                </div>
                              )}
                            </td>
                            <td className="text-right py-3 px-4 font-medium">
                              {formatCurrency(renderBooking?.amount || 0)}
                            </td>
                          </tr>
                          {renderBooking?.service && renderBooking.service > 0 && (
                            <tr className="border-b">
                              <td className="py-3 px-4">
                                <div className="font-medium">Service Charges</div>
                                {user?.serviceChargePercentage && (
                                  <div className="text-sm text-muted-foreground">
                                    {user.serviceChargePercentage}%
                                  </div>
                                )}
                              </td>
                              <td className="text-right py-3 px-4 font-medium">
                                {formatCurrency(renderBooking.service)}
                              </td>
                            </tr>
                          )}
                          {renderBooking?.gst && renderBooking.gst > 0 && (
                            <tr className="border-b">
                              <td className="py-3 px-4">
                                <div className="font-medium">GST</div>
                                {user?.gstPercentage && (
                                  <div className="text-sm text-muted-foreground">
                                    {user.gstPercentage}%
                                  </div>
                                )}
                              </td>
                              <td className="text-right py-3 px-4 font-medium">
                                {formatCurrency(renderBooking.gst)}
                              </td>
                            </tr>
                          )}
                        </>
                      )}
                      
                      {/* Total Row */}
                      <tr className="bg-primary/5">
                        <td className="py-4 px-4 font-bold text-lg">TOTAL AMOUNT</td>
                        <td className="text-right py-4 px-4 font-bold text-lg text-primary">
                          {formatCurrency(
                            source === 'database' && databaseInvoice 
                              ? databaseInvoice.total 
                              : renderBooking?.total || 
                                (renderBooking?.amount || 0) + 
                                (renderBooking?.service || 0) + 
                                (renderBooking?.gst || 0)
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Payment Info (Database only) */}
            {source === 'database' && databaseInvoice?.payment && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                    <CheckCircle className="w-5 h-5" />
                    Payment Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Payment Method</div>
                      <div className="font-medium">{databaseInvoice.payment.method}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Payment Status</div>
                      <Badge className={
                        ['paid', 'completed'].includes(databaseInvoice.payment.status)
                          ? 'bg-green-100 text-green-800'
                          : databaseInvoice.payment.status === 'partial'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }>
                        {databaseInvoice.payment.status.toUpperCase()}
                      </Badge>
                    </div>
                    {databaseInvoice.payment.transactionId && (
                      <div className="col-span-2">
                        <div className="text-sm text-muted-foreground">Transaction ID</div>
                        <div className="font-medium font-mono text-sm">
                          {databaseInvoice.payment.transactionId}
                        </div>
                      </div>
                    )}
                    {(databaseInvoice.bookingAdvance > 0 || databaseInvoice.checkoutPaid > 0) && (
                      <div className="col-span-2 border-t pt-3 mt-1 space-y-2">
                        {databaseInvoice.bookingAdvance > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Advance at Booking</span>
                            <span className="font-medium text-green-700">
                              ₹{Number(databaseInvoice.bookingAdvance).toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                        {databaseInvoice.checkoutPaid > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Paid at Checkout</span>
                            <span className="font-medium text-green-700">
                              ₹{Number(databaseInvoice.checkoutPaid).toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                        {databaseInvoice.totalPaid > 0 && (
                          <div className="flex justify-between text-sm font-semibold">
                            <span>Total Paid</span>
                            <span>₹{Number(databaseInvoice.totalPaid).toLocaleString('en-IN')}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Footer */}
            <div className="text-center pt-6 border-t">
              <p className="font-semibold text-lg mb-2">
                Thank you for choosing {
                  source === 'database' && databaseInvoice 
                    ? databaseInvoice.hotel.name 
                    : user?.hotelName || user?.name || 'Hotel Name'
                }!
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {source === 'database' && databaseInvoice
                  ? databaseInvoice.footer.note
                  : 'This is a computer-generated invoice. No signature required.'
                }
              </p>
              <div className="flex flex-wrap justify-center gap-6 mt-6 pt-6 border-t">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Invoice Date</div>
                  <div className="font-medium">{format(new Date(), 'dd MMM yyyy')}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Invoice Number</div>
                  <div className="font-medium">
                    {source === 'database' && databaseInvoice
                      ? databaseInvoice.invoiceNumber
                      : `INV-${bookingId.substring(0, 8).toUpperCase()}`
                    }
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Authorized Signature</div>
                  <div className="h-px w-32 bg-border mx-auto mb-1"></div>
                  <div className="text-xs text-muted-foreground">________________</div>
                </div>
              </div>
            </div>
          </div>
        )}

        </div>

        {/* Action Buttons */}
        {!loading && !databaseError && (allowPrint || allowDownload) && (
          <div className="relative z-10 flex shrink-0 gap-2 border-t bg-background px-4 py-3 sm:px-6">
            {allowPrint && (
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handlePrint();
                }}
                data-basic-plan-allow
                variant="outline"
                disabled={isDownloading}
                className="h-10 flex-1"
              >
                {isDownloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="mr-2 h-4 w-4" />
                )}
                Print
              </Button>
            )}
            {allowDownload && (
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDownload();
                }}
                variant="default"
                data-basic-plan-allow
                disabled={isDownloading}
                className="h-10 flex-1"
              >
                {isDownloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {isDownloading ? 'Downloading…' : 'Download'}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceModal;