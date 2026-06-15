// import { useState, useEffect } from 'react';
// import { Button } from '@/components/ui/button';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from '@/components/ui/dialog';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Loader2, CreditCard, Wallet, QrCode, CheckCircle, IndianRupee } from 'lucide-react';
// import QRCode from 'qrcode.react';
// import { useToast } from '@/hooks/use-toast';
// import { Badge } from '@/components/ui/badge';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Card, CardContent } from '@/components/ui/card';

// interface FunctionCheckoutModalProps {
//   open: boolean;
//   onClose: () => void;
//   booking: any;
//   onCheckoutComplete: () => void;
// }

// export default function FunctionCheckoutModal({
//   open,
//   onClose,
//   booking,
//   onCheckoutComplete
// }: FunctionCheckoutModalProps) {
//   const { toast } = useToast();
//   const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online' | null>(null);
//   const [amount, setAmount] = useState<number>(0);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
//   const [qrCodeData, setQrCodeData] = useState<string>('');
//   const [isGeneratingQR, setIsGeneratingQR] = useState(false);
//   const [activeTab, setActiveTab] = useState('methods');
//   const [paymentCompleted, setPaymentCompleted] = useState(false);
//   const [transactionId, setTransactionId] = useState<string>('');

//   // Safely convert database values to numbers
//   const totalAmount = Number(booking?.total_amount) || 0;
//   const advancePaid = Number(booking?.advance_paid) || 0;
//   const remainingAmount = totalAmount - advancePaid;

//   const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
//   const isProUser = currentUser?.plan === 'pro' && currentUser?.source === 'database';

//   // Debug: Log booking data
//   useEffect(() => {
//     if (booking) {
//       console.log('📦 Modal booking data:', {
//         id: booking.id,
//         total: totalAmount,
//         advance: advancePaid,
//         remaining: remainingAmount
//       });
//     }
//   }, [booking]);

//   // Reset state when modal opens
//   useEffect(() => {
//     if (open && booking) {
//       setAmount(remainingAmount);
//       setPaymentMethod(null);
//       setPaymentStatus('pending');
//       setPaymentCompleted(false);
//       setTransactionId('');
//       setQrCodeData('');
//       setActiveTab('methods');
//     }
//   }, [open, booking]);

//   // Quick amount presets
//   const quickAmounts = [
//     { label: '₹500', value: 500 },
//     { label: '₹1000', value: 1000 },
//     { label: '₹2000', value: 2000 },
//     { label: '₹5000', value: 5000 },
//     { label: 'Full', value: remainingAmount }
//   ];

//   // Generate UPI QR Code
//   const generateUPIQrCode = async () => {
//     if (paymentCompleted) {
//       toast({
//         title: "Payment Already Completed",
//         description: "This payment has already been processed",
//         variant: "destructive"
//       });
//       return;
//     }

//     setIsGeneratingQR(true);
//     try {
//       const newTransactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
//       setTransactionId(newTransactionId);
      
//       const upiId = 'hotel@upi';
//       const merchantName = 'Hotel Management';
      
//       const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(newTransactionId)}`;
//       setQrCodeData(upiString);

//       toast({
//         title: "QR Code Generated",
//         description: `Please pay ₹${amount.toFixed(2)}`,
//       });
//     } catch (error) {
//       console.error('Error generating QR code:', error);
//       toast({
//         title: "Error",
//         description: "Failed to generate QR code",
//         variant: "destructive"
//       });
//     } finally {
//       setIsGeneratingQR(false);
//     }
//   };

//   // Verify payment (simulated)
//   const verifyPayment = async () => {
//     if (paymentCompleted) {
//       toast({
//         title: "Payment Already Completed",
//         description: "This payment has already been verified",
//         variant: "destructive"
//       });
//       return;
//     }

//     setIsProcessing(true);
    
//     setTimeout(() => {
//       setPaymentStatus('completed');
//       setPaymentCompleted(true);
//       toast({
//         title: "✅ Payment Successful",
//         description: "Payment verified successfully!",
//         variant: "default"
//       });
//       setIsProcessing(false);
//     }, 2000);
//   };

//   // Process checkout
//   const handleCheckout = async () => {
//     if (paymentCompleted) {
//       toast({
//         title: "Payment Already Processed",
//         description: "This payment has already been completed",
//         variant: "destructive"
//       });
//       return;
//     }

//     if (!paymentMethod) {
//       toast({
//         title: "Error",
//         description: "Please select a payment method",
//         variant: "destructive"
//       });
//       return;
//     }

//     if (paymentMethod === 'online' && paymentStatus !== 'completed') {
//       toast({
//         title: "Error",
//         description: "Please complete the online payment first",
//         variant: "destructive"
//       });
//       return;
//     }

//     if (isProcessing) return;

//     setIsProcessing(true);

//     try {
//       const token = localStorage.getItem('authToken');
      
//       // FIX: Convert to numbers properly to avoid string concatenation
//       const currentAdvance = Number(booking.advance_paid) || 0;
//       const paymentAmount = Number(amount) || 0;
//       const newTotalPaid = currentAdvance + paymentAmount;
//       const newPaymentStatus = newTotalPaid >= Number(booking.total_amount) ? 'completed' : 'partial';
      
//       const finalTransactionId = transactionId || 
//         (paymentMethod === 'online' ? `ONLINE-${Date.now()}` : `CASH-${Date.now()}`);

//       console.log('📤 Sending to backend:', {
//         advance_paid: newTotalPaid,
//         payment_status: newPaymentStatus,
//         transaction_id: finalTransactionId,
//         calculation: {
//           currentAdvance,
//           paymentAmount,
//           newTotalPaid,
//           totalAmount: Number(booking.total_amount)
//         }
//       });

//       const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/function-rooms/bookings/${booking.id}/payment`, {
//         method: 'PATCH',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           advance_paid: newTotalPaid,
//           payment_status: newPaymentStatus,
//           transaction_id: finalTransactionId
//         })
//       });

//       const data = await response.json();
//       console.log('📥 Backend response:', data);

//       if (data.success) {
//         setPaymentCompleted(true);
        
//         toast({
//           title: "✅ Payment Successful",
//           description: `Payment of ₹${amount.toFixed(2)} completed successfully`,
//         });

//         // Generate receipt for online payments
//         if (paymentMethod === 'online') {
//           await generateReceipt();
//         }

//         // Call the callback to refresh data
//         onCheckoutComplete();
        
//         // Close modal after short delay
//         setTimeout(() => {
//           onClose();
//         }, 1500);
//       } else {
//         throw new Error(data.message || 'Payment failed');
//       }
//     } catch (error: any) {
//       console.error('Payment error:', error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to process payment",
//         variant: "destructive"
//       });
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   // Generate receipt
//   const generateReceipt = async () => {
//     try {
//       const token = localStorage.getItem('authToken');
//       const response = await fetch(
//         `${import.meta.env.VITE_BACKEND_URL}/function-rooms/bookings/${booking.id}/invoice/pdf`,
//         {
//           headers: {
//             'Authorization': `Bearer ${token}`,
//           },
//         }
//       );

//       if (response.ok) {
//         const blob = await response.blob();
//         const url = window.URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = `invoice-${booking.booking_reference}.pdf`;
//         document.body.appendChild(a);
//         a.click();
//         document.body.removeChild(a);
//         window.URL.revokeObjectURL(url);
//       }
//     } catch (error) {
//       console.error('Error generating receipt:', error);
//     }
//   };

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2
//     }).format(amount);
//   };

//   if (!booking) return null;

//   return (
//     <Dialog open={open} onOpenChange={onClose}>
//       <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
//         <DialogHeader className="space-y-2 pb-2">
//           <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
//             <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />
//             Complete Payment
//           </DialogTitle>
//         </DialogHeader>

//         {paymentCompleted ? (
//           // Success State
//           <div className="py-8 text-center space-y-4">
//             <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
//               <CheckCircle className="h-8 w-8 text-green-600" />
//             </div>
//             <div>
//               <h3 className="text-lg font-semibold text-green-600">Payment Successful!</h3>
//               <p className="text-sm text-muted-foreground mt-1">
//                 Amount paid: {formatCurrency(amount)}
//               </p>
//               <p className="text-xs text-muted-foreground mt-2">
//                 Transaction ID: {transactionId}
//               </p>
//             </div>
//           </div>
//         ) : (
//           // Payment Form
//           <div className="space-y-4 sm:space-y-6">
//             {/* Booking Summary Card */}
//             <Card className="bg-gray-50 border-gray-200">
//               <CardContent className="p-3 sm:p-4 space-y-2">
//                 <h3 className="font-semibold text-sm sm:text-base mb-2">Booking Summary</h3>
                
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
//                   <div>
//                     <span className="text-muted-foreground">Reference:</span>
//                     <span className="ml-2 font-mono font-medium">{booking.booking_reference}</span>
//                   </div>
//                   <div>
//                     <span className="text-muted-foreground">Event:</span>
//                     <span className="ml-2 font-medium">{booking.event_name}</span>
//                   </div>
//                   <div className="sm:col-span-2">
//                     <span className="text-muted-foreground">Customer:</span>
//                     <span className="ml-2 font-medium">{booking.customer_name}</span>
//                   </div>
//                 </div>

//                 <div className="border-t border-gray-300 pt-2 mt-2 space-y-1.5">
//                   <div className="flex justify-between items-center text-sm">
//                     <span className="text-muted-foreground">Total Amount:</span>
//                     <span className="font-semibold">{formatCurrency(totalAmount)}</span>
//                   </div>
//                   <div className="flex justify-between items-center text-sm text-green-600">
//                     <span>Advance Paid:</span>
//                     <span className="font-semibold">{formatCurrency(advancePaid)}</span>
//                   </div>
//                   <div className="flex justify-between items-center text-base sm:text-lg font-bold text-primary border-t border-gray-300 pt-2 mt-1">
//                     <span>Balance Due:</span>
//                     <span>{formatCurrency(remainingAmount)}</span>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Payment Amount Section */}
//             <div className="space-y-2">
//               <Label className="text-sm sm:text-base font-medium">Payment Amount</Label>
//               <div className="relative">
//                 <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                 <Input
//                   type="number"
//                   value={amount}
//                   onChange={(e) => {
//                     const value = Number(e.target.value);
//                     if (value <= remainingAmount) {
//                       setAmount(value);
//                     }
//                   }}
//                   min={1}
//                   max={remainingAmount}
//                   step="100"
//                   className="pl-10 w-full text-base"
//                   disabled={paymentCompleted || isProcessing}
//                 />
//               </div>
              
//               {/* Quick Amount Buttons */}
//               <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
//                 {quickAmounts.map((item) => (
//                   <Button
//                     key={item.label}
//                     type="button"
//                     variant="outline"
//                     size="sm"
//                     onClick={() => setAmount(Math.min(item.value, remainingAmount))}
//                     disabled={remainingAmount < item.value && item.value !== remainingAmount || paymentCompleted || isProcessing}
//                     className="flex-shrink-0 text-xs sm:text-sm"
//                   >
//                     {item.label}
//                   </Button>
//                 ))}
//               </div>
              
//               <p className="text-xs text-muted-foreground">
//                 Max: {formatCurrency(remainingAmount)}
//               </p>
//             </div>

//             {/* Payment Method Tabs */}
//             <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
//               <TabsList className="grid w-full grid-cols-2 mb-2">
//                 <TabsTrigger value="methods" className="text-xs sm:text-sm">Payment Methods</TabsTrigger>
//                 <TabsTrigger value="summary" className="text-xs sm:text-sm">Payment Summary</TabsTrigger>
//               </TabsList>

//               <TabsContent value="methods" className="space-y-4 mt-2">
//                 {/* Payment Method Buttons */}
//                 <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
//                   <Button
//                     type="button"
//                     variant={paymentMethod === 'cash' ? "default" : "outline"}
//                     className="h-16 sm:h-24 flex flex-row sm:flex-col gap-3 sm:gap-2 justify-start sm:justify-center px-4 sm:px-2"
//                     onClick={() => {
//                       setPaymentMethod('cash');
//                       setPaymentStatus('pending');
//                       setTransactionId(`CASH-${Date.now()}`);
//                     }}
//                     disabled={paymentCompleted || isProcessing}
//                   >
//                     <Wallet className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
//                     <div className="flex flex-col items-start sm:items-center">
//                       <span className="font-medium text-sm">Cash Payment</span>
//                       <span className="text-xs text-muted-foreground hidden sm:block">Pay at hotel</span>
//                     </div>
//                   </Button>

//                   {isProUser && (
//                     <Button
//                       type="button"
//                       variant={paymentMethod === 'online' ? "default" : "outline"}
//                       className="h-16 sm:h-24 flex flex-row sm:flex-col gap-3 sm:gap-2 justify-start sm:justify-center px-4 sm:px-2"
//                       onClick={() => {
//                         setPaymentMethod('online');
//                         generateUPIQrCode();
//                       }}
//                       disabled={isGeneratingQR || paymentCompleted || isProcessing}
//                     >
//                       {isGeneratingQR ? (
//                         <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin flex-shrink-0" />
//                       ) : (
//                         <QrCode className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
//                       )}
//                       <div className="flex flex-col items-start sm:items-center">
//                         <span className="font-medium text-sm">Online Payment</span>
//                         <span className="text-xs text-muted-foreground hidden sm:block">UPI / Cards</span>
//                       </div>
//                     </Button>
//                   )}
//                 </div>

//                 {/* Online Payment QR Section */}
//                 {paymentMethod === 'online' && qrCodeData && !paymentCompleted && (
//                   <Card className="border-2 border-primary/20">
//                     <CardContent className="p-4 space-y-4">
//                       <div className="flex flex-col items-center">
//                         <div className="bg-white p-3 rounded-lg border mb-2">
//                           <QRCode
//                             value={qrCodeData}
//                             size={Math.min(200, window.innerWidth - 100)}
//                             level="H"
//                             includeMargin={true}
//                           />
//                         </div>
//                         <p className="font-semibold text-base sm:text-lg">
//                           Amount: {formatCurrency(amount)}
//                         </p>
//                         <p className="text-xs sm:text-sm text-muted-foreground">
//                           Scan with any UPI app
//                         </p>
//                       </div>

//                       <div className="space-y-3">
//                         <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                           <span className="text-sm font-medium">Payment Status:</span>
//                           <Badge variant="outline" className={
//                             paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
//                             paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
//                             'bg-yellow-100 text-yellow-800'
//                           }>
//                             {paymentStatus === 'completed' ? '✅ Completed' :
//                              paymentStatus === 'failed' ? '❌ Failed' :
//                              '🔄 Pending'}
//                           </Badge>
//                         </div>

//                         {paymentStatus === 'pending' && (
//                           <Button
//                             onClick={verifyPayment}
//                             className="w-full"
//                             disabled={isProcessing || paymentCompleted}
//                             size="lg"
//                           >
//                             {isProcessing ? (
//                               <>
//                                 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                                 Verifying...
//                               </>
//                             ) : (
//                               <>
//                                 <CheckCircle className="h-4 w-4 mr-2" />
//                                 I have made the payment
//                               </>
//                             )}
//                           </Button>
//                         )}
//                       </div>
//                     </CardContent>
//                   </Card>
//                 )}

//                 {/* Cash Payment Alert */}
//                 {paymentMethod === 'cash' && !paymentCompleted && (
//                   <Alert className="bg-green-50 border-green-200">
//                     <Wallet className="h-4 w-4 text-green-600" />
//                     <AlertDescription className="text-sm">
//                       Pay <span className="font-bold">{formatCurrency(amount)}</span> in cash at the hotel reception.
//                       <br />
//                       <span className="text-xs">Transaction ID: {transactionId}</span>
//                     </AlertDescription>
//                   </Alert>
//                 )}
//               </TabsContent>

//               <TabsContent value="summary" className="space-y-4 mt-2">
//                 <Card className="bg-primary/5">
//                   <CardContent className="p-4 space-y-3">
//                     <h3 className="font-semibold text-sm sm:text-base">Payment Breakdown</h3>
                    
//                     <div className="space-y-2 text-sm">
//                       <div className="flex justify-between">
//                         <span className="text-muted-foreground">Original Total:</span>
//                         <span className="font-medium">{formatCurrency(totalAmount)}</span>
//                       </div>
//                       <div className="flex justify-between text-green-600">
//                         <span>Already Paid:</span>
//                         <span className="font-medium">- {formatCurrency(advancePaid)}</span>
//                       </div>
//                       <div className="flex justify-between text-blue-600 border-b border-dashed pb-2">
//                         <span>Current Payment:</span>
//                         <span className="font-medium">+ {formatCurrency(amount)}</span>
//                       </div>
                      
//                       <div className="flex justify-between font-bold pt-1">
//                         <span>New Total Paid:</span>
//                         <span className="text-green-600">
//                           {formatCurrency(advancePaid + amount)}
//                         </span>
//                       </div>
                      
//                       <div className="flex justify-between text-sm font-medium">
//                         <span>Remaining Balance:</span>
//                         <span className={remainingAmount - amount > 0 ? 'text-orange-600' : 'text-green-600'}>
//                           {remainingAmount - amount > 0 
//                             ? formatCurrency(remainingAmount - amount)
//                             : '₹0 (Fully Paid)'}
//                         </span>
//                       </div>
//                     </div>

//                     <div className="bg-gray-50 p-3 rounded-lg mt-2">
//                       <p className="text-sm flex items-center flex-wrap gap-2">
//                         <span className="font-medium">Status after payment:</span>
//                         {advancePaid + amount >= totalAmount ? (
//                           <Badge className="bg-green-100 text-green-800">Fully Paid</Badge>
//                         ) : (
//                           <Badge className="bg-yellow-100 text-yellow-800">Partial Payment</Badge>
//                         )}
//                       </p>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </TabsContent>
//             </Tabs>
//           </div>
//         )}

//         <DialogFooter className="flex-col sm:flex-row gap-2 mt-4 sm:mt-6">
//           <Button 
//             variant="outline" 
//             onClick={onClose} 
//             disabled={isProcessing}
//             className="w-full sm:w-auto order-2 sm:order-1"
//           >
//             {paymentCompleted ? 'Close' : 'Cancel'}
//           </Button>
          
//           {!paymentCompleted && (
//             <Button
//               onClick={handleCheckout}
//               disabled={
//                 isProcessing ||
//                 !paymentMethod ||
//                 (paymentMethod === 'online' && paymentStatus !== 'completed') ||
//                 amount <= 0 ||
//                 amount > remainingAmount
//               }
//               className="w-full sm:w-auto bg-green-600 hover:bg-green-700 order-1 sm:order-2"
//               size="lg"
//             >
//               {isProcessing ? (
//                 <>
//                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                   Processing...
//                 </>
//               ) : (
//                 <>
//                   <CreditCard className="h-4 w-4 mr-2" />
//                   <span className="truncate">
//                     Pay {formatCurrency(amount)}
//                   </span>
//                 </>
//               )}
//             </Button>
//           )}
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }

// import { useState, useEffect } from 'react';
// import { Button } from '@/components/ui/button';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from '@/components/ui/dialog';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Loader2, CreditCard, Wallet, QrCode, CheckCircle, IndianRupee } from 'lucide-react';
// import QRCode from 'qrcode.react';
// import { useToast } from '@/hooks/use-toast';
// import { Badge } from '@/components/ui/badge';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Card, CardContent } from '@/components/ui/card';

// interface FunctionCheckoutModalProps {
//   open: boolean;
//   onClose: () => void;
//   booking: any;
//   onCheckoutComplete: () => void;
// }

// export default function FunctionCheckoutModal({
//   open,
//   onClose,
//   booking,
//   onCheckoutComplete
// }: FunctionCheckoutModalProps) {
//   const { toast } = useToast();
//   const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online' | null>(null);
//   const [amount, setAmount] = useState<number>(0);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
//   const [qrCodeData, setQrCodeData] = useState<string>('');
//   const [isGeneratingQR, setIsGeneratingQR] = useState(false);
//   const [activeTab, setActiveTab] = useState('methods');
//   const [paymentCompleted, setPaymentCompleted] = useState(false);
//   const [transactionId, setTransactionId] = useState<string>('');

//   // Safely convert database values to numbers
//   const totalAmount = Number(booking?.total_amount) || 0;
//   const advancePaid = Number(booking?.advance_paid) || 0;
//   const remainingAmount = totalAmount - advancePaid;

//   const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
//   const isProUser = currentUser?.plan === 'pro' && currentUser?.source === 'database';

//   // Debug: Log booking data
//   useEffect(() => {
//     if (booking) {
//       console.log('📦 Modal booking data:', {
//         id: booking.id,
//         total: totalAmount,
//         advance: advancePaid,
//         remaining: remainingAmount
//       });
//     }
//   }, [booking]);

//   // Reset state when modal opens
//   useEffect(() => {
//     if (open && booking) {
//       setAmount(remainingAmount);
//       setPaymentMethod(null);
//       setPaymentStatus('pending');
//       setPaymentCompleted(false);
//       setTransactionId('');
//       setQrCodeData('');
//       setActiveTab('methods');
//     }
//   }, [open, booking]);

//   // Quick amount presets
//   const quickAmounts = [
//     { label: '₹500', value: 500 },
//     { label: '₹1000', value: 1000 },
//     { label: '₹2000', value: 2000 },
//     { label: '₹5000', value: 5000 },
//     { label: 'Full', value: remainingAmount }
//   ];

//   // Generate UPI QR Code
//   const generateUPIQrCode = async () => {
//     if (paymentCompleted) {
//       toast({
//         title: "Payment Already Completed",
//         description: "This payment has already been processed",
//         variant: "destructive"
//       });
//       return;
//     }

//     setIsGeneratingQR(true);
//     try {
//       const newTransactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
//       setTransactionId(newTransactionId);
      
//       const upiId = 'hotel@upi';
//       const merchantName = 'Hotel Management';
      
//       const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(newTransactionId)}`;
//       setQrCodeData(upiString);

//       toast({
//         title: "QR Code Generated",
//         description: `Please pay ₹${amount.toFixed(2)}`,
//       });
//     } catch (error) {
//       console.error('Error generating QR code:', error);
//       toast({
//         title: "Error",
//         description: "Failed to generate QR code",
//         variant: "destructive"
//       });
//     } finally {
//       setIsGeneratingQR(false);
//     }
//   };

//   // Verify payment - FIXED: Now processes payment immediately
//   const verifyPayment = async () => {
//     if (paymentCompleted) {
//       toast({
//         title: "Payment Already Completed",
//         description: "This payment has already been verified",
//         variant: "destructive"
//       });
//       return;
//     }

//     // Instead of just setting state, process the payment immediately
//     await processPayment();
//   };

//   // Process checkout - FIXED: Now works for both cash and online
//   const handleCheckout = async () => {
//     if (paymentCompleted) {
//       toast({
//         title: "Payment Already Processed",
//         description: "This payment has already been completed",
//         variant: "destructive"
//       });
//       return;
//     }

//     if (!paymentMethod) {
//       toast({
//         title: "Error",
//         description: "Please select a payment method",
//         variant: "destructive"
//       });
//       return;
//     }

//     // For online payment, we need to verify first
//     if (paymentMethod === 'online' && paymentStatus !== 'completed') {
//       toast({
//         title: "Error",
//         description: "Please complete the online payment first",
//         variant: "destructive"
//       });
//       return;
//     }

//     // For cash payment, process directly
//     if (paymentMethod === 'cash') {
//       await processPayment();
//     }
//   };

//   // New function to handle actual payment processing
//   const processPayment = async () => {
//     if (isProcessing) return;

//     setIsProcessing(true);

//     try {
//       const token = localStorage.getItem('authToken');
      
//       const currentAdvance = Number(booking.advance_paid) || 0;
//       const paymentAmount = Number(amount) || 0;
//       const newTotalPaid = currentAdvance + paymentAmount;
//       const newPaymentStatus = newTotalPaid >= Number(booking.total_amount) ? 'completed' : 'partial';
      
//       // Generate transaction ID if not already set
//       const finalTransactionId = transactionId || 
//         (paymentMethod === 'online' ? `ONLINE-${Date.now()}` : `CASH-${Date.now()}`);

//       console.log('📤 Processing payment:', {
//         booking_id: booking.id,
//         advance_paid: newTotalPaid,
//         payment_status: newPaymentStatus,
//         transaction_id: finalTransactionId,
//         payment_method: paymentMethod,
//         amount: paymentAmount
//       });

//       const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/function-rooms/bookings/${booking.id}/payment`, {
//         method: 'PATCH',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           advance_paid: newTotalPaid,
//           payment_status: newPaymentStatus,
//           transaction_id: finalTransactionId
//         })
//       });

//       const data = await response.json();
//       console.log('📥 Backend response:', data);

//       if (data.success) {
//         setPaymentCompleted(true);
//         setPaymentStatus('completed');
//         setTransactionId(finalTransactionId);
        
//         toast({
//           title: "✅ Payment Successful",
//           description: `Payment of ₹${amount.toFixed(2)} completed successfully`,
//         });

//         // Generate receipt for online payments
//         if (paymentMethod === 'online') {
//           await generateReceipt();
//         }

//         // Call the callback to refresh data
//         onCheckoutComplete();
        
//         // Close modal after short delay
//         setTimeout(() => {
//           onClose();
//         }, 1500);
//       } else {
//         throw new Error(data.message || 'Payment failed');
//       }
//     } catch (error: any) {
//       console.error('Payment error:', error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to process payment",
//         variant: "destructive"
//       });
//       setPaymentStatus('failed');
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   // Generate receipt
//   const generateReceipt = async () => {
//     try {
//       const token = localStorage.getItem('authToken');
//       const response = await fetch(
//         `${import.meta.env.VITE_BACKEND_URL}/function-rooms/bookings/${booking.id}/invoice/pdf`,
//         {
//           headers: {
//             'Authorization': `Bearer ${token}`,
//           },
//         }
//       );

//       if (response.ok) {
//         const blob = await response.blob();
//         const url = window.URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = `invoice-${booking.booking_reference}.pdf`;
//         document.body.appendChild(a);
//         a.click();
//         document.body.removeChild(a);
//         window.URL.revokeObjectURL(url);
//       }
//     } catch (error) {
//       console.error('Error generating receipt:', error);
//     }
//   };

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2
//     }).format(amount);
//   };

//   if (!booking) return null;

//   return (
//     <Dialog open={open} onOpenChange={onClose}>
//       <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
//         <DialogHeader className="space-y-2 pb-2">
//           <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
//             <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />
//             Complete Payment
//           </DialogTitle>
//         </DialogHeader>

//         {paymentCompleted ? (
//           // Success State
//           <div className="py-8 text-center space-y-4">
//             <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
//               <CheckCircle className="h-8 w-8 text-green-600" />
//             </div>
//             <div>
//               <h3 className="text-lg font-semibold text-green-600">Payment Successful!</h3>
//               <p className="text-sm text-muted-foreground mt-1">
//                 Amount paid: {formatCurrency(amount)}
//               </p>
//               <p className="text-xs text-muted-foreground mt-2">
//                 Transaction ID: {transactionId}
//               </p>
//             </div>
//           </div>
//         ) : (
//           // Payment Form
//           <div className="space-y-4 sm:space-y-6">
//             {/* Booking Summary Card */}
//             <Card className="bg-gray-50 border-gray-200">
//               <CardContent className="p-3 sm:p-4 space-y-2">
//                 <h3 className="font-semibold text-sm sm:text-base mb-2">Booking Summary</h3>
                
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
//                   <div>
//                     <span className="text-muted-foreground">Reference:</span>
//                     <span className="ml-2 font-mono font-medium">{booking.booking_reference}</span>
//                   </div>
//                   <div>
//                     <span className="text-muted-foreground">Event:</span>
//                     <span className="ml-2 font-medium">{booking.event_name}</span>
//                   </div>
//                   <div className="sm:col-span-2">
//                     <span className="text-muted-foreground">Customer:</span>
//                     <span className="ml-2 font-medium">{booking.customer_name}</span>
//                   </div>
//                 </div>

//                 <div className="border-t border-gray-300 pt-2 mt-2 space-y-1.5">
//                   <div className="flex justify-between items-center text-sm">
//                     <span className="text-muted-foreground">Total Amount:</span>
//                     <span className="font-semibold">{formatCurrency(totalAmount)}</span>
//                   </div>
//                   <div className="flex justify-between items-center text-sm text-green-600">
//                     <span>Advance Paid:</span>
//                     <span className="font-semibold">{formatCurrency(advancePaid)}</span>
//                   </div>
//                   <div className="flex justify-between items-center text-base sm:text-lg font-bold text-primary border-t border-gray-300 pt-2 mt-1">
//                     <span>Balance Due:</span>
//                     <span>{formatCurrency(remainingAmount)}</span>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Payment Amount Section */}
//             <div className="space-y-2">
//               <Label className="text-sm sm:text-base font-medium">Payment Amount</Label>
//               <div className="relative">
//                 <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                 <Input
//                   type="number"
//                   value={amount}
//                   onChange={(e) => {
//                     const value = Number(e.target.value);
//                     if (value <= remainingAmount) {
//                       setAmount(value);
//                     }
//                   }}
//                   min={1}
//                   max={remainingAmount}
//                   step="100"
//                   className="pl-10 w-full text-base"
//                   disabled={paymentCompleted || isProcessing}
//                 />
//               </div>
              
//               {/* Quick Amount Buttons */}
//               <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
//                 {quickAmounts.map((item) => (
//                   <Button
//                     key={item.label}
//                     type="button"
//                     variant="outline"
//                     size="sm"
//                     onClick={() => setAmount(Math.min(item.value, remainingAmount))}
//                     disabled={remainingAmount < item.value && item.value !== remainingAmount || paymentCompleted || isProcessing}
//                     className="flex-shrink-0 text-xs sm:text-sm"
//                   >
//                     {item.label}
//                   </Button>
//                 ))}
//               </div>
              
//               <p className="text-xs text-muted-foreground">
//                 Max: {formatCurrency(remainingAmount)}
//               </p>
//             </div>

//             {/* Payment Method Tabs */}
//             <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
//               <TabsList className="grid w-full grid-cols-2 mb-2">
//                 <TabsTrigger value="methods" className="text-xs sm:text-sm">Payment Methods</TabsTrigger>
//                 <TabsTrigger value="summary" className="text-xs sm:text-sm">Payment Summary</TabsTrigger>
//               </TabsList>

//               <TabsContent value="methods" className="space-y-4 mt-2">
//                 {/* Payment Method Buttons */}
//                 <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
//                   <Button
//                     type="button"
//                     variant={paymentMethod === 'cash' ? "default" : "outline"}
//                     className="h-16 sm:h-24 flex flex-row sm:flex-col gap-3 sm:gap-2 justify-start sm:justify-center px-4 sm:px-2"
//                     onClick={() => {
//                       setPaymentMethod('cash');
//                       setPaymentStatus('pending');
//                       setTransactionId(`CASH-${Date.now()}`);
//                     }}
//                     disabled={paymentCompleted || isProcessing}
//                   >
//                     <Wallet className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
//                     <div className="flex flex-col items-start sm:items-center">
//                       <span className="font-medium text-sm">Cash Payment</span>
//                       <span className="text-xs text-muted-foreground hidden sm:block">Pay at hotel</span>
//                     </div>
//                   </Button>

//                   {isProUser && (
//                     <Button
//                       type="button"
//                       variant={paymentMethod === 'online' ? "default" : "outline"}
//                       className="h-16 sm:h-24 flex flex-row sm:flex-col gap-3 sm:gap-2 justify-start sm:justify-center px-4 sm:px-2"
//                       onClick={() => {
//                         setPaymentMethod('online');
//                         generateUPIQrCode();
//                       }}
//                       disabled={isGeneratingQR || paymentCompleted || isProcessing}
//                     >
//                       {isGeneratingQR ? (
//                         <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin flex-shrink-0" />
//                       ) : (
//                         <QrCode className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
//                       )}
//                       <div className="flex flex-col items-start sm:items-center">
//                         <span className="font-medium text-sm">Online Payment</span>
//                         <span className="text-xs text-muted-foreground hidden sm:block">UPI / Cards</span>
//                       </div>
//                     </Button>
//                   )}
//                 </div>

//                 {/* Online Payment QR Section */}
//                 {paymentMethod === 'online' && qrCodeData && !paymentCompleted && (
//                   <Card className="border-2 border-primary/20">
//                     <CardContent className="p-4 space-y-4">
//                       <div className="flex flex-col items-center">
//                         <div className="bg-white p-3 rounded-lg border mb-2">
//                           <QRCode
//                             value={qrCodeData}
//                             size={Math.min(200, window.innerWidth - 100)}
//                             level="H"
//                             includeMargin={true}
//                           />
//                         </div>
//                         <p className="font-semibold text-base sm:text-lg">
//                           Amount: {formatCurrency(amount)}
//                         </p>
//                         <p className="text-xs sm:text-sm text-muted-foreground">
//                           Scan with any UPI app
//                         </p>
//                       </div>

//                       <div className="space-y-3">
//                         <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                           <span className="text-sm font-medium">Payment Status:</span>
//                           <Badge variant="outline" className={
//                             paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
//                             paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
//                             'bg-yellow-100 text-yellow-800'
//                           }>
//                             {paymentStatus === 'completed' ? '✅ Completed' :
//                              paymentStatus === 'failed' ? '❌ Failed' :
//                              '🔄 Pending'}
//                           </Badge>
//                         </div>

//                         {paymentStatus === 'pending' && (
//                           <Button
//                             onClick={verifyPayment}
//                             className="w-full"
//                             disabled={isProcessing || paymentCompleted}
//                             size="lg"
//                           >
//                             {isProcessing ? (
//                               <>
//                                 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                                 Verifying...
//                               </>
//                             ) : (
//                               <>
//                                 <CheckCircle className="h-4 w-4 mr-2" />
//                                 I have made the payment
//                               </>
//                             )}
//                           </Button>
//                         )}
//                       </div>
//                     </CardContent>
//                   </Card>
//                 )}

//                 {/* Cash Payment Alert */}
//                 {paymentMethod === 'cash' && !paymentCompleted && (
//                   <Alert className="bg-green-50 border-green-200">
//                     <Wallet className="h-4 w-4 text-green-600" />
//                     <AlertDescription className="text-sm">
//                       Pay <span className="font-bold">{formatCurrency(amount)}</span> in cash at the hotel reception.
//                       <br />
//                       <span className="text-xs">Transaction ID: {transactionId}</span>
//                     </AlertDescription>
//                   </Alert>
//                 )}
//               </TabsContent>

//               <TabsContent value="summary" className="space-y-4 mt-2">
//                 <Card className="bg-primary/5">
//                   <CardContent className="p-4 space-y-3">
//                     <h3 className="font-semibold text-sm sm:text-base">Payment Breakdown</h3>
                    
//                     <div className="space-y-2 text-sm">
//                       <div className="flex justify-between">
//                         <span className="text-muted-foreground">Original Total:</span>
//                         <span className="font-medium">{formatCurrency(totalAmount)}</span>
//                       </div>
//                       <div className="flex justify-between text-green-600">
//                         <span>Already Paid:</span>
//                         <span className="font-medium">- {formatCurrency(advancePaid)}</span>
//                       </div>
//                       <div className="flex justify-between text-blue-600 border-b border-dashed pb-2">
//                         <span>Current Payment:</span>
//                         <span className="font-medium">+ {formatCurrency(amount)}</span>
//                       </div>
                      
//                       <div className="flex justify-between font-bold pt-1">
//                         <span>New Total Paid:</span>
//                         <span className="text-green-600">
//                           {formatCurrency(advancePaid + amount)}
//                         </span>
//                       </div>
                      
//                       <div className="flex justify-between text-sm font-medium">
//                         <span>Remaining Balance:</span>
//                         <span className={remainingAmount - amount > 0 ? 'text-orange-600' : 'text-green-600'}>
//                           {remainingAmount - amount > 0 
//                             ? formatCurrency(remainingAmount - amount)
//                             : '₹0 (Fully Paid)'}
//                         </span>
//                       </div>
//                     </div>

//                     <div className="bg-gray-50 p-3 rounded-lg mt-2">
//                       <p className="text-sm flex items-center flex-wrap gap-2">
//                         <span className="font-medium">Status after payment:</span>
//                         {advancePaid + amount >= totalAmount ? (
//                           <Badge className="bg-green-100 text-green-800">Fully Paid</Badge>
//                         ) : (
//                           <Badge className="bg-yellow-100 text-yellow-800">Partial Payment</Badge>
//                         )}
//                       </p>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </TabsContent>
//             </Tabs>
//           </div>
//         )}

//         <DialogFooter className="flex-col sm:flex-row gap-2 mt-4 sm:mt-6">
//           <Button 
//             variant="outline" 
//             onClick={onClose} 
//             disabled={isProcessing}
//             className="w-full sm:w-auto order-2 sm:order-1"
//           >
//             {paymentCompleted ? 'Close' : 'Cancel'}
//           </Button>
          
//           {!paymentCompleted && (
//             <Button
//               onClick={handleCheckout}
//               disabled={
//                 isProcessing ||
//                 !paymentMethod ||
//                 (paymentMethod === 'online' && paymentStatus !== 'completed') ||
//                 amount <= 0 ||
//                 amount > remainingAmount
//               }
//               className="w-full sm:w-auto bg-green-600 hover:bg-green-700 order-1 sm:order-2"
//               size="lg"
//             >
//               {isProcessing ? (
//                 <>
//                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                   Processing...
//                 </>
//               ) : (
//                 <>
//                   <CreditCard className="h-4 w-4 mr-2" />
//                   <span className="truncate">
//                     {paymentMethod === 'online' ? 'Complete Payment' : `Pay ${formatCurrency(amount)}`}
//                   </span>
//                 </>
//               )}
//             </Button>
//           )}
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Wallet, QrCode, CheckCircle, IndianRupee } from 'lucide-react';
import QRCode from 'qrcode.react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

interface FunctionCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  booking: any;
  onCheckoutComplete: () => void;
}

export default function FunctionCheckoutModal({
  open,
  onClose,
  booking,
  onCheckoutComplete
}: FunctionCheckoutModalProps) {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online' | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [activeTab, setActiveTab] = useState('methods');
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [transactionId, setTransactionId] = useState<string>('');
  const [paymentVerified, setPaymentVerified] = useState(false);

  // Safely convert database values to numbers
  const totalAmount = Number(booking?.total_amount) || 0;
  const advancePaid = Number(booking?.advance_paid) || 0;
  const remainingAmount = totalAmount - advancePaid;

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const isProUser = currentUser?.plan === 'pro' && currentUser?.source === 'database';

  // Debug: Log booking data
  useEffect(() => {
    if (booking) {
      console.log('📦 Modal booking data:', {
        id: booking.id,
        total: totalAmount,
        advance: advancePaid,
        remaining: remainingAmount
      });
    }
  }, [booking]);

  // Reset state when modal opens
  useEffect(() => {
    if (open && booking) {
      setAmount(remainingAmount);
      setPaymentMethod(null);
      setPaymentStatus('pending');
      setPaymentCompleted(false);
      setPaymentVerified(false);
      setTransactionId('');
      setQrCodeData('');
      setActiveTab('methods');
    }
  }, [open, booking]);

  // Quick amount presets
  const quickAmounts = [
    { label: '₹500', value: 500 },
    { label: '₹1000', value: 1000 },
    { label: '₹2000', value: 2000 },
    { label: '₹5000', value: 5000 },
    { label: 'Full', value: remainingAmount }
  ];

  // Generate UPI QR Code
  const generateUPIQrCode = async () => {
    if (paymentCompleted) {
      toast({
        title: "Payment Already Completed",
        description: "This payment has already been processed",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingQR(true);
    try {
      const newTransactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
      setTransactionId(newTransactionId);
      
      const upiId = 'hotel@upi';
      const merchantName = 'Hotel Management';
      
      const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(newTransactionId)}`;
      setQrCodeData(upiString);

      toast({
        title: "QR Code Generated",
        description: `Please pay ₹${amount.toFixed(2)}`,
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingQR(false);
    }
  };

  // Verify payment - just marks as verified, doesn't process
  const verifyPayment = async () => {
    if (paymentCompleted) {
      toast({
        title: "Payment Already Completed",
        description: "This payment has already been verified",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate verification delay
    setTimeout(() => {
      setPaymentVerified(true);
      setPaymentStatus('completed');
      
      toast({
        title: "✅ Payment Verified",
        description: "Payment verified successfully! Click 'Complete Payment' to finish.",
        variant: "default"
      });
      
      setIsProcessing(false);
    }, 1500);
  };

  // Process checkout - now handles both cash and online
  const handleCheckout = async () => {
    if (paymentCompleted) {
      toast({
        title: "Payment Already Processed",
        description: "This payment has already been completed",
        variant: "destructive"
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Error",
        description: "Please select a payment method",
        variant: "destructive"
      });
      return;
    }

    // For online payment, require verification first
    if (paymentMethod === 'online' && !paymentVerified) {
      toast({
        title: "Error",
        description: "Please verify the payment first",
        variant: "destructive"
      });
      return;
    }

    if (isProcessing) return;

    setIsProcessing(true);

    try {
      const token = localStorage.getItem('authToken');
      
      const currentAdvance = Number(booking.advance_paid) || 0;
      const paymentAmount = Number(amount) || 0;
      const newTotalPaid = currentAdvance + paymentAmount;
      const newPaymentStatus = newTotalPaid >= Number(booking.total_amount) ? 'completed' : 'partial';
      
      // Generate transaction ID if not already set
      const finalTransactionId = transactionId || 
        (paymentMethod === 'online' ? `ONLINE-${Date.now()}` : `CASH-${Date.now()}`);

      console.log('📤 Processing payment:', {
        booking_id: booking.id,
        advance_paid: newTotalPaid,
        payment_status: newPaymentStatus,
        transaction_id: finalTransactionId,
        payment_method: paymentMethod,
        amount: paymentAmount
      });

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/function-rooms/bookings/${booking.id}/payment`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          advance_paid: newTotalPaid,
          payment_status: newPaymentStatus,
          transaction_id: finalTransactionId
        })
      });

      const data = await response.json();
      console.log('📥 Backend response:', data);

      if (data.success) {
        setPaymentCompleted(true);
        
        toast({
          title: "✅ Payment Successful",
          description: `Payment of ₹${amount.toFixed(2)} completed successfully`,
        });

        // Call the callback to refresh data
        onCheckoutComplete();
        
        // Close modal after short delay (still auto-close after success)
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error(data.message || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process payment",
        variant: "destructive"
      });
      setPaymentStatus('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-2 pb-2">
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />
            Complete Payment
          </DialogTitle>
        </DialogHeader>

        {paymentCompleted ? (
          // Success State
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-600">Payment Successful!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Amount paid: {formatCurrency(amount)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Transaction ID: {transactionId}
              </p>
            </div>
          </div>
        ) : (
          // Payment Form
          <div className="space-y-4 sm:space-y-6">
            {/* Booking Summary Card */}
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-3 sm:p-4 space-y-2">
                <h3 className="font-semibold text-sm sm:text-base mb-2">Booking Summary</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                  <div>
                    <span className="text-muted-foreground">Reference:</span>
                    <span className="ml-2 font-mono font-medium">{booking.booking_reference}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Event:</span>
                    <span className="ml-2 font-medium">{booking.event_name}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground">Customer:</span>
                    <span className="ml-2 font-medium">{booking.customer_name}</span>
                  </div>
                </div>

                <div className="border-t border-gray-300 pt-2 mt-2 space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-semibold">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-green-600">
                    <span>Advance Paid:</span>
                    <span className="font-semibold">{formatCurrency(advancePaid)}</span>
                  </div>
                  <div className="flex justify-between items-center text-base sm:text-lg font-bold text-primary border-t border-gray-300 pt-2 mt-1">
                    <span>Balance Due:</span>
                    <span>{formatCurrency(remainingAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Amount Section */}
            <div className="space-y-2">
              <Label className="text-sm sm:text-base font-medium">Payment Amount</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (value <= remainingAmount) {
                      setAmount(value);
                    }
                  }}
                  min={1}
                  max={remainingAmount}
                  step="100"
                  className="pl-10 w-full text-base"
                  disabled={paymentCompleted || isProcessing}
                />
              </div>
              
              {/* Quick Amount Buttons */}
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                {quickAmounts.map((item) => (
                  <Button
                    key={item.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(Math.min(item.value, remainingAmount))}
                    disabled={remainingAmount < item.value && item.value !== remainingAmount || paymentCompleted || isProcessing}
                    className="flex-shrink-0 text-xs sm:text-sm"
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
              
              <p className="text-xs text-muted-foreground">
                Max: {formatCurrency(remainingAmount)}
              </p>
            </div>

            {/* Payment Method Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-2">
                <TabsTrigger value="methods" className="text-xs sm:text-sm">Payment Methods</TabsTrigger>
                <TabsTrigger value="summary" className="text-xs sm:text-sm">Payment Summary</TabsTrigger>
              </TabsList>

              <TabsContent value="methods" className="space-y-4 mt-2">
                {/* Payment Method Buttons */}
                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={paymentMethod === 'cash' ? "default" : "outline"}
                    className="h-16 sm:h-24 flex flex-row sm:flex-col gap-3 sm:gap-2 justify-start sm:justify-center px-4 sm:px-2"
                    onClick={() => {
                      setPaymentMethod('cash');
                      setPaymentStatus('pending');
                      setPaymentVerified(false);
                      setTransactionId(`CASH-${Date.now()}`);
                    }}
                    disabled={paymentCompleted || isProcessing}
                  >
                    <Wallet className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                    <div className="flex flex-col items-start sm:items-center">
                      <span className="font-medium text-sm">Cash Payment</span>
                      <span className="text-xs text-muted-foreground hidden sm:block">Pay at hotel</span>
                    </div>
                  </Button>

                  {isProUser && (
                    <Button
                      type="button"
                      variant={paymentMethod === 'online' ? "default" : "outline"}
                      className="h-16 sm:h-24 flex flex-row sm:flex-col gap-3 sm:gap-2 justify-start sm:justify-center px-4 sm:px-2"
                      onClick={() => {
                        setPaymentMethod('online');
                        setPaymentVerified(false);
                        generateUPIQrCode();
                      }}
                      disabled={isGeneratingQR || paymentCompleted || isProcessing}
                    >
                      {isGeneratingQR ? (
                        <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin flex-shrink-0" />
                      ) : (
                        <QrCode className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                      )}
                      <div className="flex flex-col items-start sm:items-center">
                        <span className="font-medium text-sm">Online Payment</span>
                        <span className="text-xs text-muted-foreground hidden sm:block">UPI / Cards</span>
                      </div>
                    </Button>
                  )}
                </div>

                {/* Online Payment QR Section */}
                {paymentMethod === 'online' && qrCodeData && !paymentCompleted && (
                  <Card className="border-2 border-primary/20">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex flex-col items-center">
                        <div className="bg-white p-3 rounded-lg border mb-2">
                          <QRCode
                            value={qrCodeData}
                            size={Math.min(200, window.innerWidth - 100)}
                            level="H"
                            includeMargin={true}
                          />
                        </div>
                        <p className="font-semibold text-base sm:text-lg">
                          Amount: {formatCurrency(amount)}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Scan with any UPI app
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium">Payment Status:</span>
                          <Badge variant="outline" className={
                            paymentVerified ? 'bg-green-100 text-green-800' :
                            paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {paymentVerified ? '✅ Verified' :
                             paymentStatus === 'failed' ? '❌ Failed' :
                             '🔄 Pending'}
                          </Badge>
                        </div>

                        {!paymentVerified && (
                          <Button
                            onClick={verifyPayment}
                            className="w-full"
                            disabled={isProcessing || paymentCompleted}
                            size="lg"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                I have made the payment
                              </>
                            )}
                          </Button>
                        )}

                        {paymentVerified && (
                          <Alert className="bg-green-50 border-green-200">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription>
                              Payment verified! Click "Complete Payment" to finish.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Cash Payment Alert */}
                {paymentMethod === 'cash' && !paymentCompleted && (
                  <Alert className="bg-green-50 border-green-200">
                    <Wallet className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-sm">
                      Pay <span className="font-bold">{formatCurrency(amount)}</span> in cash at the hotel reception.
                      <br />
                      <span className="text-xs">Transaction ID: {transactionId}</span>
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="summary" className="space-y-4 mt-2">
                <Card className="bg-primary/5">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold text-sm sm:text-base">Payment Breakdown</h3>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Original Total:</span>
                        <span className="font-medium">{formatCurrency(totalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Already Paid:</span>
                        <span className="font-medium">- {formatCurrency(advancePaid)}</span>
                      </div>
                      <div className="flex justify-between text-blue-600 border-b border-dashed pb-2">
                        <span>Current Payment:</span>
                        <span className="font-medium">+ {formatCurrency(amount)}</span>
                      </div>
                      
                      <div className="flex justify-between font-bold pt-1">
                        <span>New Total Paid:</span>
                        <span className="text-green-600">
                          {formatCurrency(advancePaid + amount)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm font-medium">
                        <span>Remaining Balance:</span>
                        <span className={remainingAmount - amount > 0 ? 'text-orange-600' : 'text-green-600'}>
                          {remainingAmount - amount > 0 
                            ? formatCurrency(remainingAmount - amount)
                            : '₹0 (Fully Paid)'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg mt-2">
                      <p className="text-sm flex items-center flex-wrap gap-2">
                        <span className="font-medium">Status after payment:</span>
                        {advancePaid + amount >= totalAmount ? (
                          <Badge className="bg-green-100 text-green-800">Fully Paid</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">Partial Payment</Badge>
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4 sm:mt-6">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isProcessing}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Cancel
          </Button>
          
          {!paymentCompleted && (
            <Button
              onClick={handleCheckout}
              disabled={
                isProcessing ||
                !paymentMethod ||
                (paymentMethod === 'online' && !paymentVerified) ||
                amount <= 0 ||
                amount > remainingAmount
              }
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 order-1 sm:order-2"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  <span className="truncate">
                    Complete Payment
                  </span>
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}