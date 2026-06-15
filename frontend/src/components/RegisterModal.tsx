

// // // // import { useState, useEffect } from "react";
// // // // import { useNavigate } from "react-router-dom";
// // // // import {
// // // //   Dialog,
// // // //   DialogContent,
// // // //   DialogDescription,
// // // //   DialogHeader,
// // // //   DialogTitle,
// // // // } from "@/components/ui/dialog";
// // // // import { Button } from "@/components/ui/button";
// // // // import { Input } from "@/components/ui/input";
// // // // import { Label } from "@/components/ui/label";
// // // // import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// // // // import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// // // // import { Badge } from "@/components/ui/badge";
// // // // import { useToast } from "@/hooks/use-toast";
// // // // import { Alert, AlertDescription } from "@/components/ui/alert";
// // // // import {
// // // //   Loader2,
// // // //   ShieldCheck,
// // // //   RefreshCw,
// // // //   CheckCircle,
// // // //   ArrowLeft,
// // // //   Phone,
// // // //   Mail,
// // // //   Calendar,
// // // //   Clock,
// // // //   Gift, Check, Info, ChevronDown, ChevronUp, X, Star
// // // // } from "lucide-react";

// // // // interface RegisterModalProps {
// // // //   open: boolean;
// // // //   onClose: () => void;
// // // // }

// // // // // Google Apps Script URL for FREE plan
// // // // const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwA1sC2rREM50Ri9p0r-tWy3Jz-RSe39N9iu90qiRopKUvJ17fxYptB4yhbfQOBM62z/exec";

// // // // // Node.js backend URL
// // // // const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// // // // interface RegisterModalProps {
// // // //   open: boolean;
// // // //   onClose: () => void;
// // // // }

// // // // const RegisterModal = ({ open, onClose }: RegisterModalProps) => {
// // // //   const navigate = useNavigate();
// // // //   const { toast } = useToast();

// // // //   // Form data state
// // // //   const [formData, setFormData] = useState({
// // // //     adminName: "",
// // // //     username: "",
// // // //     password: "",
// // // //     hotelName: "",
// // // //     email: "",
// // // //     phone: "",
// // // //     address: "",
// // // //     gstNumber: "",
// // // //     plan: "pro", // Default to PRO plan
// // // //   });

// // // //   // SMS OTP states for FREE plan
// // // //   const [otpData, setOtpData] = useState({
// // // //     otp: "",
// // // //     isPhoneVerified: false,
// // // //     otpSent: false,
// // // //     otpCountdown: 0,
// // // //     otpResendCount: 0,
// // // //     maxOtpResends: 3,
// // // //   });

// // // //   // Email OTP states for PRO plan
// // // //   const [emailOTP, setEmailOTP] = useState("");
// // // //   const [emailOTPVerified, setEmailOTPVerified] = useState(false);
// // // //   const [showEmailOTPInput, setShowEmailOTPInput] = useState(false);
// // // //   const [showForm, setShowForm] = useState(false);

// // // //   // Loading states
// // // //   const [isSubmitting, setIsSubmitting] = useState(false);
// // // //   const [isSendingOtp, setIsSendingOtp] = useState(false);
// // // //   const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
// // // //   const [isSendingEmailOTP, setIsSendingEmailOTP] = useState(false);
// // // //   const [isVerifyingEmailOTP, setIsVerifyingEmailOTP] = useState(false);
// // // //   const [showOtpInput, setShowOtpInput] = useState(false);

// // // //   const [referralCode, setReferralCode] = useState('');
// // // //   const [referralValidating, setReferralValidating] = useState(false);
// // // //   const [referralValid, setReferralValid] = useState(false);
// // // //   const [referralDetails, setReferralDetails] = useState<any>(null);
// // // //   const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

// // // //   // OTP Countdown Timer for SMS
// // // //   useEffect(() => {
// // // //     let interval: NodeJS.Timeout;
// // // //     if (otpData.otpCountdown > 0) {
// // // //       interval = setInterval(() => {
// // // //         setOtpData(prev => ({
// // // //           ...prev,
// // // //           otpCountdown: prev.otpCountdown - 1
// // // //         }));
// // // //       }, 1000);
// // // //     }
// // // //     return () => {
// // // //       if (interval) clearInterval(interval);
// // // //     };
// // // //   }, [otpData.otpCountdown]);

// // // //   // Helper functions
// // // //   const formatIndianPhone = (phone: string) => {
// // // //     const clean = phone.replace(/\D/g, '');
// // // //     if (clean.length === 10) {
// // // //       return `+91 ${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
// // // //     }
// // // //     return phone;
// // // //   };

// // // //   const formatCountdown = (seconds: number) => {
// // // //     const mins = Math.floor(seconds / 60);
// // // //     const secs = seconds % 60;
// // // //     return `${mins}:${secs.toString().padStart(2, '0')}`;
// // // //   };

// // // //   // Form change handlers
// // // //   const handleChange = (field: string, value: string) => {
// // // //     setFormData((prev) => ({ ...prev, [field]: value }));

// // // //     // Reset verification states when email or phone changes
// // // //     if (field === "email") {
// // // //       setEmailOTPVerified(false);
// // // //       setShowEmailOTPInput(false);
// // // //       setEmailOTP("");
// // // //     }
// // // //     if (field === "phone") {
// // // //       setOtpData(prev => ({
// // // //         ...prev,
// // // //         isPhoneVerified: false,
// // // //         otpSent: false,
// // // //         otp: ""
// // // //       }));
// // // //       setShowOtpInput(false);
// // // //     }
// // // //   };

// // // //   const handleOtpChange = (value: string) => {
// // // //     const numericValue = value.replace(/\D/g, '').slice(0, 6);
// // // //     setOtpData(prev => ({ ...prev, otp: numericValue }));
// // // //   };

// // // //   const handleEmailOtpChange = (value: string) => {
// // // //     const numericValue = value.replace(/\D/g, '').slice(0, 6);
// // // //     setEmailOTP(numericValue);
// // // //   };

// // // //   // Plan change handler
// // // //   const handlePlanChange = (value: string) => {
// // // //     handleChange("plan", value);
// // // //     setShowForm(false);

// // // //     // Reset verification states when plan changes
// // // //     if (value === "free") {
// // // //       // Reset PRO plan states
// // // //       setEmailOTPVerified(false);
// // // //       setShowEmailOTPInput(false);
// // // //       setEmailOTP("");
// // // //     } else if (value === "pro") {
// // // //       // Reset FREE plan states
// // // //       setOtpData({
// // // //         otp: "",
// // // //         isPhoneVerified: false,
// // // //         otpSent: false,
// // // //         otpCountdown: 0,
// // // //         otpResendCount: 0,
// // // //         maxOtpResends: 3,
// // // //       });
// // // //       setShowOtpInput(false);
// // // //     }
// // // //   };

// // // //   const validateReferralCode = async () => {
// // // //     if (!referralCode.trim()) {
// // // //       setReferralValid(false);
// // // //       return;
// // // //     }

// // // //     setReferralValidating(true);
// // // //     try {
// // // //       const response = await fetch(`${NODE_BACKEND_URL}/wallet/referral/validate/${referralCode}`, {
// // // //         method: 'GET',
// // // //         headers: {
// // // //           'Content-Type': 'application/json',
// // // //         },
// // // //       });

// // // //       if (response.ok) {
// // // //         const data = await response.json();
// // // //         if (data.success) {
// // // //           setReferralValid(true);
// // // //           setReferralDetails(data.data);
// // // //           toast({
// // // //             title: 'Referral Code Valid!',
// // // //             description: `You'll earn benefits from ${data.data.referrer_name}`,
// // // //             variant: 'default',
// // // //           });
// // // //         } else {
// // // //           setReferralValid(false);
// // // //           toast({
// // // //             title: 'Invalid Code',
// // // //             description: 'Please enter a valid referral code',
// // // //             variant: 'destructive',
// // // //           });
// // // //         }
// // // //       } else {
// // // //         setReferralValid(false);
// // // //         toast({
// // // //           title: 'Error',
// // // //           description: 'Failed to validate referral code',
// // // //           variant: 'destructive',
// // // //         });
// // // //       }
// // // //     } catch (error) {
// // // //       setReferralValid(false);
// // // //       toast({
// // // //         title: 'Error',
// // // //         description: 'Network error. Please try again.',
// // // //         variant: 'destructive',
// // // //       });
// // // //     } finally {
// // // //       setReferralValidating(false);
// // // //     }
// // // //   };


// // // //   // JSONP function for Google Apps Script (FREE plan)
// // // //   function jsonpRequest(url: string): Promise<any> {
// // // //     return new Promise((resolve, reject) => {
// // // //       const callbackName = "cb_" + Date.now();
// // // //       (window as any)[callbackName] = (data: any) => {
// // // //         resolve(data);
// // // //         delete (window as any)[callbackName];
// // // //         script.remove();
// // // //       };
// // // //       const script = document.createElement("script");
// // // //       script.src = url + (url.includes("?") ? "&" : "?") + "callback=" + callbackName;
// // // //       script.onerror = () => {
// // // //         reject(new Error("Failed to load script"));
// // // //         delete (window as any)[callbackName];
// // // //         script.remove();
// // // //       };
// // // //       document.body.appendChild(script);
// // // //     });
// // // //   }

// // // //   // Fetch function for Node.js backend
// // // //   async function fetchBackendRequest(endpoint: string, data: any): Promise<any> {
// // // //     console.log("📤 Sending to backend:", {
// // // //       endpoint: `${NODE_BACKEND_URL}${endpoint}`,
// // // //       data: { ...data, admin: { ...data.admin, password: '[HIDDEN]' } }
// // // //     });

// // // //     const response = await fetch(`${NODE_BACKEND_URL}${endpoint}`, {
// // // //       method: "POST",
// // // //       headers: {
// // // //         "Content-Type": "application/json",
// // // //       },
// // // //       body: JSON.stringify(data),
// // // //     });

// // // //     const responseText = await response.text();
// // // //     console.log("📥 Backend response:", {
// // // //       status: response.status,
// // // //       statusText: response.statusText,
// // // //       body: responseText
// // // //     });

// // // //     if (!response.ok) {
// // // //       let errorMessage = `HTTP error! status: ${response.status}`;
// // // //       try {
// // // //         const errorData = JSON.parse(responseText);
// // // //         errorMessage = errorData.message || errorData.error || errorMessage;
// // // //       } catch (e) {
// // // //         errorMessage = responseText || errorMessage;
// // // //       }
// // // //       throw new Error(errorMessage);
// // // //     }

// // // //     try {
// // // //       return JSON.parse(responseText);
// // // //     } catch (e) {
// // // //       throw new Error('Invalid JSON response from server');
// // // //     }
// // // //   }

// // // //   const encodeValue = (val: unknown) =>
// // // //     typeof val === "string" || typeof val === "number" || typeof val === "boolean"
// // // //       ? encodeURIComponent(val.toString())
// // // //       : "";

// // // //   const buildQueryString = (params: Record<string, unknown>): string =>
// // // //     Object.entries(params)
// // // //       .map(([key, val]) => {
// // // //         if (typeof val === "object" && val !== null) {
// // // //           return Object.entries(val as Record<string, unknown>)
// // // //             .map(
// // // //               ([subKey, subVal]) =>
// // // //                 encodeURIComponent(`${key}[${subKey}]`) + "=" + encodeValue(subVal)
// // // //             )
// // // //             .join("&");
// // // //         }
// // // //         return encodeURIComponent(key) + "=" + encodeValue(val);
// // // //       })
// // // //       .join("&");

// // // //   // SMS OTP functions for FREE plan
// // // //   async function generateSMSOTP(phone: string, email: string, hotelName: string, username: string): Promise<any> {
// // // //     const paramObj = {
// // // //       action: "generateOTP",
// // // //       phone: phone,
// // // //       email: email,
// // // //       hotelName: hotelName,
// // // //       username: username
// // // //     };

// // // //     const queryString = buildQueryString(paramObj);
// // // //     const url = APPS_SCRIPT_URL + "?" + queryString;

// // // //     console.log("📱 Generating SMS OTP for phone:", phone);
// // // //     return await jsonpRequest(url);
// // // //   }

// // // //   async function verifySMSOTP(phone: string, email: string, otp: string): Promise<any> {
// // // //     const paramObj = {
// // // //       action: "verifyOTP",
// // // //       phone: phone,
// // // //       email: email,
// // // //       otp: otp
// // // //     };

// // // //     const queryString = buildQueryString(paramObj);
// // // //     const url = APPS_SCRIPT_URL + "?" + queryString;

// // // //     console.log("🔐 Verifying SMS OTP for phone:", phone);
// // // //     return await jsonpRequest(url);
// // // //   }

// // // //   // Send SMS OTP for FREE plan
// // // //   const handleSendOTP = async () => {
// // // //     if (!formData.phone) {
// // // //       toast({
// // // //         title: "Phone Number Required",
// // // //         description: "Please enter your phone number to receive SMS OTP",
// // // //         variant: "destructive",
// // // //       });
// // // //       return;
// // // //     }

// // // //     const phoneRegex = /^[6-9]\d{9}$/;
// // // //     const cleanPhone = formData.phone.replace(/\D/g, '');

// // // //     if (!phoneRegex.test(cleanPhone)) {
// // // //       toast({
// // // //         title: "Invalid Phone Number",
// // // //         description: "Please enter a valid 10-digit Indian mobile number",
// // // //         variant: "destructive",
// // // //       });
// // // //       return;
// // // //     }

// // // //     if (otpData.otpResendCount >= otpData.maxOtpResends) {
// // // //       toast({
// // // //         title: "Resend Limit Reached",
// // // //         description: "You have reached the maximum OTP resend attempts. Please try again later.",
// // // //         variant: "destructive",
// // // //       });
// // // //       return;
// // // //     }

// // // //     setIsSendingOtp(true);
// // // //     try {
// // // //       const response = await generateSMSOTP(
// // // //         cleanPhone,
// // // //         formData.email,
// // // //         formData.hotelName,
// // // //         formData.username
// // // //       );

// // // //       if (response.success) {
// // // //         setOtpData(prev => ({
// // // //           ...prev,
// // // //           otpSent: true,
// // // //           otpCountdown: 300,
// // // //           otpResendCount: prev.otpResendCount + 1,
// // // //           isPhoneVerified: false
// // // //         }));

// // // //         setShowOtpInput(true);

// // // //         toast({
// // // //           title: "OTP Sent Successfully! 📱",
// // // //           description: `We've sent a 6-digit OTP to ${formatIndianPhone(formData.phone)}`,
// // // //           variant: "default",
// // // //         });
// // // //       } else {
// // // //         throw new Error(response.message || "Failed to send OTP");
// // // //       }
// // // //     } catch (error: any) {
// // // //       console.error("OTP send error:", error);

// // // //       let errorMessage = "Failed to send OTP. Please try again.";
// // // //       if (error.message.includes("OTP_GENERATION_FAILED")) {
// // // //         errorMessage = "Unable to send SMS OTP. Please check your phone number.";
// // // //       } else if (error.message.includes("INVALID_PHONE")) {
// // // //         errorMessage = "Invalid phone number. Please enter a valid 10-digit Indian number.";
// // // //       }

// // // //       toast({
// // // //         title: "SMS OTP Send Failed",
// // // //         description: errorMessage,
// // // //         variant: "destructive",
// // // //       });
// // // //     } finally {
// // // //       setIsSendingOtp(false);
// // // //     }
// // // //   };

// // // //   // Verify SMS OTP for FREE plan
// // // //   const handleVerifyOTP = async () => {
// // // //     if (!otpData.otp || otpData.otp.length !== 6) {
// // // //       toast({
// // // //         title: "Invalid OTP",
// // // //         description: "Please enter a valid 6-digit OTP",
// // // //         variant: "destructive",
// // // //       });
// // // //       return;
// // // //     }

// // // //     const cleanPhone = formData.phone.replace(/\D/g, '');

// // // //     setIsVerifyingOtp(true);
// // // //     try {
// // // //       const response = await verifySMSOTP(cleanPhone, formData.email, otpData.otp);

// // // //       if (response.success) {
// // // //         setOtpData(prev => ({
// // // //           ...prev,
// // // //           isPhoneVerified: true
// // // //         }));

// // // //         setShowOtpInput(false);

// // // //         toast({
// // // //           title: "Phone Verified Successfully! ✅",
// // // //           description: "Your phone number has been verified. You can now proceed with registration.",
// // // //           variant: "default",
// // // //         });
// // // //       } else {
// // // //         if (response.error === "INVALID_OTP") {
// // // //           toast({
// // // //             title: "Invalid OTP",
// // // //             description: response.message || "The OTP you entered is incorrect.",
// // // //             variant: "destructive",
// // // //           });
// // // //         } else if (response.error === "OTP_EXPIRED") {
// // // //           setOtpData(prev => ({
// // // //             ...prev,
// // // //             otpSent: false,
// // // //             otpCountdown: 0
// // // //           }));
// // // //           setShowOtpInput(false);

// // // //           toast({
// // // //             title: "OTP Expired",
// // // //             description: "The OTP has expired. Please request a new one.",
// // // //             variant: "destructive",
// // // //           });
// // // //         } else if (response.error === "MAX_ATTEMPTS") {
// // // //           setOtpData(prev => ({
// // // //             ...prev,
// // // //             otpSent: false,
// // // //             otpCountdown: 0
// // // //           }));
// // // //           setShowOtpInput(false);

// // // //           toast({
// // // //             title: "Maximum Attempts Exceeded",
// // // //             description: "Too many failed attempts. Please request a new OTP.",
// // // //             variant: "destructive",
// // // //           });
// // // //         }
// // // //       }
// // // //     } catch (error: any) {
// // // //       console.error("OTP verification error:", error);

// // // //       toast({
// // // //         title: "Verification Failed",
// // // //         description: "Failed to verify OTP. Please try again.",
// // // //         variant: "destructive",
// // // //       });
// // // //     } finally {
// // // //       setIsVerifyingOtp(false);
// // // //     }
// // // //   };

// // // //   // Send Email OTP for PRO plan
// // // //   const handleSendEmailOTP = async () => {
// // // //     if (!formData.email) {
// // // //       toast({
// // // //         title: "Email Required",
// // // //         description: "Please enter your email to receive OTP",
// // // //         variant: "destructive",
// // // //       });
// // // //       return;
// // // //     }

// // // //     // Validate email format
// // // //     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// // // //     if (!emailRegex.test(formData.email)) {
// // // //       toast({
// // // //         title: "Invalid Email",
// // // //         description: "Please enter a valid email address",
// // // //         variant: "destructive",
// // // //       });
// // // //       return;
// // // //     }

// // // //     setIsSendingEmailOTP(true);
// // // //     try {
// // // //       const response = await fetch(`${NODE_BACKEND_URL}/hotels/send-pro-otp`, {
// // // //         method: "POST",
// // // //         headers: { "Content-Type": "application/json" },
// // // //         body: JSON.stringify({
// // // //           email: formData.email,
// // // //           hotelName: formData.hotelName,
// // // //           adminName: formData.adminName
// // // //         }),
// // // //       });

// // // //       const data = await response.json();

// // // //       if (data.success) {
// // // //         setShowEmailOTPInput(true);
// // // //         toast({
// // // //           title: "OTP Sent Successfully! 📧",
// // // //           description: `We've sent a 6-digit OTP to ${formData.email}`,
// // // //           variant: "default",
// // // //         });
// // // //       } else {
// // // //         throw new Error(data.message || "Failed to send OTP");
// // // //       }
// // // //     } catch (error: any) {
// // // //       toast({
// // // //         title: "Failed to Send OTP",
// // // //         description: error.message || "Please try again",
// // // //         variant: "destructive",
// // // //       });
// // // //     } finally {
// // // //       setIsSendingEmailOTP(false);
// // // //     }
// // // //   };

// // // //   // Send OTP via Email AND WhatsApp for PRO plan
// // // //   const handleSendProPlanOTP = async () => {
// // // //     if (!formData.email) {
// // // //       toast({
// // // //         title: "Email Required",
// // // //         description: "Please enter your email to receive OTP",
// // // //         variant: "destructive",
// // // //       });
// // // //       return;
// // // //     }

// // // //     // Validate email format
// // // //     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// // // //     if (!emailRegex.test(formData.email)) {
// // // //       toast({
// // // //         title: "Invalid Email",
// // // //         description: "Please enter a valid email address",
// // // //         variant: "destructive",
// // // //       });
// // // //       return;
// // // //     }

// // // //     // Phone is optional for WhatsApp, but nice to have
// // // //     const cleanPhone = formData.phone ? formData.phone.replace(/\D/g, '') : null;

// // // //     setIsSendingEmailOTP(true);
// // // //     try {
// // // //       // Use the new endpoint that sends both Email AND WhatsApp
// // // //       const response = await fetch(`${NODE_BACKEND_URL}/hotels/send-pro-otp-whatsapp`, {
// // // //         method: "POST",
// // // //         headers: { "Content-Type": "application/json" },
// // // //         body: JSON.stringify({
// // // //           email: formData.email,
// // // //           hotelName: formData.hotelName,
// // // //           adminName: formData.adminName,
// // // //           phone: cleanPhone // Include phone for WhatsApp
// // // //         }),
// // // //       });

// // // //       const data = await response.json();

// // // //       if (data.success) {
// // // //         setShowEmailOTPInput(true);

// // // //         // Build success message based on delivery channels
// // // //         let successMessage = `OTP sent to ${formData.email}`;
// // // //         if (data.data?.delivery?.whatsapp?.sent) {
// // // //           const formattedPhone = formData.phone ?
// // // //             `+91 ${formData.phone.slice(0, 3)}-${formData.phone.slice(3, 6)}-${formData.phone.slice(6)}` :
// // // //             'your WhatsApp';
// // // //           successMessage += ` and 📱 ${formattedPhone}`;
// // // //         }

// // // //         toast({
// // // //           title: "OTP Sent Successfully! 📧📱",
// // // //           description: successMessage,
// // // //           variant: "default",
// // // //         });

// // // //         // Log which channels worked
// // // //         console.log("✅ OTP Delivery Status:", data.data?.delivery);
// // // //       } else {
// // // //         throw new Error(data.message || "Failed to send OTP");
// // // //       }
// // // //     } catch (error: any) {
// // // //       toast({
// // // //         title: "Failed to Send OTP",
// // // //         description: error.message || "Please try again",
// // // //         variant: "destructive",
// // // //       });
// // // //     } finally {
// // // //       setIsSendingEmailOTP(false);
// // // //     }
// // // //   };

// // // //   // Verify Email OTP for PRO plan
// // // //   const handleVerifyEmailOTP = async () => {
// // // //     if (!emailOTP || emailOTP.length !== 6) {
// // // //       toast({
// // // //         title: "Invalid OTP",
// // // //         description: "Please enter a valid 6-digit OTP",
// // // //         variant: "destructive",
// // // //       });
// // // //       return;
// // // //     }

// // // //     setIsVerifyingEmailOTP(true);
// // // //     try {
// // // //       const response = await fetch(`${NODE_BACKEND_URL}/hotels/verify-email-otp`, {
// // // //         method: "POST",
// // // //         headers: { "Content-Type": "application/json" },
// // // //         body: JSON.stringify({
// // // //           email: formData.email,
// // // //           otp: emailOTP
// // // //         }),
// // // //       });

// // // //       const data = await response.json();

// // // //       if (data.success) {
// // // //         setEmailOTPVerified(true);
// // // //         setShowEmailOTPInput(false);
// // // //         toast({
// // // //           title: "Email Verified Successfully! ✅",
// // // //           description: "Your email has been verified for PRO plan",
// // // //           variant: "default",
// // // //         });
// // // //       } else {
// // // //         throw new Error(data.message || "Invalid OTP");
// // // //       }
// // // //     } catch (error: any) {
// // // //       toast({
// // // //         title: "OTP Verification Failed",
// // // //         description: error.message || "Please try again",
// // // //         variant: "destructive",
// // // //       });
// // // //     } finally {
// // // //       setIsVerifyingEmailOTP(false);
// // // //     }
// // // //   };

// // // //   // Main submit handler
// // // //   const handleSubmit = async (e: React.FormEvent) => {
// // // //     e.preventDefault();

// // // //     if (formData.plan === "enterprise") {
// // // //       toast({
// // // //         title: "Enterprise Plan - Coming Soon",
// // // //         description: "Please contact sales for enterprise solutions",
// // // //         variant: "default",
// // // //       });
// // // //       return;
// // // //     }

// // // //     // FOR FREE PLAN
// // // //     if (formData.plan === "free") {
// // // //       if (!otpData.isPhoneVerified) {
// // // //         if (!showOtpInput) {
// // // //           await handleSendOTP();
// // // //           return;
// // // //         } else {
// // // //           await handleVerifyOTP();
// // // //           return;
// // // //         }
// // // //       }
// // // //     }

// // // //     // FOR PRO PLAN
// // // //     if (formData.plan === "pro") {
// // // //       if (!emailOTPVerified) {
// // // //         if (!showEmailOTPInput) {
// // // //           await handleSendProPlanOTP();
// // // //           return;
// // // //         } else {
// // // //           await handleVerifyEmailOTP();
// // // //           return;
// // // //         }
// // // //       }
// // // //     }

// // // //     // If all validations pass, complete registration
// // // //     await completeRegistration();
// // // //   };

// // // //   // Complete registration
// // // //   const completeRegistration = async () => {
// // // //     setIsSubmitting(true);

// // // //     try {
// // // //       const cleanPhone = formData.phone.replace(/\D/g, '');

// // // //       const hotelData = {
// // // //         hotelName: formData.hotelName.trim(),
// // // //         address: formData.address.trim(),
// // // //         plan: formData.plan,
// // // //         gstNumber: formData.gstNumber.trim(),
// // // //         referralCode: referralValid ? referralCode : null,
// // // //         admin: {
// // // //           username: formData.username.trim(),
// // // //           password: formData.password,
// // // //           role: "admin",
// // // //           name: formData.adminName,
// // // //           email: formData.email,
// // // //           phone: cleanPhone,
// // // //           status: formData.plan === "free" ? "active" : "pending"
// // // //         }
// // // //       };

// // // //       // Add email OTP for PRO plan verification
// // // //       if (formData.plan === "pro") {
// // // //         (hotelData as any).emailOTP = emailOTP;
// // // //         console.log("📤 [PRO REGISTRATION] Sending email OTP:", emailOTP);
// // // //         console.log("📤 [PRO REGISTRATION] Email:", formData.email);
// // // //       }

// // // //       let data;

// // // //       if (formData.plan === "free") {
// // // //         console.log("FREE plan selected - Saving to Google Sheets");

// // // //         const paramObj: Record<string, unknown> = {
// // // //           action: "createHotel",
// // // //           ...hotelData,
// // // //           "admin[status]": "active"
// // // //         };

// // // //         const queryString = buildQueryString(paramObj);
// // // //         const url = APPS_SCRIPT_URL + "?" + queryString;

// // // //         console.log("Sending to Google Apps Script:", url);
// // // //         data = await jsonpRequest(url);

// // // //       } else {
// // // //         console.log("PRO plan selected - Saving to MySQL Database");
// // // //         console.log("Sending to Node.js backend:", hotelData);

// // // //         data = await fetchBackendRequest("/hotels/register", hotelData);
// // // //       }

// // // //       if (data.success) {
// // // //         let message = '';
// // // //         if (formData.plan === 'pro') {
// // // //           message = `${formData.hotelName} has been registered with PRO Plan (30-day FREE trial). Check your email for login details.`;
// // // //         } else {
// // // //           message = `${formData.hotelName} is now on FREE Plan. You can login now.`;
// // // //         }

// // // //         toast({
// // // //           title: `Registration Successful! 🎉`,
// // // //           description: message,
// // // //         });

// // // //         // Reset form
// // // //         setFormData({
// // // //           adminName: "",
// // // //           username: "",
// // // //           password: "",
// // // //           hotelName: "",
// // // //           email: "",
// // // //           phone: "",
// // // //           address: "",
// // // //           gstNumber: "",
// // // //           plan: "free",
// // // //         });

// // // //         // Reset OTP states
// // // //         setOtpData({
// // // //           otp: "",
// // // //           isPhoneVerified: false,
// // // //           otpSent: false,
// // // //           otpCountdown: 0,
// // // //           otpResendCount: 0,
// // // //           maxOtpResends: 3,
// // // //         });

// // // //         setEmailOTP("");
// // // //         setEmailOTPVerified(false);
// // // //         setShowEmailOTPInput(false);
// // // //         setShowOtpInput(false);
// // // //         setShowForm(false);

// // // //         onClose();
// // // //         navigate("/login");

// // // //       } else {
// // // //         if (data.error === "HOTEL_EXISTS") {
// // // //           toast({
// // // //             title: "Registration Failed",
// // // //             description: "Hotel already registered. Try a different name.",
// // // //             variant: "destructive",
// // // //           });
// // // //         } else if (data.error === "USERNAME_EXISTS") {
// // // //           toast({
// // // //             title: "Username Taken",
// // // //             description: "This username is already in use. Choose another one.",
// // // //             variant: "destructive",
// // // //           });
// // // //         } else if (data.error === "INVALID_OTP") {
// // // //           toast({
// // // //             title: "OTP Verification Failed",
// // // //             description: "Please verify your email OTP again",
// // // //             variant: "destructive",
// // // //           });
// // // //         } else {
// // // //           throw new Error(data.message || data.error || "Failed to create hotel");
// // // //         }
// // // //       }
// // // //     } catch (err: any) {
// // // //       console.error("Registration error:", err);

// // // //       let errorMessage = err.message || "Something went wrong.";

// // // //       if (err.message.includes("Failed to fetch")) {
// // // //         errorMessage = "Cannot connect to the server. Please check if the backend is running.";
// // // //       } else if (err.message.includes("Failed to load script")) {
// // // //         errorMessage = "Cannot connect to Google Sheets. Please check your internet connection.";
// // // //       }

// // // //       toast({
// // // //         title: "Registration Failed",
// // // //         description: errorMessage,
// // // //         variant: "destructive",
// // // //       });
// // // //     } finally {
// // // //       setIsSubmitting(false);
// // // //     }
// // // //   };

// // // //   // Plan features detail
// // // //   const detailedFeatures = {
// // // //     free: [
// // // //       { text: "Basic booking register", included: true },
// // // //       { text: "5,000 records limit", included: true },
// // // //       { text: "Manual room status update (max 20 rooms)", included: true },
// // // //       { text: "Simple digital check-in/check-out (no guest history)", included: true },
// // // //       { text: "Mobile version (limited view mode only)", included: true },
// // // //       { text: "Basic print invoice", included: true },
// // // //       { text: "Manual payment entry only", included: true },
// // // //       { text: "Only today's check-in/check-out report (no export)", included: true },
// // // //       { text: "No staff management", included: false },
// // // //       { text: "No WhatsApp alerts", included: false },
// // // //       { text: "No OTA connectivity", included: false },
// // // //       { text: "Basic owner dashboard (daily summary only)", included: true },
// // // //       { text: "No AI features", included: false },
// // // //       { text: "No integrations", included: false },
// // // //       { text: "Help docs support only", included: true },
// // // //       { text: "Go live in less than a minute", included: true },
// // // //       { text: "Lifetime free", included: true }
// // // //     ],
// // // //     pro: [
// // // //       { text: "Full PMS: room allocation, early/late check-in/out", included: true },
// // // //       { text: "50,000 records", included: true },
// // // //       { text: "Housekeeping app + live status", included: true },
// // // //       { text: "Automated check-in/out + guest history", included: true },
// // // //       { text: "Full mobile app for staff & owner", included: true },
// // // //       { text: "GST invoice generator", included: true },
// // // //       { text: "Online payment links", included: true },
// // // //       { text: "Split billing + outstanding tracking", included: true },
// // // //       { text: "Daily revenue dashboard + audit report", included: true },
// // // //       { text: "Attendance + payroll", included: true },
// // // //       { text: "WhatsApp reminders (check-out, payments, tasks)", included: true },
// // // //       { text: "Booking.com / MMT / Goibibo auto-sync", included: true },
// // // //       { text: "Daily MIS via WhatsApp", included: true },
// // // //       { text: "No AI pricing engine", included: false },
// // // //       { text: "POS optional integration", included: true },
// // // //       { text: "WhatsApp & call support", included: true },
// // // //       { text: "Go live in less than 1 hour", included: true },
// // // //       { text: "30-day FREE trial, then ₹999 / 6 months", included: true }
// // // //     ],
// // // //     enterprise: [
// // // //       { text: "Chain-level PMS & coordination", included: true },
// // // //       { text: "Unlimited records", included: true },
// // // //       { text: "Central housekeeping monitoring", included: true },
// // // //       { text: "Central guest database across properties", included: true },
// // // //       { text: "Advanced chain manager mobile app", included: true },
// // // //       { text: "Multi-property GST/ledger system", included: true },
// // // //       { text: "Central finance dashboard", included: true },
// // // //       { text: "Chain-level analytics (ADR, RevPAR, occupancy)", included: true },
// // // //       { text: "Multi-property HR & approvals", included: true },
// // // //       { text: "Advanced WhatsApp automation (chain MIS, AI alerts)", included: true },
// // // //       { text: "Centralized rate & multiple OTA management", included: true },
// // // //       { text: "Group-level performance dashboard", included: true },
// // // //       { text: "AI pricing engine + forecasting", included: true },
// // // //       { text: "Full API + channel managers + smart locks", included: true },
// // // //       { text: "Dedicated manager + SLA", included: true },
// // // //       { text: "Go live in a day", included: true },
// // // //       { text: "Custom pricing", included: true }
// // // //     ]
// // // //   };

// // // //   // Plan configurations
// // // //   const plans = [
// // // //     {
// // // //       id: "free",
// // // //       name: "BASIC",
// // // //       subtitle: "Small Hotels – Limited",
// // // //       price: "₹0/month",
// // // //       color: "border-gray-300",
// // // //       buttonVariant: "secondary" as const,
// // // //       available: true,
// // // //       icon: "🆓"
// // // //     },
// // // //     {
// // // //       id: "pro",
// // // //       name: "PRO",
// // // //       subtitle: "Boutique / 20–70 Rooms",
// // // //       price: "30-day FREE trial",
// // // //       color: "border-blue-500",
// // // //       buttonVariant: "default" as const,
// // // //       available: true,
// // // //       icon: "⭐"
// // // //     },
// // // //     {
// // // //       id: "enterprise",
// // // //       name: "ENTERPRISE",
// // // //       subtitle: "Hotel Chains",
// // // //       price: "Contact for pricing",
// // // //       color: "border-purple-600",
// // // //       buttonVariant: "default" as const,
// // // //       available: false,
// // // //       icon: "🏢"
// // // //     }
// // // //   ];

// // // //   // Get current plan
// // // //   const selectedPlan = plans.find(p => p.id === formData.plan);
// // // //   const isAvailablePlan = selectedPlan?.available;

// // // //   // Get button text based on current state
// // // //   const getButtonText = () => {
// // // //     if (!isAvailablePlan) return 'Upcoming';

// // // //     if (isSubmitting) return 'Registering...';
// // // //     if (isSendingOtp) return 'Sending SMS OTP...';
// // // //     if (isVerifyingOtp) return 'Verifying SMS OTP...';
// // // //     if (isSendingEmailOTP) return 'Sending Email OTP...';
// // // //     if (isVerifyingEmailOTP) return 'Verifying Email OTP...';

// // // //     if (formData.plan === "free") {
// // // //       if (!otpData.isPhoneVerified) {
// // // //         if (!showOtpInput) {
// // // //           return 'Send SMS OTP to Register';
// // // //         } else {
// // // //           return 'Verify SMS OTP & Register';
// // // //         }
// // // //       }
// // // //     } else if (formData.plan === "pro") {
// // // //       if (!emailOTPVerified) {
// // // //         if (!showEmailOTPInput) {
// // // //           return 'Send Email OTP for PRO Plan';
// // // //         } else {
// // // //           return 'Verify Email OTP & Register';
// // // //         }
// // // //       }
// // // //     }

// // // //     return `Start ${formData.plan.toUpperCase()} Plan`;
// // // //   };

// // // //   // Determine if submit button should be disabled
// // // //   const isSubmitDisabled = () => {
// // // //     if (!isAvailablePlan) return true;
// // // //     if (isSubmitting || isSendingOtp || isVerifyingOtp || isSendingEmailOTP || isVerifyingEmailOTP) return true;

// // // //     if (formData.plan === "free" && showOtpInput && !otpData.isPhoneVerified) {
// // // //       return otpData.otp.length !== 6;
// // // //     }

// // // //     if (formData.plan === "pro" && showEmailOTPInput && !emailOTPVerified) {
// // // //       return emailOTP.length !== 6;
// // // //     }

// // // //     return false;
// // // //   };

// // // //   return (

// // // //     <Dialog open={open} onOpenChange={onClose}>
// // // //       <DialogContent className="max-w-[95vw] mx-auto sm:max-w-6xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
// // // //         <DialogHeader className="px-0 sm:px-2">
// // // //           <DialogTitle className="text-lg sm:text-xl">Register New Hotel</DialogTitle>
// // // //           <DialogDescription className="text-sm sm:text-base">
// // // //             Choose your plan and fill in details
// // // //           </DialogDescription>
// // // //         </DialogHeader>

// // // //         <form onSubmit={handleSubmit} className="space-y-4">
// // // //           {/* Plan Selection Header - Mobile Optimized */}
// // // //           <div className="space-y-2">
// // // //             <Label className="text-base sm:text-lg font-semibold">Choose Your Plan</Label>

// // // //             <Tabs
// // // //               value={formData.plan}
// // // //               onValueChange={handlePlanChange}
// // // //               className="w-full"
// // // //             >
// // // //               <TabsList className="grid w-full grid-cols-3 mb-4 h-16 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
// // // //                 <TabsTrigger
// // // //                   value="pro"
// // // //                   className="rounded-lg h-full data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center justify-center gap-1.5 font-bold text-[10px] sm:text-sm text-slate-600 data-[state=active]:text-blue-600 transition-all duration-200"
// // // //                 >
// // // //                   <Star className="h-3.5 w-3.5 fill-current" /> PRO
// // // //                 </TabsTrigger>
// // // //                 <TabsTrigger
// // // //                   value="free"
// // // //                   className="rounded-lg h-full data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center justify-center gap-1.5 font-bold text-[10px] sm:text-sm text-slate-600 data-[state=active]:text-emerald-600 transition-all duration-200"
// // // //                 >
// // // //                   <span className="text-xs sm:text-sm">🆓</span> BASIC
// // // //                 </TabsTrigger>
// // // //                 <TabsTrigger
// // // //                   value="enterprise"
// // // //                   className="rounded-lg h-full data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center justify-center gap-1.5 font-bold text-[10px] sm:text-sm text-slate-600 data-[state=active]:text-purple-600 transition-all duration-200"
// // // //                 >
// // // //                   <span className="text-xs sm:text-sm">🏢</span> ENTERPRISE
// // // //                 </TabsTrigger>
// // // //               </TabsList>

// // // //               {plans.map((plan) => (
// // // //                 <TabsContent key={plan.id} value={plan.id} className="mt-0">
// // // //                   <div className="relative max-w-xl mx-auto">
// // // //                     {plan.id === "pro" && (
// // // //                       <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
// // // //                         <Badge className="bg-green-600 text-white text-[10px] sm:text-xs shadow-sm ring-2 ring-background px-3 py-0.5 uppercase tracking-wider">
// // // //                           ⭐ Most Popular
// // // //                         </Badge>
// // // //                       </div>
// // // //                     )}
// // // //                     {!plan.available && (
// // // //                       <div className="absolute -top-3 right-4 z-10">
// // // //                         <Badge className="bg-amber-500 text-white text-[10px] sm:text-xs shadow-sm ring-2 ring-background">Upcoming</Badge>
// // // //                       </div>
// // // //                     )}

// // // //                     <div
// // // //                       className={`flex flex-col rounded-xl border-2 ${plan.color} bg-card p-4 sm:p-5 transition-all ring-2 ring-primary ring-offset-1 sm:ring-offset-2 shadow-lg ${!plan.available ? 'opacity-70' : ''}`}
// // // //                     >
// // // //                       <div className="flex-grow">
// // // //                         <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-3 border-b pb-3">
// // // //                           <div className="text-center sm:text-left min-w-0">
// // // //                             <div className="flex justify-center sm:justify-start items-center gap-2 mb-1">
// // // //                               <span className="text-2xl sm:text-3xl shrink-0">{plan.icon}</span>
// // // //                               <h3 className="font-bold text-lg sm:text-2xl truncate uppercase tracking-wide">{plan.name}</h3>
// // // //                             </div>
// // // //                             <p className="text-sm text-muted-foreground truncate">{plan.subtitle}</p>
// // // //                           </div>
// // // //                           <Badge
// // // //                             variant={plan.buttonVariant}
// // // //                             className={`text-xs sm:text-sm whitespace-nowrap border-none shrink-0 py-1.5 px-4 rounded-full ${plan.id === 'free' ? 'bg-secondary text-secondary-foreground' : 'bg-cyan-500 text-white hover:bg-cyan-600'
// // // //                               }`}
// // // //                           >
// // // //                             {plan.price}
// // // //                           </Badge>
// // // //                         </div>

// // // //                         <div className="text-sm space-y-3 mb-2">
// // // //                           <div className="flex flex-col space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
// // // //                             <div className="flex items-center text-sm font-medium">
// // // //                               <span className="text-green-600 mr-2 bg-green-100 p-0.5 rounded-full">✓</span>
// // // //                               <span>
// // // //                                 {plan.id === "free" ? "5,000 records" :
// // // //                                   plan.id === "pro" ? "50,000 records" :
// // // //                                     "Unlimited records"}
// // // //                               </span>
// // // //                             </div>
// // // //                             {plan.id === "pro" && (
// // // //                               <div className="space-y-3">
// // // //                                 <div className="flex items-center text-sm font-medium">
// // // //                                   <Calendar className="h-4 w-4 mr-2 text-blue-600 bg-blue-100 p-0.5 rounded-sm" />
// // // //                                   <span>30-day FREE trial</span>
// // // //                                 </div>
// // // //                                 <div className="flex items-center text-sm font-medium">
// // // //                                   <Mail className="h-4 w-4 mr-2 text-blue-600 bg-blue-100 p-0.5 rounded-sm" />
// // // //                                   <span>Email verification required</span>
// // // //                                 </div>
// // // //                               </div>
// // // //                             )}
// // // //                           </div>

// // // //                           <div className="mt-4 pt-4 border-t border-dashed">
// // // //                             {/* Shiny Badges */}
// // // //                             <div className="text-center mb-4">
// // // //                               <div className="inline-block transform transition-all hover:scale-105">
// // // //                                 {plan.id === "free" ?
// // // //                                   <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg px-4 py-2 shadow-sm">
// // // //                                     <span className="text-sm sm:text-base font-bold text-blue-700 tracking-wide uppercase">
// // // //                                       ✨ Life Time Free ✨
// // // //                                     </span>
// // // //                                   </div> :
// // // //                                   plan.id === "pro" ?
// // // //                                     <div className="bg-gradient-to-r from-amber-50 to-orange-100 border border-amber-200 rounded-lg px-4 py-2 shadow-sm">
// // // //                                       <span className="text-sm sm:text-base font-bold text-amber-700 tracking-wide uppercase">
// // // //                                         ✨ 30 Days FREE ✨
// // // //                                       </span>
// // // //                                     </div> :
// // // //                                     <div className="bg-gradient-to-r from-purple-50 to-pink-100 border border-purple-200 rounded-lg px-4 py-2 shadow-sm">
// // // //                                       <span className="text-sm sm:text-base font-bold text-purple-700 tracking-wide uppercase">
// // // //                                         ✨ Contact Pricing ✨
// // // //                                       </span>
// // // //                                     </div>
// // // //                                 }
// // // //                               </div>
// // // //                             </div>

// // // //                             {/* Actions Group (Know More & Register) */}
// // // //                             <div className="flex flex-col sm:flex-row gap-3">
// // // //                               <Button
// // // //                                 type="button"
// // // //                                 variant="outline"
// // // //                                 size="sm"
// // // //                                 className="flex-1 text-slate-700 hover:text-slate-900 font-medium py-4 flex items-center justify-center gap-2 rounded-lg"
// // // //                                 onClick={(e) => {
// // // //                                   e.preventDefault();
// // // //                                   setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id);
// // // //                                 }}
// // // //                               >
// // // //                                 {expandedPlanId === plan.id ? (
// // // //                                   <>Show Less <ChevronUp className="h-4 w-4" /></>
// // // //                                 ) : (
// // // //                                   <>🔍 Know More <ChevronDown className="h-4 w-4" /></>
// // // //                                 )}
// // // //                               </Button>

// // // //                               {!showForm && plan.available && (
// // // //                                 <Button
// // // //                                   type="button"
// // // //                                   onClick={() => setShowForm(true)}
// // // //                                   size="sm"
// // // //                                   className={`flex-1 py-4 text-sm sm:text-base font-bold tracking-wide shadow-md rounded-lg text-white ${plan.id === 'pro' || plan.id === 'enterprise'
// // // //                                     ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
// // // //                                     : 'bg-primary hover:bg-primary/90'
// // // //                                     }`}
// // // //                                 >
// // // //                                   Register Now
// // // //                                 </Button>
// // // //                               )}
// // // //                             </div>

// // // //                             {/* Expanded Features List */}
// // // //                             <div
// // // //                               className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedPlanId === plan.id ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
// // // //                             >
// // // //                               <div className="bg-[#f8f9fa] rounded-xl p-4 sm:p-5 border border-slate-200 space-y-3">
// // // //                                 {(detailedFeatures as any)[plan.id].map((feature: { text: string, included: boolean }, idx: number) => (
// // // //                                   <div key={idx} className={`flex items-start gap-3 text-xs sm:text-sm font-medium ${feature.included ? 'text-slate-800' : 'text-slate-400'}`}>
// // // //                                     {feature.included ? (
// // // //                                       <div className="bg-green-100 p-0.5 rounded-full mt-0.5 shrink-0">
// // // //                                         <Check className="h-3 w-3 text-green-700" />
// // // //                                       </div>
// // // //                                     ) : (
// // // //                                       <div className="bg-slate-100 p-0.5 rounded-full mt-0.5 shrink-0">
// // // //                                         <X className="h-3 w-3 text-slate-400" />
// // // //                                       </div>
// // // //                                     )}
// // // //                                     <span className="leading-snug">{feature.text}</span>
// // // //                                   </div>
// // // //                                 ))}
// // // //                               </div>
// // // //                             </div>
// // // //                           </div>
// // // //                         </div>
// // // //                       </div>
// // // //                     </div>
// // // //                   </div>
// // // //                 </TabsContent>
// // // //               ))}
// // // //             </Tabs>
// // // //           </div>

// // // //           {/* Hotel Details - Mobile Optimized */}

// // // //           {isAvailablePlan && showForm && (
// // // //             <div className="space-y-4 pt-4 border-t border-dashed mt-4">
// // // //               <Label className="text-base sm:text-lg font-semibold">Hotel & Admin Details</Label>

// // // //               {/* Phone Verification Status for FREE Plan */}
// // // //               {formData.plan === "free" && otpData.isPhoneVerified && (
// // // //                 <Alert className="bg-green-50 border-green-200 text-xs sm:text-sm">
// // // //                   <div className="flex items-center gap-2">
// // // //                     <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
// // // //                     <AlertDescription className="text-green-800">
// // // //                       <strong>Phone Verified!</strong> Your phone {formatIndianPhone(formData.phone)} is verified.
// // // //                     </AlertDescription>
// // // //                   </div>
// // // //                 </Alert>
// // // //               )}



// // // //               {/* Hotel Details Form - Mobile Responsive Grid */}
// // // //               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
// // // //                 {[
// // // //                   { id: "adminName", label: "Admin Name *", placeholder: "Enter admin name" },
// // // //                   { id: "username", label: "Username *", placeholder: "Choose username" },
// // // //                   { id: "password", label: "Password *", type: "password", placeholder: "Create password" },
// // // //                   { id: "hotelName", label: "Hotel Name *", placeholder: "Enter hotel name" },
// // // //                   {
// // // //                     id: "email",
// // // //                     label: "Email *",
// // // //                     type: "email",
// // // //                     placeholder: "admin@hotel.com",
// // // //                     disabled: formData.plan === "pro" && emailOTPVerified
// // // //                   },
// // // //                   {
// // // //                     id: "phone",
// // // //                     label: "Phone *",
// // // //                     type: "tel",
// // // //                     placeholder: "9876543210",
// // // //                     disabled: formData.plan === "free" && otpData.isPhoneVerified
// // // //                   },
// // // //                 ].map((f) => (
// // // //                   <div key={f.id} className="space-y-1 sm:space-y-2">
// // // //                     <Label htmlFor={f.id} className="text-xs sm:text-sm">
// // // //                       {f.label}
// // // //                       {f.id === "phone" && formData.plan === "free" && otpData.isPhoneVerified && (
// // // //                         <CheckCircle className="h-3 w-3 text-green-500 inline ml-1" />
// // // //                       )}
// // // //                       {f.id === "email" && formData.plan === "pro" && emailOTPVerified && (
// // // //                         <CheckCircle className="h-3 w-3 text-green-500 inline ml-1" />
// // // //                       )}
// // // //                     </Label>
// // // //                     <Input
// // // //                       id={f.id}
// // // //                       type={f.type || "text"}
// // // //                       value={(formData as any)[f.id]}
// // // //                       onChange={(e) => handleChange(f.id, e.target.value)}
// // // //                       placeholder={f.placeholder}
// // // //                       required
// // // //                       disabled={f.disabled || false}
// // // //                       className="text-sm sm:text-base"
// // // //                     />
// // // //                   </div>
// // // //                 ))}
// // // //               </div>

// // // //               <div className="space-y-1 sm:space-y-2">
// // // //                 <Label htmlFor="address" className="text-xs sm:text-sm">Hotel Address *</Label>
// // // //                 <Input
// // // //                   id="address"
// // // //                   value={formData.address}
// // // //                   onChange={(e) => handleChange("address", e.target.value)}
// // // //                   placeholder="Enter hotel address"
// // // //                   required
// // // //                   className="text-sm sm:text-base"
// // // //                 />
// // // //               </div>
// // // //               <div className="space-y-1 sm:space-y-2">
// // // //                 <Label htmlFor="gstNumber" className="text-xs sm:text-sm">
// // // //                   GST Number
// // // //                 </Label>
// // // //                 <Input
// // // //                   id="gstNumber"
// // // //                   value={formData.gstNumber}
// // // //                   onChange={(e) => handleChange("gstNumber", e.target.value.toUpperCase())}
// // // //                   placeholder="Enter GSTIN (if available)"
// // // //                   className="uppercase tracking-wider text-sm sm:text-base"
// // // //                   maxLength={15}
// // // //                   required={false}
// // // //                 />
// // // //                 <p className="text-xs text-muted-foreground">
// // // //                   Keep blank if GSTIN is not available
// // // //                 </p>
// // // //               </div>

// // // //               {/* Email OTP Input Section for PRO Plan */}
// // // //               {formData.plan === "pro" && showEmailOTPInput && !emailOTPVerified && (
// // // //                 <div className="space-y-4 border rounded-lg p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-pink-50">
// // // //                   <div className="flex items-center gap-3">
// // // //                     <div className="p-2 bg-purple-100 rounded-lg">
// // // //                       <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
// // // //                     </div>
// // // //                     <div>
// // // //                       <h3 className="font-semibold text-base sm:text-lg">Verify Your Email for PRO Plan</h3>
// // // //                       <p className="text-xs sm:text-sm text-muted-foreground">
// // // //                         OTP sent to <strong>{formData.email}</strong>
// // // //                       </p>
// // // //                     </div>
// // // //                   </div>

// // // //                   <Alert className="bg-amber-50 border-amber-200 text-xs sm:text-sm">
// // // //                     <AlertDescription className="text-amber-800">
// // // //                       <div className="flex items-start gap-2">
// // // //                         <ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" />
// // // //                         <div>
// // // //                           <strong>PRO Plan Trial:</strong> You'll get 30 days FREE trial.
// // // //                         </div>
// // // //                       </div>
// // // //                     </AlertDescription>
// // // //                   </Alert>

// // // //                   <div className="space-y-3">
// // // //                     <Label htmlFor="email-otp" className="text-sm sm:text-base">
// // // //                       Enter 6-digit Email OTP
// // // //                     </Label>
// // // //                     <div className="flex gap-2">
// // // //                       <div className="flex-1">
// // // //                         <Input
// // // //                           id="email-otp"
// // // //                           type="text"
// // // //                           inputMode="numeric"
// // // //                           pattern="\d*"
// // // //                           maxLength={6}
// // // //                           value={emailOTP}
// // // //                           onChange={(e) => handleEmailOtpChange(e.target.value)}
// // // //                           placeholder="000000"
// // // //                           className="text-center text-xl sm:text-2xl font-mono tracking-widest h-12 sm:h-14"
// // // //                           autoFocus
// // // //                         />
// // // //                       </div>
// // // //                       <Button
// // // //                         type="button"
// // // //                         onClick={handleVerifyEmailOTP}
// // // //                         disabled={emailOTP.length !== 6 || isVerifyingEmailOTP}
// // // //                         className="bg-green-600 hover:bg-green-700"
// // // //                       >
// // // //                         {isVerifyingEmailOTP ? (
// // // //                           <Loader2 className="h-4 w-4 animate-spin" />
// // // //                         ) : (
// // // //                           "Verify"
// // // //                         )}
// // // //                       </Button>
// // // //                     </div>

// // // //                     <div className="flex justify-center pt-2">
// // // //                       <Button
// // // //                         type="button"
// // // //                         variant="outline"
// // // //                         size="sm"
// // // //                         onClick={() => {
// // // //                           setShowEmailOTPInput(false);
// // // //                           setEmailOTP("");
// // // //                         }}
// // // //                         className="text-xs sm:text-sm"
// // // //                       >
// // // //                         <ArrowLeft className="h-3 w-3 mr-1" />
// // // //                         Back to Form
// // // //                       </Button>
// // // //                     </div>
// // // //                   </div>
// // // //                 </div>
// // // //               )}

// // // //               {/* SMS OTP Input Section for FREE Plan - Always show when OTP is sent */}
// // // //               {formData.plan === "free" && otpData.otpSent && !otpData.isPhoneVerified && (
// // // //                 <div className="space-y-4 border rounded-lg p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
// // // //                   <div className="flex items-center gap-3">
// // // //                     <div className="p-2 bg-blue-100 rounded-lg">
// // // //                       <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
// // // //                     </div>
// // // //                     <div>
// // // //                       <h3 className="font-semibold text-base sm:text-lg">Verify Your Phone</h3>
// // // //                       <p className="text-xs sm:text-sm text-muted-foreground">
// // // //                         OTP sent to <strong>{formatIndianPhone(formData.phone)}</strong>
// // // //                       </p>
// // // //                     </div>
// // // //                   </div>

// // // //                   <Alert className="bg-amber-50 border-amber-200 text-xs sm:text-sm">
// // // //                     <AlertDescription className="text-amber-800">
// // // //                       <div className="flex items-start gap-2">
// // // //                         <ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" />
// // // //                         <div>
// // // //                           <strong>Security Notice:</strong> OTP valid for 5 minutes.
// // // //                         </div>
// // // //                       </div>
// // // //                     </AlertDescription>
// // // //                   </Alert>

// // // //                   <div className="space-y-3">
// // // //                     <Label htmlFor="otp" className="text-sm sm:text-base">
// // // //                       Enter 6-digit OTP
// // // //                     </Label>
// // // //                     <div className="flex gap-2">
// // // //                       <div className="flex-1">
// // // //                         <Input
// // // //                           id="otp"
// // // //                           type="text"
// // // //                           inputMode="numeric"
// // // //                           pattern="\d*"
// // // //                           maxLength={6}
// // // //                           value={otpData.otp}
// // // //                           onChange={(e) => handleOtpChange(e.target.value)}
// // // //                           placeholder="000000"
// // // //                           className="text-center text-xl sm:text-2xl font-mono tracking-widest h-12 sm:h-14"
// // // //                           autoFocus
// // // //                         />
// // // //                         <div className="flex justify-between items-center mt-2">
// // // //                           <span className="text-xs sm:text-sm text-muted-foreground">
// // // //                             {otpData.otpCountdown > 0 ? (
// // // //                               <span className="text-amber-600">
// // // //                                 Expires in {formatCountdown(otpData.otpCountdown)}
// // // //                               </span>
// // // //                             ) : (
// // // //                               <span className="text-red-600">OTP expired</span>
// // // //                             )}
// // // //                           </span>
// // // //                           <Button
// // // //                             type="button"
// // // //                             variant="link"
// // // //                             size="sm"
// // // //                             onClick={handleSendOTP}
// // // //                             disabled={isSendingOtp || otpData.otpCountdown > 0 || otpData.otpResendCount >= otpData.maxOtpResends}
// // // //                             className="h-auto p-0 text-xs sm:text-sm"
// // // //                           >
// // // //                             {isSendingOtp ? (
// // // //                               <>
// // // //                                 <Loader2 className="h-3 w-3 mr-1 animate-spin" />
// // // //                                 Sending...
// // // //                               </>
// // // //                             ) : (
// // // //                               <>
// // // //                                 <RefreshCw className="h-3 w-3 mr-1" />
// // // //                                 Resend
// // // //                               </>
// // // //                             )}
// // // //                           </Button>
// // // //                         </div>
// // // //                       </div>
// // // //                       <Button
// // // //                         type="button"
// // // //                         onClick={handleVerifyOTP}
// // // //                         disabled={otpData.otp.length !== 6 || isVerifyingOtp}
// // // //                         className="bg-green-600 hover:bg-green-700"
// // // //                       >
// // // //                         {isVerifyingOtp ? (
// // // //                           <Loader2 className="h-4 w-4 animate-spin" />
// // // //                         ) : (
// // // //                           "Verify"
// // // //                         )}
// // // //                       </Button>
// // // //                     </div>

// // // //                     <div className="flex justify-center pt-2">
// // // //                       <Button
// // // //                         type="button"
// // // //                         variant="outline"
// // // //                         size="sm"
// // // //                         onClick={() => {
// // // //                           setOtpData(prev => ({
// // // //                             ...prev,
// // // //                             otpSent: false,
// // // //                             otp: "",
// // // //                             otpCountdown: 0
// // // //                           }));
// // // //                         }}
// // // //                         className="text-xs sm:text-sm"
// // // //                       >
// // // //                         <ArrowLeft className="h-3 w-3 mr-1" />
// // // //                         Back to Form
// // // //                       </Button>
// // // //                     </div>
// // // //                   </div>
// // // //                 </div>
// // // //               )}

// // // //             </div>
// // // //           )}

// // // //           {/* Action Buttons */}
// // // //           {showForm && (
// // // //             <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t">
// // // //               <Button
// // // //                 type="button"
// // // //                 variant="outline"
// // // //                 onClick={() => {
// // // //                   onClose();
// // // //                   setShowForm(false);
// // // //                 }}
// // // //                 disabled={isSubmitting || isSendingOtp || isVerifyingOtp || isSendingEmailOTP || isVerifyingEmailOTP}
// // // //                 className="w-full sm:w-auto text-sm sm:text-base"
// // // //               >
// // // //                 Cancel
// // // //               </Button>
// // // //               <Button
// // // //                 type="submit"
// // // //                 disabled={isSubmitDisabled()}
// // // //                 className={`w-full sm:w-auto text-sm sm:text-base min-w-32 ${!isAvailablePlan ? 'bg-amber-500 hover:bg-amber-600' :
// // // //                   formData.plan === 'pro' ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : ''
// // // //                   }`}
// // // //               >
// // // //                 {getButtonText()}
// // // //               </Button>
// // // //             </div>
// // // //           )}

// // // //           {/* Plan Summary - Mobile Optimized */}
// // // //           {showForm && (
// // // //             <div className={`text-xs sm:text-sm text-center p-2 sm:p-3 rounded ${formData.plan === 'enterprise'
// // // //               ? 'bg-amber-50 border border-amber-200 text-amber-800'
// // // //               : formData.plan === 'pro'
// // // //                 ? 'bg-blue-50 border border-blue-200 text-blue-800'
// // // //                 : 'bg-gray-50 border border-gray-200 text-gray-800'
// // // //               }`}>
// // // //               {formData.plan === 'enterprise' ? (
// // // //                 <div className="space-y-1">
// // // //                   <div className="font-semibold">ENTERPRISE Plan - Coming Soon!</div>
// // // //                   <div>Contact sales: <span className="font-medium">sales@hotelmanagementsystem.com</span></div>
// // // //                 </div>
// // // //               ) : formData.plan === 'pro' ? (
// // // //                 <div className="space-y-1">
// // // //                   <div className="font-semibold">PRO Plan - 30 Day FREE Trial</div>
// // // //                   <div>Email verification required.</div>
// // // //                   {emailOTPVerified && (
// // // //                     <div className="text-green-600 font-medium">
// // // //                       ✓ Email verified
// // // //                     </div>
// // // //                   )}
// // // //                 </div>
// // // //               ) : (
// // // //                 <div className="space-y-1">
// // // //                   <div className="font-semibold">
// // // //                     BASIC Plan
// // // //                     {otpData.isPhoneVerified && (
// // // //                       <CheckCircle className="h-3 w-3 text-green-500 inline ml-1" />
// // // //                     )}
// // // //                   </div>
// // // //                   <div>Perfect for small hotels. Phone verification required.</div>
// // // //                 </div>
// // // //               )}
// // // //             </div>
// // // //           )}
// // // //         </form>
// // // //       </DialogContent>
// // // //     </Dialog>
// // // //   );
// // // // };

// // // // export default RegisterModal;


// // // import { useState, useEffect } from "react";
// // // import { useNavigate } from "react-router-dom";
// // // import {
// // //   Dialog,
// // //   DialogContent,
// // //   DialogDescription,
// // //   DialogHeader,
// // //   DialogTitle,
// // // } from "@/components/ui/dialog";
// // // import { Button } from "@/components/ui/button";
// // // import { Input } from "@/components/ui/input";
// // // import { Label } from "@/components/ui/label";
// // // import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// // // import { Badge } from "@/components/ui/badge";
// // // import { useToast } from "@/hooks/use-toast";
// // // import { Alert, AlertDescription } from "@/components/ui/alert";
// // // import {
// // //   Loader2,
// // //   ShieldCheck,
// // //   RefreshCw,
// // //   CheckCircle,
// // //   ArrowLeft,
// // //   Phone,
// // //   Mail,
// // //   Calendar,
// // //   Clock,
// // //   Check,
// // //   ChevronDown,
// // //   ChevronUp,
// // //   X,
// // //   Star
// // // } from "lucide-react";

// // // interface RegisterModalProps {
// // //   open: boolean;
// // //   onClose: () => void;
// // //   onTryDemo?: () => void;
// // // }

// // // // Google Apps Script URL for FREE plan
// // // const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwA1sC2rREM50Ri9p0r-tWy3Jz-RSe39N9iu90qiRopKUvJ17fxYptB4yhbfQOBM62z/exec";

// // // // Node.js backend URL
// // // const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// // // const RegisterModal = ({ open, onClose, onTryDemo }: RegisterModalProps) => {
// // //   const navigate = useNavigate();
// // //   const { toast } = useToast();

// // //   // Form data state
// // //   const [formData, setFormData] = useState({
// // //     adminName: "",
// // //     username: "",
// // //     password: "",
// // //     hotelName: "",
// // //     email: "",
// // //     phone: "",
// // //     address: "",
// // //     gstNumber: "",
// // //     plan: "pro", // Default to PRO plan
// // //   });

// // //   // SMS OTP states for FREE plan
// // //   const [otpData, setOtpData] = useState({
// // //     otp: "",
// // //     isPhoneVerified: false,
// // //     otpSent: false,
// // //     otpCountdown: 0,
// // //     otpResendCount: 0,
// // //     maxOtpResends: 3,
// // //   });

// // //   // Phone OTP states for PRO plan (now using phone instead of email)
// // //   const [phoneOTP, setPhoneOTP] = useState("");
// // //   const [phoneOTPVerified, setPhoneOTPVerified] = useState(false);
// // //   const [showPhoneOTPInput, setShowPhoneOTPInput] = useState(false);
// // //   const [showForm, setShowForm] = useState(true); // Changed from false to true

// // //   // Loading states
// // //   const [isSubmitting, setIsSubmitting] = useState(false);
// // //   const [isSendingOtp, setIsSendingOtp] = useState(false);
// // //   const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
// // //   const [isSendingPhoneOTP, setIsSendingPhoneOTP] = useState(false);
// // //   const [isVerifyingPhoneOTP, setIsVerifyingPhoneOTP] = useState(false);
// // //   const [showOtpInput, setShowOtpInput] = useState(false);

// // //   const [referralCode, setReferralCode] = useState('');
// // //   const [referralValidating, setReferralValidating] = useState(false);
// // //   const [referralValid, setReferralValid] = useState(false);
// // //   const [referralDetails, setReferralDetails] = useState<any>(null);
// // //   const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

// // //   // OTP Countdown Timer for SMS
// // //   useEffect(() => {
// // //     let interval: NodeJS.Timeout;
// // //     if (otpData.otpCountdown > 0) {
// // //       interval = setInterval(() => {
// // //         setOtpData(prev => ({
// // //           ...prev,
// // //           otpCountdown: prev.otpCountdown - 1
// // //         }));
// // //       }, 1000);
// // //     }
// // //     return () => {
// // //       if (interval) clearInterval(interval);
// // //     };
// // //   }, [otpData.otpCountdown]);

// // //   // Helper functions
// // //   const formatIndianPhone = (phone: string) => {
// // //     const clean = phone.replace(/\D/g, '');
// // //     if (clean.length === 10) {
// // //       return `+91 ${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
// // //     }
// // //     return phone;
// // //   };

// // //   const formatCountdown = (seconds: number) => {
// // //     const mins = Math.floor(seconds / 60);
// // //     const secs = seconds % 60;
// // //     return `${mins}:${secs.toString().padStart(2, '0')}`;
// // //   };

// // //   // Form change handlers
// // //   const handleChange = (field: string, value: string) => {
// // //     setFormData((prev) => ({ ...prev, [field]: value }));

// // //     // Reset verification states when phone changes
// // //     if (field === "phone") {
// // //       // Reset both FREE and PRO phone verification states
// // //       setOtpData(prev => ({
// // //         ...prev,
// // //         isPhoneVerified: false,
// // //         otpSent: false,
// // //         otp: ""
// // //       }));
// // //       setShowOtpInput(false);

// // //       setPhoneOTPVerified(false);
// // //       setShowPhoneOTPInput(false);
// // //       setPhoneOTP("");
// // //     }
// // //   };

// // //   const handleOtpChange = (value: string) => {
// // //     const numericValue = value.replace(/\D/g, '').slice(0, 6);
// // //     setOtpData(prev => ({ ...prev, otp: numericValue }));
// // //   };

// // //   const handlePhoneOtpChange = (value: string) => {
// // //     const numericValue = value.replace(/\D/g, '').slice(0, 6);
// // //     setPhoneOTP(numericValue);
// // //   };

// // //   // Plan change handler
// // //   const handlePlanChange = (value: string) => {
// // //     handleChange("plan", value);

// // //     // Reset verification states when plan changes
// // //     if (value === "free") {
// // //       // Reset PRO plan states
// // //       setPhoneOTPVerified(false);
// // //       setShowPhoneOTPInput(false);
// // //       setPhoneOTP("");
// // //     } else if (value === "pro") {
// // //       // Reset FREE plan states
// // //       setOtpData({
// // //         otp: "",
// // //         isPhoneVerified: false,
// // //         otpSent: false,
// // //         otpCountdown: 0,
// // //         otpResendCount: 0,
// // //         maxOtpResends: 3,
// // //       });
// // //       setShowOtpInput(false);
// // //     }
// // //   };

// // //   const validateReferralCode = async () => {
// // //     if (!referralCode.trim()) {
// // //       setReferralValid(false);
// // //       return;
// // //     }

// // //     setReferralValidating(true);
// // //     try {
// // //       const response = await fetch(`${NODE_BACKEND_URL}/wallet/referral/validate/${referralCode}`, {
// // //         method: 'GET',
// // //         headers: {
// // //           'Content-Type': 'application/json',
// // //         },
// // //       });

// // //       if (response.ok) {
// // //         const data = await response.json();
// // //         if (data.success) {
// // //           setReferralValid(true);
// // //           setReferralDetails(data.data);
// // //           toast({
// // //             title: 'Referral Code Valid!',
// // //             description: `You'll earn benefits from ${data.data.referrer_name}`,
// // //             variant: 'default',
// // //           });
// // //         } else {
// // //           setReferralValid(false);
// // //           toast({
// // //             title: 'Invalid Code',
// // //             description: 'Please enter a valid referral code',
// // //             variant: 'destructive',
// // //           });
// // //         }
// // //       } else {
// // //         setReferralValid(false);
// // //         toast({
// // //           title: 'Error',
// // //           description: 'Failed to validate referral code',
// // //           variant: 'destructive',
// // //         });
// // //       }
// // //     } catch (error) {
// // //       setReferralValid(false);
// // //       toast({
// // //         title: 'Error',
// // //         description: 'Network error. Please try again.',
// // //         variant: 'destructive',
// // //       });
// // //     } finally {
// // //       setReferralValidating(false);
// // //     }
// // //   };

// // //   // JSONP function for Google Apps Script (FREE plan)
// // //   function jsonpRequest(url: string): Promise<any> {
// // //     return new Promise((resolve, reject) => {
// // //       const callbackName = "cb_" + Date.now();
// // //       (window as any)[callbackName] = (data: any) => {
// // //         resolve(data);
// // //         delete (window as any)[callbackName];
// // //         script.remove();
// // //       };
// // //       const script = document.createElement("script");
// // //       script.src = url + (url.includes("?") ? "&" : "?") + "callback=" + callbackName;
// // //       script.onerror = () => {
// // //         reject(new Error("Failed to load script"));
// // //         delete (window as any)[callbackName];
// // //         script.remove();
// // //       };
// // //       document.body.appendChild(script);
// // //     });
// // //   }

// // //   // Fetch function for Node.js backend
// // //   async function fetchBackendRequest(endpoint: string, data: any): Promise<any> {
// // //     console.log("📤 Sending to backend:", {
// // //       endpoint: `${NODE_BACKEND_URL}${endpoint}`,
// // //       data: { ...data, admin: { ...data.admin, password: '[HIDDEN]' } }
// // //     });

// // //     const response = await fetch(`${NODE_BACKEND_URL}${endpoint}`, {
// // //       method: "POST",
// // //       headers: {
// // //         "Content-Type": "application/json",
// // //       },
// // //       body: JSON.stringify(data),
// // //     });

// // //     const responseText = await response.text();
// // //     console.log("📥 Backend response:", {
// // //       status: response.status,
// // //       statusText: response.statusText,
// // //       body: responseText
// // //     });

// // //     if (!response.ok) {
// // //       let errorMessage = `HTTP error! status: ${response.status}`;
// // //       try {
// // //         const errorData = JSON.parse(responseText);
// // //         errorMessage = errorData.message || errorData.error || errorMessage;
// // //       } catch (e) {
// // //         errorMessage = responseText || errorMessage;
// // //       }
// // //       throw new Error(errorMessage);
// // //     }

// // //     try {
// // //       return JSON.parse(responseText);
// // //     } catch (e) {
// // //       throw new Error('Invalid JSON response from server');
// // //     }
// // //   }

// // //   const encodeValue = (val: unknown) =>
// // //     typeof val === "string" || typeof val === "number" || typeof val === "boolean"
// // //       ? encodeURIComponent(val.toString())
// // //       : "";

// // //   const buildQueryString = (params: Record<string, unknown>): string =>
// // //     Object.entries(params)
// // //       .map(([key, val]) => {
// // //         if (typeof val === "object" && val !== null) {
// // //           return Object.entries(val as Record<string, unknown>)
// // //             .map(
// // //               ([subKey, subVal]) =>
// // //                 encodeURIComponent(`${key}[${subKey}]`) + "=" + encodeValue(subVal)
// // //             )
// // //             .join("&");
// // //         }
// // //         return encodeURIComponent(key) + "=" + encodeValue(val);
// // //       })
// // //       .join("&");

// // //   // SMS OTP functions for FREE plan
// // //   async function generateSMSOTP(phone: string, email: string, hotelName: string, username: string): Promise<any> {
// // //     const paramObj = {
// // //       action: "generateOTP",
// // //       phone: phone,
// // //       email: email,
// // //       hotelName: hotelName,
// // //       username: username
// // //     };

// // //     const queryString = buildQueryString(paramObj);
// // //     const url = APPS_SCRIPT_URL + "?" + queryString;

// // //     console.log("📱 Generating SMS OTP for phone:", phone);
// // //     return await jsonpRequest(url);
// // //   }

// // //   async function verifySMSOTP(phone: string, email: string, otp: string): Promise<any> {
// // //     const paramObj = {
// // //       action: "verifyOTP",
// // //       phone: phone,
// // //       email: email,
// // //       otp: otp
// // //     };

// // //     const queryString = buildQueryString(paramObj);
// // //     const url = APPS_SCRIPT_URL + "?" + queryString;

// // //     console.log("🔐 Verifying SMS OTP for phone:", phone);
// // //     return await jsonpRequest(url);
// // //   }

// // //   // Send SMS OTP for FREE plan
// // //   const handleSendOTP = async () => {
// // //     if (!formData.phone) {
// // //       toast({
// // //         title: "Phone Number Required",
// // //         description: "Please enter your phone number to receive SMS OTP",
// // //         variant: "destructive",
// // //       });
// // //       return;
// // //     }

// // //     const phoneRegex = /^[6-9]\d{9}$/;
// // //     const cleanPhone = formData.phone.replace(/\D/g, '');

// // //     if (!phoneRegex.test(cleanPhone)) {
// // //       toast({
// // //         title: "Invalid Phone Number",
// // //         description: "Please enter a valid 10-digit Indian mobile number",
// // //         variant: "destructive",
// // //       });
// // //       return;
// // //     }

// // //     if (otpData.otpResendCount >= otpData.maxOtpResends) {
// // //       toast({
// // //         title: "Resend Limit Reached",
// // //         description: "You have reached the maximum OTP resend attempts. Please try again later.",
// // //         variant: "destructive",
// // //       });
// // //       return;
// // //     }

// // //     setIsSendingOtp(true);
// // //     try {
// // //       const response = await generateSMSOTP(
// // //         cleanPhone,
// // //         formData.email || `${formData.username}@temp.com`, // Auto-generate if empty
// // //         formData.hotelName || `${formData.username} Hotel`, // Auto-generate if empty
// // //         formData.username
// // //       );

// // //       if (response.success) {
// // //         setOtpData(prev => ({
// // //           ...prev,
// // //           otpSent: true,
// // //           otpCountdown: 300,
// // //           otpResendCount: prev.otpResendCount + 1,
// // //           isPhoneVerified: false
// // //         }));

// // //         setShowOtpInput(true);

// // //         toast({
// // //           title: "OTP Sent Successfully! 📱",
// // //           description: `We've sent a 6-digit OTP to ${formatIndianPhone(formData.phone)}`,
// // //           variant: "default",
// // //         });
// // //       } else {
// // //         throw new Error(response.message || "Failed to send OTP");
// // //       }
// // //     } catch (error: any) {
// // //       console.error("OTP send error:", error);

// // //       let errorMessage = "Failed to send OTP. Please try again.";
// // //       if (error.message.includes("OTP_GENERATION_FAILED")) {
// // //         errorMessage = "Unable to send SMS OTP. Please check your phone number.";
// // //       } else if (error.message.includes("INVALID_PHONE")) {
// // //         errorMessage = "Invalid phone number. Please enter a valid 10-digit Indian number.";
// // //       }

// // //       toast({
// // //         title: "SMS OTP Send Failed",
// // //         description: errorMessage,
// // //         variant: "destructive",
// // //       });
// // //     } finally {
// // //       setIsSendingOtp(false);
// // //     }
// // //   };

// // //   // Verify SMS OTP for FREE plan
// // //   const handleVerifyOTP = async () => {
// // //     if (!otpData.otp || otpData.otp.length !== 6) {
// // //       toast({
// // //         title: "Invalid OTP",
// // //         description: "Please enter a valid 6-digit OTP",
// // //         variant: "destructive",
// // //       });
// // //       return;
// // //     }

// // //     const cleanPhone = formData.phone.replace(/\D/g, '');
// // //     const autoEmail = formData.email || `${formData.username}@temp.com`;

// // //     setIsVerifyingOtp(true);
// // //     try {
// // //       const response = await verifySMSOTP(cleanPhone, autoEmail, otpData.otp);

// // //       if (response.success) {
// // //         setOtpData(prev => ({
// // //           ...prev,
// // //           isPhoneVerified: true
// // //         }));

// // //         setShowOtpInput(false);

// // //         toast({
// // //           title: "Phone Verified Successfully! ✅",
// // //           description: "Your phone number has been verified. You can now proceed with registration.",
// // //           variant: "default",
// // //         });
// // //       } else {
// // //         if (response.error === "INVALID_OTP") {
// // //           toast({
// // //             title: "Invalid OTP",
// // //             description: response.message || "The OTP you entered is incorrect.",
// // //             variant: "destructive",
// // //           });
// // //         } else if (response.error === "OTP_EXPIRED") {
// // //           setOtpData(prev => ({
// // //             ...prev,
// // //             otpSent: false,
// // //             otpCountdown: 0
// // //           }));
// // //           setShowOtpInput(false);

// // //           toast({
// // //             title: "OTP Expired",
// // //             description: "The OTP has expired. Please request a new one.",
// // //             variant: "destructive",
// // //           });
// // //         } else if (response.error === "MAX_ATTEMPTS") {
// // //           setOtpData(prev => ({
// // //             ...prev,
// // //             otpSent: false,
// // //             otpCountdown: 0
// // //           }));
// // //           setShowOtpInput(false);

// // //           toast({
// // //             title: "Maximum Attempts Exceeded",
// // //             description: "Too many failed attempts. Please request a new OTP.",
// // //             variant: "destructive",
// // //           });
// // //         }
// // //       }
// // //     } catch (error: any) {
// // //       console.error("OTP verification error:", error);

// // //       toast({
// // //         title: "Verification Failed",
// // //         description: "Failed to verify OTP. Please try again.",
// // //         variant: "destructive",
// // //       });
// // //     } finally {
// // //       setIsVerifyingOtp(false);
// // //     }
// // //   };

// // //   // Send Phone OTP for PRO plan (using WhatsApp)
// // //   const handleSendPhoneOTP = async () => {
// // //     if (!formData.phone) {
// // //       toast({
// // //         title: "Phone Required",
// // //         description: "Please enter your phone number to receive OTP",
// // //         variant: "destructive",
// // //       });
// // //       return;
// // //     }

// // //     if (!formData.username) {
// // //       toast({
// // //         title: "Username Required",
// // //         description: "Please enter your username",
// // //         variant: "destructive",
// // //       });
// // //       return;
// // //     }

// // //     // Auto-generate missing fields for backend
// // //     const autoEmail = formData.email || `${formData.username.replace(/\s+/g, '')}@hotel.com`;
// // //     const autoHotelName = formData.hotelName || `${formData.username} Hotel`;
// // //     const autoAdminName = formData.adminName || formData.username;

// // //     // Clean phone number
// // //     const cleanPhone = formData.phone ? formData.phone.replace(/\D/g, '') : null;

// // //     setIsSendingPhoneOTP(true);
// // //     try {
// // //       // Use the endpoint that sends OTP via WhatsApp
// // //       const response = await fetch(`${NODE_BACKEND_URL}/hotels/send-pro-otp-whatsapp`, {
// // //         method: "POST",
// // //         headers: { "Content-Type": "application/json" },
// // //         body: JSON.stringify({
// // //           email: autoEmail,
// // //           hotelName: autoHotelName,
// // //           adminName: autoAdminName,
// // //           phone: cleanPhone // Phone for WhatsApp
// // //         }),
// // //       });

// // //       const data = await response.json();

// // //       if (data.success) {
// // //         setShowPhoneOTPInput(true);

// // //         let successMessage = `OTP sent to ${formatIndianPhone(formData.phone)} via WhatsApp`;

// // //         toast({
// // //           title: "OTP Sent Successfully! 📱",
// // //           description: successMessage,
// // //           variant: "default",
// // //         });

// // //         console.log("✅ OTP Delivery Status:", data.data?.delivery);
// // //       } else {
// // //         throw new Error(data.message || "Failed to send OTP");
// // //       }
// // //     } catch (error: any) {
// // //       toast({
// // //         title: "Failed to Send OTP",
// // //         description: error.message || "Please try again",
// // //         variant: "destructive",
// // //       });
// // //     } finally {
// // //       setIsSendingPhoneOTP(false);
// // //     }
// // //   };

// // //   // Verify Phone OTP for PRO plan
// // //   const handleVerifyPhoneOTP = async () => {
// // //     if (!phoneOTP || phoneOTP.length !== 6) {
// // //       toast({
// // //         title: "Invalid OTP",
// // //         description: "Please enter a valid 6-digit OTP",
// // //         variant: "destructive",
// // //       });
// // //       return;
// // //     }

// // //     const autoEmail = formData.email || `${formData.username.replace(/\s+/g, '')}@hotel.com`;

// // //     setIsVerifyingPhoneOTP(true);
// // //     try {
// // //       const response = await fetch(`${NODE_BACKEND_URL}/hotels/verify-email-otp`, {
// // //         method: "POST",
// // //         headers: { "Content-Type": "application/json" },
// // //         body: JSON.stringify({
// // //           email: autoEmail, // Still using email as identifier in backend
// // //           otp: phoneOTP
// // //         }),
// // //       });

// // //       const data = await response.json();

// // //       if (data.success) {
// // //         setPhoneOTPVerified(true);
// // //         setShowPhoneOTPInput(false);
// // //         toast({
// // //           title: "Phone Verified Successfully! ✅",
// // //           description: "Your phone has been verified for PRO plan",
// // //           variant: "default",
// // //         });
// // //       } else {
// // //         throw new Error(data.message || "Invalid OTP");
// // //       }
// // //     } catch (error: any) {
// // //       toast({
// // //         title: "OTP Verification Failed",
// // //         description: error.message || "Please try again",
// // //         variant: "destructive",
// // //       });
// // //     } finally {
// // //       setIsVerifyingPhoneOTP(false);
// // //     }
// // //   };

// // //   // Main submit handler
// // //   const handleSubmit = async (e: React.FormEvent) => {
// // //     e.preventDefault();

// // //     if (formData.plan === "enterprise") {
// // //       toast({
// // //         title: "Enterprise Plan - Coming Soon",
// // //         description: "Please contact sales for enterprise solutions",
// // //         variant: "default",
// // //       });
// // //       return;
// // //     }

// // //     // FOR FREE PLAN
// // //     if (formData.plan === "free") {
// // //       if (!otpData.isPhoneVerified) {
// // //         if (!showOtpInput) {
// // //           await handleSendOTP();
// // //           return;
// // //         } else {
// // //           await handleVerifyOTP();
// // //           return;
// // //         }
// // //       }
// // //     }

// // //     // FOR PRO PLAN
// // //     if (formData.plan === "pro") {
// // //       if (!phoneOTPVerified) {
// // //         if (!showPhoneOTPInput) {
// // //           await handleSendPhoneOTP();
// // //           return;
// // //         } else {
// // //           await handleVerifyPhoneOTP();
// // //           return;
// // //         }
// // //       }
// // //     }

// // //     // If all validations pass, complete registration
// // //     await completeRegistration();
// // //   };

// // //   // Complete registration
// // //   const completeRegistration = async () => {
// // //     setIsSubmitting(true);

// // //     try {
// // //       const cleanPhone = formData.phone.replace(/\D/g, '');
// // //       // Auto-generate missing fields
// // //       const autoEmail = formData.email || `${formData.username.replace(/\s+/g, '')}@hotel.com`;
// // //       const autoHotelName = formData.hotelName || `${formData.username} Hotel`;
// // //       const autoAdminName = formData.adminName || formData.username;
// // //       const autoAddress = formData.address || 'Address not provided';
// // //       const autoPassword = formData.password || cleanPhone; // Use phone as default password if empty

// // //       const hotelData = {
// // //         hotelName: autoHotelName,
// // //         address: autoAddress,
// // //         plan: formData.plan,
// // //         gstNumber: formData.gstNumber.trim(),
// // //         referralCode: referralValid ? referralCode : null,
// // //         admin: {
// // //           username: formData.username.trim(),
// // //           password: autoPassword,
// // //           role: "admin",
// // //           name: autoAdminName,
// // //           email: autoEmail,
// // //           phone: cleanPhone,
// // //           status: formData.plan === "free" ? "active" : "pending"
// // //         }
// // //       };

// // //       // Add OTP for PRO plan verification (using phone OTP)
// // //       if (formData.plan === "pro") {
// // //         (hotelData as any).emailOTP = phoneOTP; // Keep field name as emailOTP for backend compatibility
// // //         console.log("📤 [PRO REGISTRATION] Sending OTP:", phoneOTP);
// // //         console.log("📤 [PRO REGISTRATION] Email:", autoEmail);
// // //       }

// // //       let data;

// // //       if (formData.plan === "free") {
// // //         console.log("FREE plan selected - Saving to Google Sheets");

// // //         const paramObj: Record<string, unknown> = {
// // //           action: "createHotel",
// // //           ...hotelData,
// // //           "admin[status]": "active"
// // //         };

// // //         const queryString = buildQueryString(paramObj);
// // //         const url = APPS_SCRIPT_URL + "?" + queryString;

// // //         console.log("Sending to Google Apps Script:", url);
// // //         data = await jsonpRequest(url);

// // //       } else {
// // //         console.log("PRO plan selected - Saving to MySQL Database");
// // //         console.log("Sending to Node.js backend:", hotelData);

// // //         data = await fetchBackendRequest("/hotels/register", hotelData);
// // //       }

// // //       if (data.success) {
// // //         let message = '';
// // //         if (formData.plan === 'pro') {
// // //           message = `${autoHotelName} has been registered with PRO Plan (30-day FREE trial). Your default password is your phone number.`;
// // //         } else {
// // //           message = `${autoHotelName} is now on FREE Plan. Your default password is your phone number. You can login now.`;
// // //         }

// // //         toast({
// // //           title: `Registration Successful! 🎉`,
// // //           description: message,
// // //         });

// // //         // Reset form
// // //         setFormData({
// // //           adminName: "",
// // //           username: "",
// // //           password: "",
// // //           hotelName: "",
// // //           email: "",
// // //           phone: "",
// // //           address: "",
// // //           gstNumber: "",
// // //           plan: "free",
// // //         });

// // //         // Reset OTP states
// // //         setOtpData({
// // //           otp: "",
// // //           isPhoneVerified: false,
// // //           otpSent: false,
// // //           otpCountdown: 0,
// // //           otpResendCount: 0,
// // //           maxOtpResends: 3,
// // //         });

// // //         setPhoneOTP("");
// // //         setPhoneOTPVerified(false);
// // //         setShowPhoneOTPInput(false);
// // //         setShowOtpInput(false);

// // //         onClose();
// // //         navigate("/login");

// // //       } else {
// // //         if (data.error === "HOTEL_EXISTS") {
// // //           toast({
// // //             title: "Registration Failed",
// // //             description: "Hotel already registered. Try a different name.",
// // //             variant: "destructive",
// // //           });
// // //         } else if (data.error === "USERNAME_EXISTS") {
// // //           toast({
// // //             title: "Username Taken",
// // //             description: "This username is already in use. Choose another one.",
// // //             variant: "destructive",
// // //           });
// // //         } else if (data.error === "INVALID_OTP") {
// // //           toast({
// // //             title: "OTP Verification Failed",
// // //             description: "Please verify your OTP again",
// // //             variant: "destructive",
// // //           });
// // //         } else {
// // //           throw new Error(data.message || data.error || "Failed to create hotel");
// // //         }
// // //       }
// // //     } catch (err: any) {
// // //       console.error("Registration error:", err);

// // //       let errorMessage = err.message || "Something went wrong.";

// // //       if (err.message.includes("Failed to fetch")) {
// // //         errorMessage = "Cannot connect to the server. Please check if the backend is running.";
// // //       } else if (err.message.includes("Failed to load script")) {
// // //         errorMessage = "Cannot connect to Google Sheets. Please check your internet connection.";
// // //       }

// // //       toast({
// // //         title: "Registration Failed",
// // //         description: errorMessage,
// // //         variant: "destructive",
// // //       });
// // //     } finally {
// // //       setIsSubmitting(false);
// // //     }
// // //   };

// // //   // Plan features detail
// // //   const detailedFeatures = {
// // //     free: [
// // //       { text: "Basic booking register", included: true },
// // //       { text: "5,000 records limit", included: true },
// // //       { text: "Manual room status update (max 20 rooms)", included: true },
// // //       { text: "Simple digital check-in/check-out (no guest history)", included: true },
// // //       { text: "Mobile version (limited view mode only)", included: true },
// // //       { text: "Basic print invoice", included: true },
// // //       { text: "Manual payment entry only", included: true },
// // //       { text: "Only today's check-in/check-out report (no export)", included: true },
// // //       { text: "No staff management", included: false },
// // //       { text: "No WhatsApp alerts", included: false },
// // //       { text: "No OTA connectivity", included: false },
// // //       { text: "Basic owner dashboard (daily summary only)", included: true },
// // //       { text: "No AI features", included: false },
// // //       { text: "No integrations", included: false },
// // //       { text: "Help docs support only", included: true },
// // //       { text: "Go live in less than a minute", included: true },
// // //       { text: "Lifetime free", included: true }
// // //     ],
// // //     pro: [
// // //       { text: "Full PMS: room allocation, early/late check-in/out", included: true },
// // //       { text: "50,000 records", included: true },
// // //       { text: "Housekeeping app + live status", included: true },
// // //       { text: "Automated check-in/out + guest history", included: true },
// // //       { text: "Full mobile app for staff & owner", included: true },
// // //       { text: "GST invoice generator", included: true },
// // //       { text: "Online payment links", included: true },
// // //       { text: "Split billing + outstanding tracking", included: true },
// // //       { text: "Daily revenue dashboard + audit report", included: true },
// // //       { text: "Attendance + payroll", included: true },
// // //       { text: "WhatsApp reminders (check-out, payments, tasks)", included: true },
// // //       { text: "Booking.com / MMT / Goibibo auto-sync", included: true },
// // //       { text: "Daily MIS via WhatsApp", included: true },
// // //       { text: "No AI pricing engine", included: false },
// // //       { text: "POS optional integration", included: true },
// // //       { text: "WhatsApp & call support", included: true },
// // //       { text: "Go live in less than 1 hour", included: true },
// // //       { text: "30-day FREE trial, then ₹999 / 6 months", included: true }
// // //     ],
// // //     enterprise: [
// // //       { text: "Chain-level PMS & coordination", included: true },
// // //       { text: "Unlimited records", included: true },
// // //       { text: "Central housekeeping monitoring", included: true },
// // //       { text: "Central guest database across properties", included: true },
// // //       { text: "Advanced chain manager mobile app", included: true },
// // //       { text: "Multi-property GST/ledger system", included: true },
// // //       { text: "Central finance dashboard", included: true },
// // //       { text: "Chain-level analytics (ADR, RevPAR, occupancy)", included: true },
// // //       { text: "Multi-property HR & approvals", included: true },
// // //       { text: "Advanced WhatsApp automation (chain MIS, AI alerts)", included: true },
// // //       { text: "Centralized rate & multiple OTA management", included: true },
// // //       { text: "Group-level performance dashboard", included: true },
// // //       { text: "AI pricing engine + forecasting", included: true },
// // //       { text: "Full API + channel managers + smart locks", included: true },
// // //       { text: "Dedicated manager + SLA", included: true },
// // //       { text: "Go live in a day", included: true },
// // //       { text: "Custom pricing", included: true }
// // //     ]
// // //   };

// // //   // Plan configurations
// // //   const plans = [
// // //     {
// // //       id: "free",
// // //       name: "BASIC",
// // //       subtitle: "Small Hotels – Limited",
// // //       price: "₹0/month",
// // //       color: "border-gray-300",
// // //       buttonVariant: "secondary" as const,
// // //       available: true,
// // //       icon: "🆓"
// // //     },
// // //     {
// // //       id: "pro",
// // //       name: "PRO",
// // //       subtitle: "Boutique / 20–70 Rooms",
// // //       price: "30-day FREE trial",
// // //       color: "border-blue-500",
// // //       buttonVariant: "default" as const,
// // //       available: true,
// // //       icon: "⭐"
// // //     },
// // //     {
// // //       id: "enterprise",
// // //       name: "ENTERPRISE",
// // //       subtitle: "Hotel Chains",
// // //       price: "Contact for pricing",
// // //       color: "border-purple-600",
// // //       buttonVariant: "default" as const,
// // //       available: false,
// // //       icon: "🏢"
// // //     }
// // //   ];

// // //   // Get current plan
// // //   const selectedPlan = plans.find(p => p.id === formData.plan);
// // //   const isAvailablePlan = selectedPlan?.available;

// // //   // Get button text based on current state
// // //   const getButtonText = () => {
// // //     if (!isAvailablePlan) return 'Upcoming';

// // //     if (isSubmitting) return 'Registering...';
// // //     if (isSendingOtp) return 'Sending SMS OTP...';
// // //     if (isVerifyingOtp) return 'Verifying SMS OTP...';
// // //     if (isSendingPhoneOTP) return 'Sending OTP...';
// // //     if (isVerifyingPhoneOTP) return 'Verifying OTP...';

// // //     if (formData.plan === "free") {
// // //       if (!otpData.isPhoneVerified) {
// // //         if (!showOtpInput) {
// // //           return 'Send SMS OTP to Register';
// // //         } else {
// // //           return 'Verify SMS OTP & Register';
// // //         }
// // //       }
// // //     } else if (formData.plan === "pro") {
// // //       if (!phoneOTPVerified) {
// // //         if (!showPhoneOTPInput) {
// // //           return 'Send OTP for PRO Plan';
// // //         } else {
// // //           return 'Verify OTP & Register';
// // //         }
// // //       }
// // //     }

// // //     return `Start ${formData.plan.toUpperCase()} Plan`;
// // //   };

// // //   // Determine if submit button should be disabled
// // //   const isSubmitDisabled = () => {
// // //     if (!isAvailablePlan) return true;
// // //     if (isSubmitting || isSendingOtp || isVerifyingOtp || isSendingPhoneOTP || isVerifyingPhoneOTP) return true;

// // //     if (formData.plan === "free" && showOtpInput && !otpData.isPhoneVerified) {
// // //       return otpData.otp.length !== 6;
// // //     }

// // //     if (formData.plan === "pro" && showPhoneOTPInput && !phoneOTPVerified) {
// // //       return phoneOTP.length !== 6;
// // //     }

// // //     return false;
// // //   };

// // //   return (
// // //     <Dialog open={open} onOpenChange={onClose}>
// // //       <DialogContent className="max-w-[95vw] mx-auto sm:max-w-6xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
// // //         <DialogHeader className="px-0 sm:px-2">
// // //           <DialogTitle className="text-lg sm:text-xl">Register New Hotel</DialogTitle>
// // //           <DialogDescription className="text-sm sm:text-base">
// // //             Choose your plan and fill in details
// // //           </DialogDescription>
// // //         </DialogHeader>

// // //         <form onSubmit={handleSubmit} className="space-y-4">
// // //           {/* Plan Selection Header - With Try Demo Button */}
// // //           <div className="space-y-2">
// // //             <div className="flex items-center justify-between">
// // //               <Label className="text-base sm:text-lg font-semibold">Choose Your Plan</Label>
// // //               {onTryDemo && (
// // //                 <Button
// // //                   type="button"
// // //                   size="lg"
// // //                   className="animate-fast-pulse bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 font-bold shadow-lg px-4 py-5 sm:px-6 sm:py-5 text-sm sm:text-base rounded-xl transition-all"
// // //                   onClick={(e) => {
// // //                     e.preventDefault();
// // //                     onClose();
// // //                     onTryDemo();
// // //                   }}
// // //                 >
// // //                   ✨ Try Demo
// // //                 </Button>
// // //               )}
// // //             </div>

// // //             <Tabs
// // //               value={formData.plan}
// // //               onValueChange={handlePlanChange}
// // //               className="w-full"
// // //             >
// // //               <TabsList className="grid w-full grid-cols-3 mb-4 h-16 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
// // //                 <TabsTrigger
// // //                   value="pro"
// // //                   className="rounded-lg h-full data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center justify-center gap-1.5 font-bold text-[10px] sm:text-sm text-slate-600 data-[state=active]:text-blue-600 transition-all duration-200"
// // //                 >
// // //                   <Star className="h-3.5 w-3.5 fill-current" /> PRO
// // //                 </TabsTrigger>
// // //                 <TabsTrigger
// // //                   value="free"
// // //                   className="rounded-lg h-full data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center justify-center gap-1.5 font-bold text-[10px] sm:text-sm text-slate-600 data-[state=active]:text-emerald-600 transition-all duration-200"
// // //                 >
// // //                   <span className="text-xs sm:text-sm">🆓</span> BASIC
// // //                 </TabsTrigger>
// // //                 <TabsTrigger
// // //                   value="enterprise"
// // //                   className="rounded-lg h-full data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center justify-center gap-1.5 font-bold text-[10px] sm:text-sm text-slate-600 data-[state=active]:text-purple-600 transition-all duration-200"
// // //                 >
// // //                   <span className="text-xs sm:text-sm">🏢</span> ENTERPRISE
// // //                 </TabsTrigger>
// // //               </TabsList>

// // //               {plans.map((plan) => (
// // //                 <TabsContent key={plan.id} value={plan.id} className="mt-0">
// // //                   <div className="relative max-w-xl mx-auto">
// // //                     {plan.id === "pro" && (
// // //                       <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
// // //                         <Badge className="bg-green-600 text-white text-[10px] sm:text-xs shadow-sm ring-2 ring-background px-3 py-0.5 uppercase tracking-wider">
// // //                           ⭐ Most Popular
// // //                         </Badge>
// // //                       </div>
// // //                     )}
// // //                     {!plan.available && (
// // //                       <div className="absolute -top-3 right-4 z-10">
// // //                         <Badge className="bg-amber-500 text-white text-[10px] sm:text-xs shadow-sm ring-2 ring-background">Upcoming</Badge>
// // //                       </div>
// // //                     )}

// // //                     <div
// // //                       className={`flex flex-col rounded-xl border-2 ${plan.color} bg-card p-4 sm:p-5 transition-all ring-2 ring-primary ring-offset-1 sm:ring-offset-2 shadow-lg ${!plan.available ? 'opacity-70' : ''}`}
// // //                     >
// // //                       <div className="flex-grow">
// // //                         <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-3 border-b pb-3">
// // //                           <div className="text-center sm:text-left min-w-0">
// // //                             <div className="flex justify-center sm:justify-start items-center gap-2 mb-1">
// // //                               <span className="text-2xl sm:text-3xl shrink-0">{plan.icon}</span>
// // //                               <h3 className="font-bold text-lg sm:text-2xl truncate uppercase tracking-wide">{plan.name}</h3>
// // //                             </div>
// // //                             <p className="text-sm text-muted-foreground truncate">{plan.subtitle}</p>
// // //                           </div>
// // //                           <Badge
// // //                             variant={plan.buttonVariant}
// // //                             className={`text-xs sm:text-sm whitespace-nowrap border-none shrink-0 py-1.5 px-4 rounded-full ${plan.id === 'free' ? 'bg-secondary text-secondary-foreground' : 'bg-cyan-500 text-white hover:bg-cyan-600'
// // //                               }`}
// // //                           >
// // //                             {plan.price}
// // //                           </Badge>
// // //                         </div>

// // //                         <div className="text-sm space-y-3 mb-2">
// // //                           <div className="flex flex-col space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
// // //                             <div className="flex items-center text-sm font-medium">
// // //                               <span className="text-green-600 mr-2 bg-green-100 p-0.5 rounded-full">✓</span>
// // //                               <span>
// // //                                 {plan.id === "free" ? "5,000 records" :
// // //                                   plan.id === "pro" ? "50,000 records" :
// // //                                     "Unlimited records"}
// // //                               </span>
// // //                             </div>
// // //                             {plan.id === "pro" && (
// // //                               <div className="space-y-3">
// // //                                 <div className="flex items-center text-sm font-medium">
// // //                                   <Calendar className="h-4 w-4 mr-2 text-blue-600 bg-blue-100 p-0.5 rounded-sm" />
// // //                                   <span>30-day FREE trial</span>
// // //                                 </div>
// // //                                 <div className="flex items-center text-sm font-medium">
// // //                                   <Phone className="h-4 w-4 mr-2 text-blue-600 bg-blue-100 p-0.5 rounded-sm" />
// // //                                   <span>Phone verification required</span>
// // //                                 </div>
// // //                               </div>
// // //                             )}
// // //                           </div>

// // //                           <div className="mt-4 pt-4 border-t border-dashed">
// // //                             {/* Shiny Badges */}
// // //                             <div className="text-center mb-4">
// // //                               <div className="inline-block transform transition-all hover:scale-105">
// // //                                 {plan.id === "free" ?
// // //                                   <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg px-4 py-2 shadow-sm">
// // //                                     <span className="text-sm sm:text-base font-bold text-blue-700 tracking-wide uppercase">
// // //                                       ✨ Life Time Free ✨
// // //                                     </span>
// // //                                   </div> :
// // //                                   plan.id === "pro" ?
// // //                                     <div className="bg-gradient-to-r from-amber-50 to-orange-100 border border-amber-200 rounded-lg px-4 py-2 shadow-sm">
// // //                                       <span className="text-sm sm:text-base font-bold text-amber-700 tracking-wide uppercase">
// // //                                         ✨ 30 Days FREE ✨
// // //                                       </span>
// // //                                     </div> :
// // //                                     <div className="bg-gradient-to-r from-purple-50 to-pink-100 border border-purple-200 rounded-lg px-4 py-2 shadow-sm">
// // //                                       <span className="text-sm sm:text-base font-bold text-purple-700 tracking-wide uppercase">
// // //                                         ✨ Contact Pricing ✨
// // //                                       </span>
// // //                                     </div>
// // //                                 }
// // //                               </div>
// // //                             </div>

// // //                             {/* Actions Group (Know More) */}
// // //                             <div className="flex flex-col sm:flex-row gap-3">
// // //                               <Button
// // //                                 type="button"
// // //                                 variant="outline"
// // //                                 size="sm"
// // //                                 className="flex-1 text-slate-700 hover:text-slate-900 font-medium py-4 flex items-center justify-center gap-2 rounded-lg"
// // //                                 onClick={(e) => {
// // //                                   e.preventDefault();
// // //                                   setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id);
// // //                                 }}
// // //                               >
// // //                                 {expandedPlanId === plan.id ? (
// // //                                   <>Show Less <ChevronUp className="h-4 w-4" /></>
// // //                                 ) : (
// // //                                   <>🔍 Know More <ChevronDown className="h-4 w-4" /></>
// // //                                 )}
// // //                               </Button>
// // //                             </div>

// // //                             {/* Expanded Features List */}
// // //                             <div
// // //                               className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedPlanId === plan.id ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
// // //                             >
// // //                               <div className="bg-[#f8f9fa] rounded-xl p-4 sm:p-5 border border-slate-200 space-y-3">
// // //                                 {(detailedFeatures as any)[plan.id].map((feature: { text: string, included: boolean }, idx: number) => (
// // //                                   <div key={idx} className={`flex items-start gap-3 text-xs sm:text-sm font-medium ${feature.included ? 'text-slate-800' : 'text-slate-400'}`}>
// // //                                     {feature.included ? (
// // //                                       <div className="bg-green-100 p-0.5 rounded-full mt-0.5 shrink-0">
// // //                                         <Check className="h-3 w-3 text-green-700" />
// // //                                       </div>
// // //                                     ) : (
// // //                                       <div className="bg-slate-100 p-0.5 rounded-full mt-0.5 shrink-0">
// // //                                         <X className="h-3 w-3 text-slate-400" />
// // //                                       </div>
// // //                                     )}
// // //                                     <span className="leading-snug">{feature.text}</span>
// // //                                   </div>
// // //                                 ))}
// // //                               </div>
// // //                             </div>
// // //                           </div>
// // //                         </div>
// // //                       </div>
// // //                     </div>
// // //                   </div>
// // //                 </TabsContent>
// // //               ))}
// // //             </Tabs>
// // //           </div>

// // //           {/* Hotel Details - Only Username and Phone fields shown */}
// // //           {isAvailablePlan && showForm && (
// // //             <div className="space-y-4 pt-4 border-t border-dashed mt-4">
// // //               <Label className="text-base sm:text-lg font-semibold">Registration Details</Label>

// // //               {/* Phone Verification Status for FREE Plan */}
// // //               {formData.plan === "free" && otpData.isPhoneVerified && (
// // //                 <Alert className="bg-green-50 border-green-200 text-xs sm:text-sm">
// // //                   <div className="flex items-center gap-2">
// // //                     <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
// // //                     <AlertDescription className="text-green-800">
// // //                       <strong>Phone Verified!</strong> Your phone {formatIndianPhone(formData.phone)} is verified.
// // //                     </AlertDescription>
// // //                   </div>
// // //                 </Alert>
// // //               )}

// // //               {/* Hotel Details Form - Only Username and Phone */}
// // //               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
// // //                 {[
// // //                   { id: "username", label: "Username *", placeholder: "Choose username" },
// // //                   {
// // //                     id: "phone",
// // //                     label: "Phone *",
// // //                     type: "tel",
// // //                     placeholder: "9876543210",
// // //                     disabled: (formData.plan === "free" && otpData.isPhoneVerified) || 
// // //                              (formData.plan === "pro" && phoneOTPVerified)
// // //                   },
// // //                 ].map((f) => (
// // //                   <div key={f.id} className="space-y-1 sm:space-y-2">
// // //                     <Label htmlFor={f.id} className="text-xs sm:text-sm">
// // //                       {f.label}
// // //                       {f.id === "phone" && formData.plan === "free" && otpData.isPhoneVerified && (
// // //                         <CheckCircle className="h-3 w-3 text-green-500 inline ml-1" />
// // //                       )}
// // //                       {f.id === "phone" && formData.plan === "pro" && phoneOTPVerified && (
// // //                         <CheckCircle className="h-3 w-3 text-green-500 inline ml-1" />
// // //                       )}
// // //                     </Label>
// // //                     <Input
// // //                       id={f.id}
// // //                       type={f.type || "text"}
// // //                       value={(formData as any)[f.id]}
// // //                       onChange={(e) => handleChange(f.id, e.target.value)}
// // //                       placeholder={f.placeholder}
// // //                       required
// // //                       disabled={f.disabled || false}
// // //                       className="text-sm sm:text-base"
// // //                     />
// // //                   </div>
// // //                 ))}
// // //               </div>

// // //               {/* Phone OTP Input Section for PRO Plan */}
// // //               {formData.plan === "pro" && showPhoneOTPInput && !phoneOTPVerified && (
// // //                 <div className="space-y-4 border rounded-lg p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-pink-50">
// // //                   <div className="flex items-center gap-3">
// // //                     <div className="p-2 bg-purple-100 rounded-lg">
// // //                       <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
// // //                     </div>
// // //                     <div>
// // //                       <h3 className="font-semibold text-base sm:text-lg">Verify Your Phone for PRO Plan</h3>
// // //                       <p className="text-xs sm:text-sm text-muted-foreground">
// // //                         OTP sent to <strong>{formatIndianPhone(formData.phone)}</strong>
// // //                       </p>
// // //                     </div>
// // //                   </div>

// // //                   <Alert className="bg-amber-50 border-amber-200 text-xs sm:text-sm">
// // //                     <AlertDescription className="text-amber-800">
// // //                       <div className="flex items-start gap-2">
// // //                         <ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" />
// // //                         <div>
// // //                           <strong>PRO Plan Trial:</strong> You'll get 30 days FREE trial.
// // //                         </div>
// // //                       </div>
// // //                     </AlertDescription>
// // //                   </Alert>

// // //                   <div className="space-y-3">
// // //                     <Label htmlFor="phone-otp" className="text-sm sm:text-base">
// // //                       Enter 6-digit OTP
// // //                     </Label>
// // //                     <div className="flex gap-2">
// // //                       <div className="flex-1">
// // //                         <Input
// // //                           id="phone-otp"
// // //                           type="text"
// // //                           inputMode="numeric"
// // //                           pattern="\d*"
// // //                           maxLength={6}
// // //                           value={phoneOTP}
// // //                           onChange={(e) => handlePhoneOtpChange(e.target.value)}
// // //                           placeholder="000000"
// // //                           className="text-center text-xl sm:text-2xl font-mono tracking-widest h-12 sm:h-14"
// // //                           autoFocus
// // //                         />
// // //                       </div>
// // //                       <Button
// // //                         type="button"
// // //                         onClick={handleVerifyPhoneOTP}
// // //                         disabled={phoneOTP.length !== 6 || isVerifyingPhoneOTP}
// // //                         className="bg-green-600 hover:bg-green-700"
// // //                       >
// // //                         {isVerifyingPhoneOTP ? (
// // //                           <Loader2 className="h-4 w-4 animate-spin" />
// // //                         ) : (
// // //                           "Verify"
// // //                         )}
// // //                       </Button>
// // //                     </div>

// // //                     <div className="flex justify-center pt-2">
// // //                       <Button
// // //                         type="button"
// // //                         variant="outline"
// // //                         size="sm"
// // //                         onClick={() => {
// // //                           setShowPhoneOTPInput(false);
// // //                           setPhoneOTP("");
// // //                         }}
// // //                         className="text-xs sm:text-sm"
// // //                       >
// // //                         <ArrowLeft className="h-3 w-3 mr-1" />
// // //                         Back to Form
// // //                       </Button>
// // //                     </div>
// // //                   </div>
// // //                 </div>
// // //               )}

// // //               {/* SMS OTP Input Section for FREE Plan */}
// // //               {formData.plan === "free" && otpData.otpSent && !otpData.isPhoneVerified && (
// // //                 <div className="space-y-4 border rounded-lg p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
// // //                   <div className="flex items-center gap-3">
// // //                     <div className="p-2 bg-blue-100 rounded-lg">
// // //                       <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
// // //                     </div>
// // //                     <div>
// // //                       <h3 className="font-semibold text-base sm:text-lg">Verify Your Phone</h3>
// // //                       <p className="text-xs sm:text-sm text-muted-foreground">
// // //                         OTP sent to <strong>{formatIndianPhone(formData.phone)}</strong>
// // //                       </p>
// // //                     </div>
// // //                   </div>

// // //                   <Alert className="bg-amber-50 border-amber-200 text-xs sm:text-sm">
// // //                     <AlertDescription className="text-amber-800">
// // //                       <div className="flex items-start gap-2">
// // //                         <ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" />
// // //                         <div>
// // //                           <strong>Security Notice:</strong> OTP valid for 5 minutes.
// // //                         </div>
// // //                       </div>
// // //                     </AlertDescription>
// // //                   </Alert>

// // //                   <div className="space-y-3">
// // //                     <Label htmlFor="otp" className="text-sm sm:text-base">
// // //                       Enter 6-digit OTP
// // //                     </Label>
// // //                     <div className="flex gap-2">
// // //                       <div className="flex-1">
// // //                         <Input
// // //                           id="otp"
// // //                           type="text"
// // //                           inputMode="numeric"
// // //                           pattern="\d*"
// // //                           maxLength={6}
// // //                           value={otpData.otp}
// // //                           onChange={(e) => handleOtpChange(e.target.value)}
// // //                           placeholder="000000"
// // //                           className="text-center text-xl sm:text-2xl font-mono tracking-widest h-12 sm:h-14"
// // //                           autoFocus
// // //                         />
// // //                         <div className="flex justify-between items-center mt-2">
// // //                           <span className="text-xs sm:text-sm text-muted-foreground">
// // //                             {otpData.otpCountdown > 0 ? (
// // //                               <span className="text-amber-600">
// // //                                 Expires in {formatCountdown(otpData.otpCountdown)}
// // //                               </span>
// // //                             ) : (
// // //                               <span className="text-red-600">OTP expired</span>
// // //                             )}
// // //                           </span>
// // //                           <Button
// // //                             type="button"
// // //                             variant="link"
// // //                             size="sm"
// // //                             onClick={handleSendOTP}
// // //                             disabled={isSendingOtp || otpData.otpCountdown > 0 || otpData.otpResendCount >= otpData.maxOtpResends}
// // //                             className="h-auto p-0 text-xs sm:text-sm"
// // //                           >
// // //                             {isSendingOtp ? (
// // //                               <>
// // //                                 <Loader2 className="h-3 w-3 mr-1 animate-spin" />
// // //                                 Sending...
// // //                               </>
// // //                             ) : (
// // //                               <>
// // //                                 <RefreshCw className="h-3 w-3 mr-1" />
// // //                                 Resend
// // //                               </>
// // //                             )}
// // //                           </Button>
// // //                         </div>
// // //                       </div>
// // //                       <Button
// // //                         type="button"
// // //                         onClick={handleVerifyOTP}
// // //                         disabled={otpData.otp.length !== 6 || isVerifyingOtp}
// // //                         className="bg-green-600 hover:bg-green-700"
// // //                       >
// // //                         {isVerifyingOtp ? (
// // //                           <Loader2 className="h-4 w-4 animate-spin" />
// // //                         ) : (
// // //                           "Verify"
// // //                         )}
// // //                       </Button>
// // //                     </div>

// // //                     <div className="flex justify-center pt-2">
// // //                       <Button
// // //                         type="button"
// // //                         variant="outline"
// // //                         size="sm"
// // //                         onClick={() => {
// // //                           setOtpData(prev => ({
// // //                             ...prev,
// // //                             otpSent: false,
// // //                             otp: "",
// // //                             otpCountdown: 0
// // //                           }));
// // //                         }}
// // //                         className="text-xs sm:text-sm"
// // //                       >
// // //                         <ArrowLeft className="h-3 w-3 mr-1" />
// // //                         Back to Form
// // //                       </Button>
// // //                     </div>
// // //                   </div>
// // //                 </div>
// // //               )}
// // //             </div>
// // //           )}

// // //           {/* Action Buttons */}
// // //           {showForm && (
// // //             <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t">
// // //               <Button
// // //                 type="button"
// // //                 variant="outline"
// // //                 onClick={() => {
// // //                   onClose();
// // //                 }}
// // //                 disabled={isSubmitting || isSendingOtp || isVerifyingOtp || isSendingPhoneOTP || isVerifyingPhoneOTP}
// // //                 className="w-full sm:w-auto text-sm sm:text-base"
// // //               >
// // //                 Cancel
// // //               </Button>
// // //               <Button
// // //                 type="submit"
// // //                 disabled={isSubmitDisabled()}
// // //                 className={`w-full sm:w-auto text-sm sm:text-base min-w-32 ${!isAvailablePlan ? 'bg-amber-500 hover:bg-amber-600' :
// // //                   formData.plan === 'pro' ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : ''
// // //                   }`}
// // //               >
// // //                 {getButtonText()}
// // //               </Button>
// // //             </div>
// // //           )}

// // //           {/* Plan Summary */}
// // //           {showForm && (
// // //             <div className={`text-xs sm:text-sm text-center p-2 sm:p-3 rounded ${formData.plan === 'enterprise'
// // //               ? 'bg-amber-50 border border-amber-200 text-amber-800'
// // //               : formData.plan === 'pro'
// // //                 ? 'bg-blue-50 border border-blue-200 text-blue-800'
// // //                 : 'bg-gray-50 border border-gray-200 text-gray-800'
// // //               }`}>
// // //               {formData.plan === 'enterprise' ? (
// // //                 <div className="space-y-1">
// // //                   <div className="font-semibold">ENTERPRISE Plan - Coming Soon!</div>
// // //                   <div>Contact sales: <span className="font-medium">sales@hotelmanagementsystem.com</span></div>
// // //                 </div>
// // //               ) : formData.plan === 'pro' ? (
// // //                 <div className="space-y-1">
// // //                   <div className="font-semibold">PRO Plan - 30 Day FREE Trial</div>
// // //                   <div>Phone verification required.</div>
// // //                   {phoneOTPVerified && (
// // //                     <div className="text-green-600 font-medium">
// // //                       ✓ Phone verified
// // //                     </div>
// // //                   )}
// // //                 </div>
// // //               ) : (
// // //                 <div className="space-y-1">
// // //                   <div className="font-semibold">
// // //                     BASIC Plan
// // //                     {otpData.isPhoneVerified && (
// // //                       <CheckCircle className="h-3 w-3 text-green-500 inline ml-1" />
// // //                     )}
// // //                   </div>
// // //                   <div>Perfect for small hotels. Phone verification required.</div>
// // //                 </div>
// // //               )}
// // //             </div>
// // //           )}
// // //         </form>
// // //       </DialogContent>
// // //     </Dialog>
// // //   );
// // // };

// // // export default RegisterModal;




// // import { useState, useEffect } from "react";
// // import { useNavigate } from "react-router-dom";
// // import {
// //   Dialog,
// //   DialogContent,
// //   DialogDescription,
// //   DialogHeader,
// //   DialogTitle,
// // } from "@/components/ui/dialog";
// // import { Button } from "@/components/ui/button";
// // import { Input } from "@/components/ui/input";
// // import { Label } from "@/components/ui/label";
// // import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// // import { Badge } from "@/components/ui/badge";
// // import { useToast } from "@/hooks/use-toast";
// // import { Alert, AlertDescription } from "@/components/ui/alert";
// // import {
// //   Loader2,
// //   ShieldCheck,
// //   RefreshCw,
// //   CheckCircle,
// //   ArrowLeft,
// //   Phone,
// //   Mail,
// //   Calendar,
// //   Clock,
// //   Check,
// //   ChevronDown,
// //   ChevronUp,
// //   X,
// //   Star,
// //   Hotel,
// //   User,
// //   Key,
// //   LogIn,
// //   Copy,
// //   CheckCheck,
// //   PartyPopper
// // } from "lucide-react";

// // interface RegisterModalProps {
// //   open: boolean;
// //   onClose: () => void;
// //   onTryDemo?: () => void;
// // }

// // // Google Apps Script URL for FREE plan
// // const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwA1sC2rREM50Ri9p0r-tWy3Jz-RSe39N9iu90qiRopKUvJ17fxYptB4yhbfQOBM62z/exec";

// // // Node.js backend URL
// // const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// // const RegisterModal = ({ open, onClose, onTryDemo }: RegisterModalProps) => {
// //   const navigate = useNavigate();
// //   const { toast } = useToast();

// //   // Form data state
// //   const [formData, setFormData] = useState({
// //     adminName: "",
// //     username: "",
// //     password: "",
// //     hotelName: "",
// //     email: "",
// //     phone: "",
// //     address: "",
// //     gstNumber: "",
// //     plan: "pro", // Default to PRO plan
// //   });

// //   // SMS OTP states for FREE plan
// //   const [otpData, setOtpData] = useState({
// //     otp: "",
// //     isPhoneVerified: false,
// //     otpSent: false,
// //     otpCountdown: 0,
// //     otpResendCount: 0,
// //     maxOtpResends: 3,
// //   });

// //   // Phone OTP states for PRO plan
// //   const [phoneOTP, setPhoneOTP] = useState("");
// //   const [phoneOTPVerified, setPhoneOTPVerified] = useState(false);
// //   const [showPhoneOTPInput, setShowPhoneOTPInput] = useState(false);
// //   const [showForm, setShowForm] = useState(true);

// //   // Loading states
// //   const [isSubmitting, setIsSubmitting] = useState(false);
// //   const [isSendingOtp, setIsSendingOtp] = useState(false);
// //   const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
// //   const [isSendingPhoneOTP, setIsSendingPhoneOTP] = useState(false);
// //   const [isVerifyingPhoneOTP, setIsVerifyingPhoneOTP] = useState(false);
// //   const [showOtpInput, setShowOtpInput] = useState(false);

// //   const [referralCode, setReferralCode] = useState('');
// //   const [referralValidating, setReferralValidating] = useState(false);
// //   const [referralValid, setReferralValid] = useState(false);
// //   const [referralDetails, setReferralDetails] = useState<any>(null);
// //   const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

// //   // Add state for welcome screen
// //   const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);
// //   const [registeredData, setRegisteredData] = useState({
// //     hotelName: "",
// //     username: "",
// //     password: "",
// //     phone: "",
// //     plan: ""
// //   });
// //   const [passwordCopied, setPasswordCopied] = useState(false);

// //   // OTP Countdown Timer for SMS
// //   useEffect(() => {
// //     let interval: NodeJS.Timeout;
// //     if (otpData.otpCountdown > 0) {
// //       interval = setInterval(() => {
// //         setOtpData(prev => ({
// //           ...prev,
// //           otpCountdown: prev.otpCountdown - 1
// //         }));
// //       }, 1000);
// //     }
// //     return () => {
// //       if (interval) clearInterval(interval);
// //     };
// //   }, [otpData.otpCountdown]);

// //   // Helper functions
// //   const formatIndianPhone = (phone: string) => {
// //     const clean = phone.replace(/\D/g, '');
// //     if (clean.length === 10) {
// //       return `+91 ${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
// //     }
// //     return phone;
// //   };

// //   const formatCountdown = (seconds: number) => {
// //     const mins = Math.floor(seconds / 60);
// //     const secs = seconds % 60;
// //     return `${mins}:${secs.toString().padStart(2, '0')}`;
// //   };

// //   // Form change handlers
// //   const handleChange = (field: string, value: string) => {
// //     setFormData((prev) => ({ ...prev, [field]: value }));

// //     // Reset verification states when phone changes
// //     if (field === "phone") {
// //       setOtpData(prev => ({
// //         ...prev,
// //         isPhoneVerified: false,
// //         otpSent: false,
// //         otp: ""
// //       }));
// //       setShowOtpInput(false);

// //       setPhoneOTPVerified(false);
// //       setShowPhoneOTPInput(false);
// //       setPhoneOTP("");
// //     }
// //   };

// //   const handleOtpChange = (value: string) => {
// //     const numericValue = value.replace(/\D/g, '').slice(0, 6);
// //     setOtpData(prev => ({ ...prev, otp: numericValue }));
// //   };

// //   const handlePhoneOtpChange = (value: string) => {
// //     const numericValue = value.replace(/\D/g, '').slice(0, 6);
// //     setPhoneOTP(numericValue);
// //   };

// //   // Plan change handler
// //   const handlePlanChange = (value: string) => {
// //     handleChange("plan", value);

// //     if (value === "free") {
// //       setPhoneOTPVerified(false);
// //       setShowPhoneOTPInput(false);
// //       setPhoneOTP("");
// //     } else if (value === "pro") {
// //       setOtpData({
// //         otp: "",
// //         isPhoneVerified: false,
// //         otpSent: false,
// //         otpCountdown: 0,
// //         otpResendCount: 0,
// //         maxOtpResends: 3,
// //       });
// //       setShowOtpInput(false);
// //     }
// //   };

// //   const validateReferralCode = async () => {
// //     if (!referralCode.trim()) {
// //       setReferralValid(false);
// //       return;
// //     }

// //     setReferralValidating(true);
// //     try {
// //       const response = await fetch(`${NODE_BACKEND_URL}/wallet/referral/validate/${referralCode}`, {
// //         method: 'GET',
// //         headers: {
// //           'Content-Type': 'application/json',
// //         },
// //       });

// //       if (response.ok) {
// //         const data = await response.json();
// //         if (data.success) {
// //           setReferralValid(true);
// //           setReferralDetails(data.data);
// //           toast({
// //             title: 'Referral Code Valid!',
// //             description: `You'll earn benefits from ${data.data.referrer_name}`,
// //             variant: 'default',
// //           });
// //         } else {
// //           setReferralValid(false);
// //           toast({
// //             title: 'Invalid Code',
// //             description: 'Please enter a valid referral code',
// //             variant: 'destructive',
// //           });
// //         }
// //       } else {
// //         setReferralValid(false);
// //         toast({
// //           title: 'Error',
// //           description: 'Failed to validate referral code',
// //           variant: 'destructive',
// //         });
// //       }
// //     } catch (error) {
// //       setReferralValid(false);
// //       toast({
// //         title: 'Error',
// //         description: 'Network error. Please try again.',
// //         variant: 'destructive',
// //       });
// //     } finally {
// //       setReferralValidating(false);
// //     }
// //   };

// //   // JSONP function for Google Apps Script (FREE plan)
// //   function jsonpRequest(url: string): Promise<any> {
// //     return new Promise((resolve, reject) => {
// //       const callbackName = "cb_" + Date.now();
// //       (window as any)[callbackName] = (data: any) => {
// //         resolve(data);
// //         delete (window as any)[callbackName];
// //         script.remove();
// //       };
// //       const script = document.createElement("script");
// //       script.src = url + (url.includes("?") ? "&" : "?") + "callback=" + callbackName;
// //       script.onerror = () => {
// //         reject(new Error("Failed to load script"));
// //         delete (window as any)[callbackName];
// //         script.remove();
// //       };
// //       document.body.appendChild(script);
// //     });
// //   }

// //   // Fetch function for Node.js backend
// //   async function fetchBackendRequest(endpoint: string, data: any): Promise<any> {
// //     console.log("📤 Sending to backend:", {
// //       endpoint: `${NODE_BACKEND_URL}${endpoint}`,
// //       data: { ...data, admin: { ...data.admin, password: '[HIDDEN]' } }
// //     });

// //     const response = await fetch(`${NODE_BACKEND_URL}${endpoint}`, {
// //       method: "POST",
// //       headers: {
// //         "Content-Type": "application/json",
// //       },
// //       body: JSON.stringify(data),
// //     });

// //     const responseText = await response.text();
// //     console.log("📥 Backend response:", {
// //       status: response.status,
// //       statusText: response.statusText,
// //       body: responseText
// //     });

// //     if (!response.ok) {
// //       let errorMessage = `HTTP error! status: ${response.status}`;
// //       try {
// //         const errorData = JSON.parse(responseText);
// //         errorMessage = errorData.message || errorData.error || errorMessage;
// //       } catch (e) {
// //         errorMessage = responseText || errorMessage;
// //       }
// //       throw new Error(errorMessage);
// //     }

// //     try {
// //       return JSON.parse(responseText);
// //     } catch (e) {
// //       throw new Error('Invalid JSON response from server');
// //     }
// //   }

// //   const encodeValue = (val: unknown) =>
// //     typeof val === "string" || typeof val === "number" || typeof val === "boolean"
// //       ? encodeURIComponent(val.toString())
// //       : "";

// //   const buildQueryString = (params: Record<string, unknown>): string =>
// //     Object.entries(params)
// //       .map(([key, val]) => {
// //         if (typeof val === "object" && val !== null) {
// //           return Object.entries(val as Record<string, unknown>)
// //             .map(
// //               ([subKey, subVal]) =>
// //                 encodeURIComponent(`${key}[${subKey}]`) + "=" + encodeValue(subVal)
// //             )
// //             .join("&");
// //         }
// //         return encodeURIComponent(key) + "=" + encodeValue(val);
// //       })
// //       .join("&");

// //   // SMS OTP functions for FREE plan
// //   async function generateSMSOTP(phone: string, email: string, hotelName: string, username: string): Promise<any> {
// //     const paramObj = {
// //       action: "generateOTP",
// //       phone: phone,
// //       email: email,
// //       hotelName: hotelName,
// //       username: username
// //     };

// //     const queryString = buildQueryString(paramObj);
// //     const url = APPS_SCRIPT_URL + "?" + queryString;

// //     console.log("📱 Generating SMS OTP for phone:", phone);
// //     return await jsonpRequest(url);
// //   }

// //   async function verifySMSOTP(phone: string, email: string, otp: string): Promise<any> {
// //     const paramObj = {
// //       action: "verifyOTP",
// //       phone: phone,
// //       email: email,
// //       otp: otp
// //     };

// //     const queryString = buildQueryString(paramObj);
// //     const url = APPS_SCRIPT_URL + "?" + queryString;

// //     console.log("🔐 Verifying SMS OTP for phone:", phone);
// //     return await jsonpRequest(url);
// //   }

// //   // Send SMS OTP for FREE plan
// //   const handleSendOTP = async () => {
// //     if (!formData.phone) {
// //       toast({
// //         title: "Phone Number Required",
// //         description: "Please enter your phone number to receive SMS OTP",
// //         variant: "destructive",
// //       });
// //       return;
// //     }

// //     const phoneRegex = /^[6-9]\d{9}$/;
// //     const cleanPhone = formData.phone.replace(/\D/g, '');

// //     if (!phoneRegex.test(cleanPhone)) {
// //       toast({
// //         title: "Invalid Phone Number",
// //         description: "Please enter a valid 10-digit Indian mobile number",
// //         variant: "destructive",
// //       });
// //       return;
// //     }

// //     if (otpData.otpResendCount >= otpData.maxOtpResends) {
// //       toast({
// //         title: "Resend Limit Reached",
// //         description: "You have reached the maximum OTP resend attempts. Please try again later.",
// //         variant: "destructive",
// //       });
// //       return;
// //     }

// //     setIsSendingOtp(true);
// //     try {
// //       const response = await generateSMSOTP(
// //         cleanPhone,
// //         formData.email || `${formData.username}@temp.com`,
// //         formData.hotelName || `${formData.username} Hotel`,
// //         formData.username
// //       );

// //       if (response.success) {
// //         setOtpData(prev => ({
// //           ...prev,
// //           otpSent: true,
// //           otpCountdown: 300,
// //           otpResendCount: prev.otpResendCount + 1,
// //           isPhoneVerified: false
// //         }));

// //         setShowOtpInput(true);

// //         toast({
// //           title: "OTP Sent Successfully! 📱",
// //           description: `We've sent a 6-digit OTP to ${formatIndianPhone(formData.phone)}`,
// //           variant: "default",
// //         });
// //       } else {
// //         throw new Error(response.message || "Failed to send OTP");
// //       }
// //     } catch (error: any) {
// //       console.error("OTP send error:", error);

// //       let errorMessage = "Failed to send OTP. Please try again.";
// //       if (error.message.includes("OTP_GENERATION_FAILED")) {
// //         errorMessage = "Unable to send SMS OTP. Please check your phone number.";
// //       } else if (error.message.includes("INVALID_PHONE")) {
// //         errorMessage = "Invalid phone number. Please enter a valid 10-digit Indian number.";
// //       }

// //       toast({
// //         title: "SMS OTP Send Failed",
// //         description: errorMessage,
// //         variant: "destructive",
// //       });
// //     } finally {
// //       setIsSendingOtp(false);
// //     }
// //   };

// //   // Verify SMS OTP for FREE plan
// //   const handleVerifyOTP = async () => {
// //     if (!otpData.otp || otpData.otp.length !== 6) {
// //       toast({
// //         title: "Invalid OTP",
// //         description: "Please enter a valid 6-digit OTP",
// //         variant: "destructive",
// //       });
// //       return;
// //     }

// //     const cleanPhone = formData.phone.replace(/\D/g, '');
// //     const autoEmail = formData.email || `${formData.username}@temp.com`;

// //     setIsVerifyingOtp(true);
// //     try {
// //       const response = await verifySMSOTP(cleanPhone, autoEmail, otpData.otp);

// //       if (response.success) {
// //         setOtpData(prev => ({
// //           ...prev,
// //           isPhoneVerified: true
// //         }));

// //         setShowOtpInput(false);

// //         toast({
// //           title: "Phone Verified Successfully! ✅",
// //           description: "Your phone number has been verified. You can now proceed with registration.",
// //           variant: "default",
// //         });
// //       } else {
// //         if (response.error === "INVALID_OTP") {
// //           toast({
// //             title: "Invalid OTP",
// //             description: response.message || "The OTP you entered is incorrect.",
// //             variant: "destructive",
// //           });
// //         } else if (response.error === "OTP_EXPIRED") {
// //           setOtpData(prev => ({
// //             ...prev,
// //             otpSent: false,
// //             otpCountdown: 0
// //           }));
// //           setShowOtpInput(false);

// //           toast({
// //             title: "OTP Expired",
// //             description: "The OTP has expired. Please request a new one.",
// //             variant: "destructive",
// //           });
// //         } else if (response.error === "MAX_ATTEMPTS") {
// //           setOtpData(prev => ({
// //             ...prev,
// //             otpSent: false,
// //             otpCountdown: 0
// //           }));
// //           setShowOtpInput(false);

// //           toast({
// //             title: "Maximum Attempts Exceeded",
// //             description: "Too many failed attempts. Please request a new OTP.",
// //             variant: "destructive",
// //           });
// //         }
// //       }
// //     } catch (error: any) {
// //       console.error("OTP verification error:", error);

// //       toast({
// //         title: "Verification Failed",
// //         description: "Failed to verify OTP. Please try again.",
// //         variant: "destructive",
// //       });
// //     } finally {
// //       setIsVerifyingOtp(false);
// //     }
// //   };

// //   // Send Phone OTP for PRO plan (using WhatsApp)
// //   const handleSendPhoneOTP = async () => {
// //     if (!formData.phone) {
// //       toast({
// //         title: "Phone Required",
// //         description: "Please enter your phone number to receive OTP",
// //         variant: "destructive",
// //       });
// //       return;
// //     }

// //     if (!formData.username) {
// //       toast({
// //         title: "Username Required",
// //         description: "Please enter your username",
// //         variant: "destructive",
// //       });
// //       return;
// //     }

// //     const autoEmail = formData.email || `${formData.username.replace(/\s+/g, '')}@hotel.com`;
// //     const autoHotelName = formData.hotelName || `${formData.username} Hotel`;
// //     const autoAdminName = formData.adminName || formData.username;
// //     const cleanPhone = formData.phone ? formData.phone.replace(/\D/g, '') : null;

// //     setIsSendingPhoneOTP(true);
// //     try {
// //       const response = await fetch(`${NODE_BACKEND_URL}/hotels/send-pro-otp-whatsapp`, {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify({
// //           email: autoEmail,
// //           hotelName: autoHotelName,
// //           adminName: autoAdminName,
// //           phone: cleanPhone
// //         }),
// //       });

// //       const data = await response.json();

// //       if (data.success) {
// //         setShowPhoneOTPInput(true);

// //         let successMessage = `OTP sent to ${formatIndianPhone(formData.phone)} via WhatsApp`;

// //         toast({
// //           title: "OTP Sent Successfully! 📱",
// //           description: successMessage,
// //           variant: "default",
// //         });

// //         console.log("✅ OTP Delivery Status:", data.data?.delivery);
// //       } else {
// //         throw new Error(data.message || "Failed to send OTP");
// //       }
// //     } catch (error: any) {
// //       toast({
// //         title: "Failed to Send OTP",
// //         description: error.message || "Please try again",
// //         variant: "destructive",
// //       });
// //     } finally {
// //       setIsSendingPhoneOTP(false);
// //     }
// //   };

// //   // Verify Phone OTP for PRO plan
// //   const handleVerifyPhoneOTP = async () => {
// //     if (!phoneOTP || phoneOTP.length !== 6) {
// //       toast({
// //         title: "Invalid OTP",
// //         description: "Please enter a valid 6-digit OTP",
// //         variant: "destructive",
// //       });
// //       return;
// //     }

// //     const autoEmail = formData.email || `${formData.username.replace(/\s+/g, '')}@hotel.com`;

// //     setIsVerifyingPhoneOTP(true);
// //     try {
// //       const response = await fetch(`${NODE_BACKEND_URL}/hotels/verify-email-otp`, {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify({
// //           email: autoEmail,
// //           otp: phoneOTP
// //         }),
// //       });

// //       const data = await response.json();

// //       if (data.success) {
// //         setPhoneOTPVerified(true);
// //         setShowPhoneOTPInput(false);
// //         toast({
// //           title: "Phone Verified Successfully! ✅",
// //           description: "Your phone has been verified for PRO plan",
// //           variant: "default",
// //         });
// //       } else {
// //         throw new Error(data.message || "Invalid OTP");
// //       }
// //     } catch (error: any) {
// //       toast({
// //         title: "OTP Verification Failed",
// //         description: error.message || "Please try again",
// //         variant: "destructive",
// //       });
// //     } finally {
// //       setIsVerifyingPhoneOTP(false);
// //     }
// //   };

// //   // Main submit handler
// //   const handleSubmit = async (e: React.FormEvent) => {
// //     e.preventDefault();

// //     if (formData.plan === "enterprise") {
// //       toast({
// //         title: "Enterprise Plan - Coming Soon",
// //         description: "Please contact sales for enterprise solutions",
// //         variant: "default",
// //       });
// //       return;
// //     }

// //     // FOR FREE PLAN
// //     if (formData.plan === "free") {
// //       if (!otpData.isPhoneVerified) {
// //         if (!showOtpInput) {
// //           await handleSendOTP();
// //           return;
// //         } else {
// //           await handleVerifyOTP();
// //           return;
// //         }
// //       }
// //     }

// //     // FOR PRO PLAN
// //     if (formData.plan === "pro") {
// //       if (!phoneOTPVerified) {
// //         if (!showPhoneOTPInput) {
// //           await handleSendPhoneOTP();
// //           return;
// //         } else {
// //           await handleVerifyPhoneOTP();
// //           return;
// //         }
// //       }
// //     }

// //     // If all validations pass, complete registration
// //     await completeRegistration();
// //   };

// //   // Complete registration
// //   const completeRegistration = async () => {
// //     setIsSubmitting(true);

// //     try {
// //       const cleanPhone = formData.phone.replace(/\D/g, '');
// //       const autoEmail = formData.email || `${formData.username.replace(/\s+/g, '')}@hotel.com`;
// //       const autoHotelName = formData.hotelName || `${formData.username} Hotel`;
// //       const autoAdminName = formData.adminName || formData.username;
// //       const autoAddress = formData.address || 'Address not provided';
// //       const autoPassword = formData.password || cleanPhone;

// //       const hotelData = {
// //         hotelName: autoHotelName,
// //         address: autoAddress,
// //         plan: formData.plan,
// //         gstNumber: formData.gstNumber.trim(),
// //         referralCode: referralValid ? referralCode : null,
// //         admin: {
// //           username: formData.username.trim(),
// //           password: autoPassword,
// //           role: "admin",
// //           name: autoAdminName,
// //           email: autoEmail,
// //           phone: cleanPhone,
// //           status: formData.plan === "free" ? "active" : "pending"
// //         }
// //       };

// //       if (formData.plan === "pro") {
// //         (hotelData as any).emailOTP = phoneOTP;
// //       }

// //       let data;

// //       if (formData.plan === "free") {
// //         console.log("FREE plan selected - Saving to Google Sheets");

// //         const paramObj: Record<string, unknown> = {
// //           action: "createHotel",
// //           ...hotelData,
// //           "admin[status]": "active"
// //         };

// //         const queryString = buildQueryString(paramObj);
// //         const url = APPS_SCRIPT_URL + "?" + queryString;

// //         console.log("Sending to Google Apps Script:", url);
// //         data = await jsonpRequest(url);

// //       } else {
// //         console.log("PRO plan selected - Saving to MySQL Database");
// //         console.log("Sending to Node.js backend:", hotelData);

// //         data = await fetchBackendRequest("/hotels/register", hotelData);
// //       }

// //       if (data.success) {
// //         // Save registration data for welcome screen
// //         setRegisteredData({
// //           hotelName: autoHotelName,
// //           username: formData.username.trim(),
// //           password: autoPassword,
// //           phone: formatIndianPhone(cleanPhone),
// //           plan: formData.plan
// //         });

// //         // Reset form
// //         setFormData({
// //           adminName: "",
// //           username: "",
// //           password: "",
// //           hotelName: "",
// //           email: "",
// //           phone: "",
// //           address: "",
// //           gstNumber: "",
// //           plan: "free",
// //         });

// //         setOtpData({
// //           otp: "",
// //           isPhoneVerified: false,
// //           otpSent: false,
// //           otpCountdown: 0,
// //           otpResendCount: 0,
// //           maxOtpResends: 3,
// //         });

// //         setPhoneOTP("");
// //         setPhoneOTPVerified(false);
// //         setShowPhoneOTPInput(false);
// //         setShowOtpInput(false);

// //         // Close registration modal and show welcome screen
// //         setShowWelcomeScreen(true);
// //         // Don't call onClose() or navigate yet
// //       } else {
// //         if (data.error === "HOTEL_EXISTS") {
// //           toast({
// //             title: "Registration Failed",
// //             description: "Hotel already registered. Try a different name.",
// //             variant: "destructive",
// //           });
// //         } else if (data.error === "USERNAME_EXISTS") {
// //           toast({
// //             title: "Username Taken",
// //             description: "This username is already in use. Choose another one.",
// //             variant: "destructive",
// //           });
// //         } else if (data.error === "INVALID_OTP") {
// //           toast({
// //             title: "OTP Verification Failed",
// //             description: "Please verify your OTP again",
// //             variant: "destructive",
// //           });
// //         } else {
// //           throw new Error(data.message || data.error || "Failed to create hotel");
// //         }
// //       }
// //     } catch (err: any) {
// //       console.error("Registration error:", err);

// //       let errorMessage = err.message || "Something went wrong.";

// //       if (err.message.includes("Failed to fetch")) {
// //         errorMessage = "Cannot connect to the server. Please check if the backend is running.";
// //       } else if (err.message.includes("Failed to load script")) {
// //         errorMessage = "Cannot connect to Google Sheets. Please check your internet connection.";
// //       }

// //       toast({
// //         title: "Registration Failed",
// //         description: errorMessage,
// //         variant: "destructive",
// //       });
// //     } finally {
// //       setIsSubmitting(false);
// //     }
// //   };

// //   // Handle copy password to clipboard
// //   const copyPasswordToClipboard = () => {
// //     navigator.clipboard.writeText(registeredData.password);
// //     setPasswordCopied(true);
// //     setTimeout(() => setPasswordCopied(false), 3000);

// //     toast({
// //       title: "Password Copied!",
// //       description: "Password has been copied to clipboard",
// //       variant: "default",
// //     });
// //   };

// //   // Handle proceed to login
// //   const handleProceedToLogin = () => {
// //     setShowWelcomeScreen(false);
// //     onClose();
// //     navigate("/login");
// //   };

// //   // Plan features detail
// //   const detailedFeatures = {
// //     free: [
// //       { text: "Basic booking register", included: true },
// //       { text: "5,000 records limit", included: true },
// //       { text: "Manual room status update (max 20 rooms)", included: true },
// //       { text: "Simple digital check-in/check-out (no guest history)", included: true },
// //       { text: "Mobile version (limited view mode only)", included: true },
// //       { text: "Basic print invoice", included: true },
// //       { text: "Manual payment entry only", included: true },
// //       { text: "Only today's check-in/check-out report (no export)", included: true },
// //       { text: "No staff management", included: false },
// //       { text: "No WhatsApp alerts", included: false },
// //       { text: "No OTA connectivity", included: false },
// //       { text: "Basic owner dashboard (daily summary only)", included: true },
// //       { text: "No AI features", included: false },
// //       { text: "No integrations", included: false },
// //       { text: "Help docs support only", included: true },
// //       { text: "Go live in less than a minute", included: true },
// //       { text: "Lifetime free", included: true }
// //     ],
// //     pro: [
// //       { text: "Full PMS: room allocation, early/late check-in/out", included: true },
// //       { text: "50,000 records", included: true },
// //       { text: "Housekeeping app + live status", included: true },
// //       { text: "Automated check-in/out + guest history", included: true },
// //       { text: "Full mobile app for staff & owner", included: true },
// //       { text: "GST invoice generator", included: true },
// //       { text: "Online payment links", included: true },
// //       { text: "Split billing + outstanding tracking", included: true },
// //       { text: "Daily revenue dashboard + audit report", included: true },
// //       { text: "Attendance + payroll", included: true },
// //       { text: "WhatsApp reminders (check-out, payments, tasks)", included: true },
// //       { text: "Booking.com / MMT / Goibibo auto-sync", included: true },
// //       { text: "Daily MIS via WhatsApp", included: true },
// //       { text: "No AI pricing engine", included: false },
// //       { text: "POS optional integration", included: true },
// //       { text: "WhatsApp & call support", included: true },
// //       { text: "Go live in less than 1 hour", included: true },
// //       { text: "30-day FREE trial, then ₹999 / 6 months", included: true }
// //     ],
// //     enterprise: [
// //       { text: "Chain-level PMS & coordination", included: true },
// //       { text: "Unlimited records", included: true },
// //       { text: "Central housekeeping monitoring", included: true },
// //       { text: "Central guest database across properties", included: true },
// //       { text: "Advanced chain manager mobile app", included: true },
// //       { text: "Multi-property GST/ledger system", included: true },
// //       { text: "Central finance dashboard", included: true },
// //       { text: "Chain-level analytics (ADR, RevPAR, occupancy)", included: true },
// //       { text: "Multi-property HR & approvals", included: true },
// //       { text: "Advanced WhatsApp automation (chain MIS, AI alerts)", included: true },
// //       { text: "Centralized rate & multiple OTA management", included: true },
// //       { text: "Group-level performance dashboard", included: true },
// //       { text: "AI pricing engine + forecasting", included: true },
// //       { text: "Full API + channel managers + smart locks", included: true },
// //       { text: "Dedicated manager + SLA", included: true },
// //       { text: "Go live in a day", included: true },
// //       { text: "Custom pricing", included: true }
// //     ]
// //   };

// //   // Plan configurations
// //   const plans = [
// //     {
// //       id: "free",
// //       name: "BASIC",
// //       subtitle: "Small Hotels – Limited",
// //       price: "₹0/month",
// //       color: "border-gray-300",
// //       buttonVariant: "secondary" as const,
// //       available: true,
// //       icon: "🆓"
// //     },
// //     {
// //       id: "pro",
// //       name: "PRO",
// //       subtitle: "Boutique / 20–70 Rooms",
// //       price: "30-day FREE trial",
// //       color: "border-blue-500",
// //       buttonVariant: "default" as const,
// //       available: true,
// //       icon: "⭐"
// //     },
// //     {
// //       id: "enterprise",
// //       name: "ENTERPRISE",
// //       subtitle: "Hotel Chains",
// //       price: "Contact for pricing",
// //       color: "border-purple-600",
// //       buttonVariant: "default" as const,
// //       available: false,
// //       icon: "🏢"
// //     }
// //   ];

// //   // Get current plan
// //   const selectedPlan = plans.find(p => p.id === formData.plan);
// //   const isAvailablePlan = selectedPlan?.available;

// //   // Get button text based on current state
// //   const getButtonText = () => {
// //     if (!isAvailablePlan) return 'Upcoming';

// //     if (isSubmitting) return 'Registering...';
// //     if (isSendingOtp) return 'Sending SMS OTP...';
// //     if (isVerifyingOtp) return 'Verifying SMS OTP...';
// //     if (isSendingPhoneOTP) return 'Sending OTP...';
// //     if (isVerifyingPhoneOTP) return 'Verifying OTP...';

// //     if (formData.plan === "free") {
// //       if (!otpData.isPhoneVerified) {
// //         if (!showOtpInput) {
// //           return 'Send SMS OTP to Register';
// //         } else {
// //           return 'Verify SMS OTP & Register';
// //         }
// //       }
// //     } else if (formData.plan === "pro") {
// //       if (!phoneOTPVerified) {
// //         if (!showPhoneOTPInput) {
// //           return 'Send OTP for PRO Plan';
// //         } else {
// //           return 'Verify OTP & Register';
// //         }
// //       }
// //     }

// //     return `Start ${formData.plan.toUpperCase()} Plan`;
// //   };

// //   // Determine if submit button should be disabled
// //   const isSubmitDisabled = () => {
// //     if (!isAvailablePlan) return true;
// //     if (isSubmitting || isSendingOtp || isVerifyingOtp || isSendingPhoneOTP || isVerifyingPhoneOTP) return true;

// //     if (formData.plan === "free" && showOtpInput && !otpData.isPhoneVerified) {
// //       return otpData.otp.length !== 6;
// //     }

// //     if (formData.plan === "pro" && showPhoneOTPInput && !phoneOTPVerified) {
// //       return phoneOTP.length !== 6;
// //     }

// //     return false;
// //   };

// //   // Welcome Screen Component
// //   const WelcomeScreen = () => (
// //     <DialogContent className="max-w-md mx-auto p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
// //       <style>{`
// //         @keyframes gradientShift {
// //           0% { background-position: 0% 50%; }
// //           50% { background-position: 100% 50%; }
// //           100% { background-position: 0% 50%; }
// //         }
// //         .animate-gradient-shift {
// //           background: linear-gradient(-45deg, #10b981, #059669, #047857, #065f46);
// //           background-size: 300% 300%;
// //           animation: gradientShift 8s ease infinite;
// //         }
// //         @keyframes pulseSlow {
// //           0%, 100% { transform: scale(1); opacity: 1; }
// //           50% { transform: scale(1.05); opacity: 0.9; }
// //         }
// //         .animate-pulse-slow {
// //           animation: pulseSlow 3s ease-in-out infinite;
// //         }
// //         @keyframes confetti {
// //           0% { transform: translateY(0) rotate(0deg); opacity: 1; }
// //           100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
// //         }
// //         .confetti {
// //           position: absolute;
// //           width: 10px;
// //           height: 10px;
// //           background: var(--color);
// //           top: -10px;
// //           border-radius: 0;
// //           animation: confetti 3s ease-in-out infinite;
// //         }
// //       `}</style>

// //       <div className="relative">
// //         {/* Animated gradient background */}
// //         <div className="absolute inset-0 animate-gradient-shift"></div>

// //         {/* Confetti effect */}
// //         {[...Array(20)].map((_, i) => (
// //           <div
// //             key={i}
// //             className="confetti"
// //             style={{
// //               left: `${Math.random() * 100}%`,
// //               animationDelay: `${Math.random() * 2}s`,
// //               backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
// //               width: `${Math.random() * 10 + 5}px`,
// //               height: `${Math.random() * 10 + 5}px`,
// //               transform: `rotate(${Math.random() * 360}deg)`,
// //             }}
// //           />
// //         ))}

// //         {/* Content */}
// //         <div className="relative z-10 p-8 text-white">
// //           {/* Success animation */}
// //           <div className="flex justify-center mb-6">
// //             <div className="relative">
// //               <div className="w-28 h-28 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse-slow">
// //                 <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl">
// //                   <PartyPopper className="h-12 w-12 text-emerald-600" />
// //                 </div>
// //               </div>
// //               <div className="absolute -top-2 -right-2">
// //                 <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-2xl animate-bounce shadow-lg">
// //                   🎉
// //                 </div>
// //               </div>
// //             </div>
// //           </div>

// //           <DialogTitle className="text-3xl font-bold text-center mb-2 text-white drop-shadow-lg">
// //             Welcome to {registeredData.hotelName}!
// //           </DialogTitle>

// //           <DialogDescription className="text-center text-white/90 text-lg mb-8 drop-shadow">
// //             Your account has been created successfully
// //           </DialogDescription>

// //           {/* Credentials Card */}
// //           <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6 border border-white/20 shadow-xl">
// //             <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
// //               <Key className="h-5 w-5" />
// //               Your Login Credentials
// //             </h3>

// //             <div className="space-y-4">
// //               <div className="flex items-start gap-3">
// //                 <div className="bg-white/20 p-2 rounded-lg">
// //                   <User className="h-5 w-5 text-white" />
// //                 </div>
// //                 <div className="flex-1">
// //                   <p className="text-sm text-white/70">Username</p>
// //                   <p className="font-mono font-bold text-lg text-white">{registeredData.username}</p>
// //                 </div>
// //               </div>

// //               <div className="flex items-start gap-3">
// //                 <div className="bg-white/20 p-2 rounded-lg">
// //                   <Key className="h-5 w-5 text-white" />
// //                 </div>
// //                 <div className="flex-1">
// //                   <p className="text-sm text-white/70">Password</p>
// //                   <div className="flex items-center gap-2">
// //                     <p className="font-mono font-bold text-lg flex-1 text-white">
// //                       {registeredData.password}
// //                     </p>
// //                     <Button
// //                       type="button"
// //                       size="sm"
// //                       variant="secondary"
// //                       className="bg-white/20 hover:bg-white/30 text-white border-0 transition-all"
// //                       onClick={copyPasswordToClipboard}
// //                     >
// //                       {passwordCopied ? (
// //                         <CheckCheck className="h-4 w-4" />
// //                       ) : (
// //                         <Copy className="h-4 w-4" />
// //                       )}
// //                     </Button>
// //                   </div>
// //                 </div>
// //               </div>

// //               <div className="flex items-start gap-3">
// //                 <div className="bg-white/20 p-2 rounded-lg">
// //                   <Phone className="h-5 w-5 text-white" />
// //                 </div>
// //                 <div className="flex-1">
// //                   <p className="text-sm text-white/70">Registered Phone</p>
// //                   <p className="font-mono font-bold text-white">{registeredData.phone}</p>
// //                 </div>
// //               </div>

// //               <div className="flex items-start gap-3">
// //                 <div className="bg-white/20 p-2 rounded-lg">
// //                   <Hotel className="h-5 w-5 text-white" />
// //                 </div>
// //                 <div className="flex-1">
// //                   <p className="text-sm text-white/70">Plan</p>
// //                   <p className="font-bold text-white">
// //                     {registeredData.plan === 'pro' ? (
// //                       <span className="inline-flex items-center gap-1">
// //                         ⭐ PRO Plan (30-day FREE trial)
// //                       </span>
// //                     ) : (
// //                       <span className="inline-flex items-center gap-1">
// //                         🆓 BASIC Plan (Lifetime Free)
// //                       </span>
// //                     )}
// //                   </p>
// //                 </div>
// //               </div>
// //             </div>

// //             {registeredData.plan === 'pro' && (
// //               <Alert className="mt-4 bg-yellow-400/20 border-yellow-400/30 text-white">
// //                 <Calendar className="h-4 w-4" />
// //                 <AlertDescription>
// //                   Your 30-day FREE trial starts now. After trial ends, subscription is ₹999/6 months.
// //                 </AlertDescription>
// //               </Alert>
// //             )}
// //           </div>

// //           {/* Important Note */}
// //           <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 mb-6 text-sm text-white/90 border border-white/10">
// //             <p className="font-semibold mb-2 flex items-center gap-2">
// //               <ShieldCheck className="h-4 w-4" />
// //               Important:
// //             </p>
// //             <ul className="list-disc list-inside space-y-1 text-white/80">
// //               <li>Save your password - you won't see it again</li>
// //               <li>You can change password after login in Settings</li>
// //               <li>Use your username and password to login</li>
// //             </ul>
// //           </div>

// //           {/* Action Buttons */}
// //           <div className="flex flex-col gap-3">
// //             <Button
// //               size="lg"
// //               className="w-full bg-white text-emerald-700 hover:bg-white/90 font-bold text-lg py-6 shadow-xl transform transition-all hover:scale-105"
// //               onClick={handleProceedToLogin}
// //             >
// //               <LogIn className="h-5 w-5 mr-2" />
// //               Proceed to Login
// //             </Button>

// //             <Button
// //               variant="outline"
// //               size="lg"
// //               className="w-full border-white/30 text-white hover:bg-white/10 font-medium backdrop-blur-sm"
// //               onClick={() => {
// //                 setShowWelcomeScreen(false);
// //                 onClose();
// //               }}
// //             >
// //               Close
// //             </Button>
// //           </div>
// //         </div>
// //       </div>
// //     </DialogContent>
// //   );

// //   return (
// //     <>
// //       {/* Registration Modal */}
// //       <Dialog open={open && !showWelcomeScreen} onOpenChange={onClose}>
// //         <DialogContent className="max-w-[95vw] mx-auto sm:max-w-6xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
// //           <DialogHeader className="px-0 sm:px-2">
// //             <DialogTitle className="text-lg sm:text-xl">Register New Hotel</DialogTitle>
// //             <DialogDescription className="text-sm sm:text-base">
// //               Choose your plan and fill in details
// //             </DialogDescription>
// //           </DialogHeader>

// //           <form onSubmit={handleSubmit} className="space-y-4">
// //             {/* Plan Selection Header - With Try Demo Button */}
// //             <div className="space-y-2">
// //               <div className="flex items-center justify-between">
// //                 <Label className="text-base sm:text-lg font-semibold">Choose Your Plan</Label>
// //                 {onTryDemo && (
// //                   <Button
// //                     type="button"
// //                     size="lg"
// //                     className="animate-fast-pulse bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 font-bold shadow-lg px-4 py-5 sm:px-6 sm:py-5 text-sm sm:text-base rounded-xl transition-all"
// //                     onClick={(e) => {
// //                       e.preventDefault();
// //                       onClose();
// //                       onTryDemo();
// //                     }}
// //                   >
// //                     ✨ Try Demo
// //                   </Button>
// //                 )}
// //               </div>

// //               <Tabs
// //                 value={formData.plan}
// //                 onValueChange={handlePlanChange}
// //                 className="w-full"
// //               >
// //                 <TabsList className="grid w-full grid-cols-3 mb-4 h-16 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
// //                   <TabsTrigger
// //                     value="pro"
// //                     className="rounded-lg h-full data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center justify-center gap-1.5 font-bold text-[10px] sm:text-sm text-slate-600 data-[state=active]:text-blue-600 transition-all duration-200"
// //                   >
// //                     <Star className="h-3.5 w-3.5 fill-current" /> PRO
// //                   </TabsTrigger>
// //                   <TabsTrigger
// //                     value="free"
// //                     className="rounded-lg h-full data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center justify-center gap-1.5 font-bold text-[10px] sm:text-sm text-slate-600 data-[state=active]:text-emerald-600 transition-all duration-200"
// //                   >
// //                     <span className="text-xs sm:text-sm">🆓</span> BASIC
// //                   </TabsTrigger>
// //                   <TabsTrigger
// //                     value="enterprise"
// //                     className="rounded-lg h-full data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center justify-center gap-1.5 font-bold text-[10px] sm:text-sm text-slate-600 data-[state=active]:text-purple-600 transition-all duration-200"
// //                   >
// //                     <span className="text-xs sm:text-sm">🏢</span> ENTERPRISE
// //                   </TabsTrigger>
// //                 </TabsList>

// //                 {plans.map((plan) => (
// //                   <TabsContent key={plan.id} value={plan.id} className="mt-0">
// //                     <div className="relative max-w-xl mx-auto">
// //                       {plan.id === "pro" && (
// //                         <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
// //                           <Badge className="bg-green-600 text-white text-[10px] sm:text-xs shadow-sm ring-2 ring-background px-3 py-0.5 uppercase tracking-wider">
// //                             ⭐ Most Popular
// //                           </Badge>
// //                         </div>
// //                       )}
// //                       {!plan.available && (
// //                         <div className="absolute -top-3 right-4 z-10">
// //                           <Badge className="bg-amber-500 text-white text-[10px] sm:text-xs shadow-sm ring-2 ring-background">Upcoming</Badge>
// //                         </div>
// //                       )}

// //                       <div
// //                         className={`flex flex-col rounded-xl border-2 ${plan.color} bg-card p-4 sm:p-5 transition-all ring-2 ring-primary ring-offset-1 sm:ring-offset-2 shadow-lg ${!plan.available ? 'opacity-70' : ''}`}
// //                       >
// //                         <div className="flex-grow">
// //                           <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-3 border-b pb-3">
// //                             <div className="text-center sm:text-left min-w-0">
// //                               <div className="flex justify-center sm:justify-start items-center gap-2 mb-1">
// //                                 <span className="text-2xl sm:text-3xl shrink-0">{plan.icon}</span>
// //                                 <h3 className="font-bold text-lg sm:text-2xl truncate uppercase tracking-wide">{plan.name}</h3>
// //                               </div>
// //                               <p className="text-sm text-muted-foreground truncate">{plan.subtitle}</p>
// //                             </div>
// //                             <Badge
// //                               variant={plan.buttonVariant}
// //                               className={`text-xs sm:text-sm whitespace-nowrap border-none shrink-0 py-1.5 px-4 rounded-full ${plan.id === 'free' ? 'bg-secondary text-secondary-foreground' : 'bg-cyan-500 text-white hover:bg-cyan-600'
// //                                 }`}
// //                             >
// //                               {plan.price}
// //                             </Badge>
// //                           </div>

// //                           <div className="text-sm space-y-3 mb-2">
// //                             <div className="flex flex-col space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
// //                               <div className="flex items-center text-sm font-medium">
// //                                 <span className="text-green-600 mr-2 bg-green-100 p-0.5 rounded-full">✓</span>
// //                                 <span>
// //                                   {plan.id === "free" ? "5,000 records" :
// //                                     plan.id === "pro" ? "50,000 records" :
// //                                       "Unlimited records"}
// //                                 </span>
// //                               </div>
// //                               {plan.id === "pro" && (
// //                                 <div className="space-y-3">
// //                                   <div className="flex items-center text-sm font-medium">
// //                                     <Calendar className="h-4 w-4 mr-2 text-blue-600 bg-blue-100 p-0.5 rounded-sm" />
// //                                     <span>30-day FREE trial</span>
// //                                   </div>
// //                                   <div className="flex items-center text-sm font-medium">
// //                                     <Phone className="h-4 w-4 mr-2 text-blue-600 bg-blue-100 p-0.5 rounded-sm" />
// //                                     <span>Phone verification required</span>
// //                                   </div>
// //                                 </div>
// //                               )}
// //                             </div>

// //                             <div className="mt-4 pt-4 border-t border-dashed">
// //                               {/* Shiny Badges */}
// //                               <div className="text-center mb-4">
// //                                 <div className="inline-block transform transition-all hover:scale-105">
// //                                   {plan.id === "free" ?
// //                                     <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg px-4 py-2 shadow-sm">
// //                                       <span className="text-sm sm:text-base font-bold text-blue-700 tracking-wide uppercase">
// //                                         ✨ Life Time Free ✨
// //                                       </span>
// //                                     </div> :
// //                                     plan.id === "pro" ?
// //                                       <div className="bg-gradient-to-r from-amber-50 to-orange-100 border border-amber-200 rounded-lg px-4 py-2 shadow-sm">
// //                                         <span className="text-sm sm:text-base font-bold text-amber-700 tracking-wide uppercase">
// //                                           ✨ 30 Days FREE ✨
// //                                         </span>
// //                                       </div> :
// //                                       <div className="bg-gradient-to-r from-purple-50 to-pink-100 border border-purple-200 rounded-lg px-4 py-2 shadow-sm">
// //                                         <span className="text-sm sm:text-base font-bold text-purple-700 tracking-wide uppercase">
// //                                           ✨ Contact Pricing ✨
// //                                         </span>
// //                                       </div>
// //                                   }
// //                                 </div>
// //                               </div>

// //                               {/* Actions Group (Know More) */}
// //                               <div className="flex flex-col sm:flex-row gap-3">
// //                                 <Button
// //                                   type="button"
// //                                   variant="outline"
// //                                   size="sm"
// //                                   className="flex-1 text-slate-700 hover:text-slate-900 font-medium py-4 flex items-center justify-center gap-2 rounded-lg"
// //                                   onClick={(e) => {
// //                                     e.preventDefault();
// //                                     setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id);
// //                                   }}
// //                                 >
// //                                   {expandedPlanId === plan.id ? (
// //                                     <>Show Less <ChevronUp className="h-4 w-4" /></>
// //                                   ) : (
// //                                     <>🔍 Know More <ChevronDown className="h-4 w-4" /></>
// //                                   )}
// //                                 </Button>
// //                               </div>

// //                               {/* Expanded Features List */}
// //                               <div
// //                                 className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedPlanId === plan.id ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
// //                               >
// //                                 <div className="bg-[#f8f9fa] rounded-xl p-4 sm:p-5 border border-slate-200 space-y-3">
// //                                   {(detailedFeatures as any)[plan.id].map((feature: { text: string, included: boolean }, idx: number) => (
// //                                     <div key={idx} className={`flex items-start gap-3 text-xs sm:text-sm font-medium ${feature.included ? 'text-slate-800' : 'text-slate-400'}`}>
// //                                       {feature.included ? (
// //                                         <div className="bg-green-100 p-0.5 rounded-full mt-0.5 shrink-0">
// //                                           <Check className="h-3 w-3 text-green-700" />
// //                                         </div>
// //                                       ) : (
// //                                         <div className="bg-slate-100 p-0.5 rounded-full mt-0.5 shrink-0">
// //                                           <X className="h-3 w-3 text-slate-400" />
// //                                         </div>
// //                                       )}
// //                                       <span className="leading-snug">{feature.text}</span>
// //                                     </div>
// //                                   ))}
// //                                 </div>
// //                               </div>
// //                             </div>
// //                           </div>
// //                         </div>
// //                       </div>
// //                     </div>
// //                   </TabsContent>
// //                 ))}
// //               </Tabs>
// //             </div>

// //             {/* Hotel Details - Only Username and Phone fields shown */}
// //             {isAvailablePlan && showForm && (
// //               <div className="space-y-4 pt-4 border-t border-dashed mt-4">
// //                 <Label className="text-base sm:text-lg font-semibold">Registration Details</Label>

// //                 {/* Phone Verification Status for FREE Plan */}
// //                 {formData.plan === "free" && otpData.isPhoneVerified && (
// //                   <Alert className="bg-green-50 border-green-200 text-xs sm:text-sm">
// //                     <div className="flex items-center gap-2">
// //                       <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
// //                       <AlertDescription className="text-green-800">
// //                         <strong>Phone Verified!</strong> Your phone {formatIndianPhone(formData.phone)} is verified.
// //                       </AlertDescription>
// //                     </div>
// //                   </Alert>
// //                 )}

// //                 {/* Phone Verification Status for PRO Plan */}
// //                 {formData.plan === "pro" && phoneOTPVerified && (
// //                   <Alert className="bg-green-50 border-green-200 text-xs sm:text-sm">
// //                     <div className="flex items-center gap-2">
// //                       <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
// //                       <AlertDescription className="text-green-800">
// //                         <strong>Phone Verified!</strong> Your phone {formatIndianPhone(formData.phone)} is verified for PRO plan.
// //                       </AlertDescription>
// //                     </div>
// //                   </Alert>
// //                 )}

// //                 {/* Hotel Details Form - Only Username and Phone */}
// //                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
// //                   {[
// //                     { id: "username", label: "Username *", placeholder: "Choose username" },
// //                     {
// //                       id: "phone",
// //                       label: "Phone *",
// //                       type: "tel",
// //                       placeholder: "9876543210",
// //                       disabled: (formData.plan === "free" && otpData.isPhoneVerified) || 
// //                                (formData.plan === "pro" && phoneOTPVerified)
// //                     },
// //                   ].map((f) => (
// //                     <div key={f.id} className="space-y-1 sm:space-y-2">
// //                       <Label htmlFor={f.id} className="text-xs sm:text-sm">
// //                         {f.label}
// //                         {f.id === "phone" && formData.plan === "free" && otpData.isPhoneVerified && (
// //                           <CheckCircle className="h-3 w-3 text-green-500 inline ml-1" />
// //                         )}
// //                         {f.id === "phone" && formData.plan === "pro" && phoneOTPVerified && (
// //                           <CheckCircle className="h-3 w-3 text-green-500 inline ml-1" />
// //                         )}
// //                       </Label>
// //                       <Input
// //                         id={f.id}
// //                         type={f.type || "text"}
// //                         value={(formData as any)[f.id]}
// //                         onChange={(e) => handleChange(f.id, e.target.value)}
// //                         placeholder={f.placeholder}
// //                         required
// //                         disabled={f.disabled || false}
// //                         className="text-sm sm:text-base"
// //                       />
// //                     </div>
// //                   ))}
// //                 </div>

// //                 {/* Phone OTP Input Section for PRO Plan */}
// //                 {formData.plan === "pro" && showPhoneOTPInput && !phoneOTPVerified && (
// //                   <div className="space-y-4 border rounded-lg p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-pink-50">
// //                     <div className="flex items-center gap-3">
// //                       <div className="p-2 bg-purple-100 rounded-lg">
// //                         <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
// //                       </div>
// //                       <div>
// //                         <h3 className="font-semibold text-base sm:text-lg">Verify Your Phone for PRO Plan</h3>
// //                         <p className="text-xs sm:text-sm text-muted-foreground">
// //                           OTP sent to <strong>{formatIndianPhone(formData.phone)}</strong>
// //                         </p>
// //                       </div>
// //                     </div>

// //                     <Alert className="bg-amber-50 border-amber-200 text-xs sm:text-sm">
// //                       <AlertDescription className="text-amber-800">
// //                         <div className="flex items-start gap-2">
// //                           <ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" />
// //                           <div>
// //                             <strong>PRO Plan Trial:</strong> You'll get 30 days FREE trial.
// //                           </div>
// //                         </div>
// //                       </AlertDescription>
// //                     </Alert>

// //                     <div className="space-y-3">
// //                       <Label htmlFor="phone-otp" className="text-sm sm:text-base">
// //                         Enter 6-digit OTP
// //                       </Label>
// //                       <div className="flex gap-2">
// //                         <div className="flex-1">
// //                           <Input
// //                             id="phone-otp"
// //                             type="text"
// //                             inputMode="numeric"
// //                             pattern="\d*"
// //                             maxLength={6}
// //                             value={phoneOTP}
// //                             onChange={(e) => handlePhoneOtpChange(e.target.value)}
// //                             placeholder="000000"
// //                             className="text-center text-xl sm:text-2xl font-mono tracking-widest h-12 sm:h-14"
// //                             autoFocus
// //                           />
// //                         </div>
// //                         <Button
// //                           type="button"
// //                           onClick={handleVerifyPhoneOTP}
// //                           disabled={phoneOTP.length !== 6 || isVerifyingPhoneOTP}
// //                           className="bg-green-600 hover:bg-green-700"
// //                         >
// //                           {isVerifyingPhoneOTP ? (
// //                             <Loader2 className="h-4 w-4 animate-spin" />
// //                           ) : (
// //                             "Verify"
// //                           )}
// //                         </Button>
// //                       </div>

// //                       <div className="flex justify-center pt-2">
// //                         <Button
// //                           type="button"
// //                           variant="outline"
// //                           size="sm"
// //                           onClick={() => {
// //                             setShowPhoneOTPInput(false);
// //                             setPhoneOTP("");
// //                           }}
// //                           className="text-xs sm:text-sm"
// //                         >
// //                           <ArrowLeft className="h-3 w-3 mr-1" />
// //                           Back to Form
// //                         </Button>
// //                       </div>
// //                     </div>
// //                   </div>
// //                 )}

// //                 {/* SMS OTP Input Section for FREE Plan */}
// //                 {formData.plan === "free" && otpData.otpSent && !otpData.isPhoneVerified && (
// //                   <div className="space-y-4 border rounded-lg p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
// //                     <div className="flex items-center gap-3">
// //                       <div className="p-2 bg-blue-100 rounded-lg">
// //                         <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
// //                       </div>
// //                       <div>
// //                         <h3 className="font-semibold text-base sm:text-lg">Verify Your Phone</h3>
// //                         <p className="text-xs sm:text-sm text-muted-foreground">
// //                           OTP sent to <strong>{formatIndianPhone(formData.phone)}</strong>
// //                         </p>
// //                       </div>
// //                     </div>

// //                     <Alert className="bg-amber-50 border-amber-200 text-xs sm:text-sm">
// //                       <AlertDescription className="text-amber-800">
// //                         <div className="flex items-start gap-2">
// //                           <ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" />
// //                           <div>
// //                             <strong>Security Notice:</strong> OTP valid for 5 minutes.
// //                           </div>
// //                         </div>
// //                       </AlertDescription>
// //                     </Alert>

// //                     <div className="space-y-3">
// //                       <Label htmlFor="otp" className="text-sm sm:text-base">
// //                         Enter 6-digit OTP
// //                       </Label>
// //                       <div className="flex gap-2">
// //                         <div className="flex-1">
// //                           <Input
// //                             id="otp"
// //                             type="text"
// //                             inputMode="numeric"
// //                             pattern="\d*"
// //                             maxLength={6}
// //                             value={otpData.otp}
// //                             onChange={(e) => handleOtpChange(e.target.value)}
// //                             placeholder="000000"
// //                             className="text-center text-xl sm:text-2xl font-mono tracking-widest h-12 sm:h-14"
// //                             autoFocus
// //                           />
// //                           <div className="flex justify-between items-center mt-2">
// //                             <span className="text-xs sm:text-sm text-muted-foreground">
// //                               {otpData.otpCountdown > 0 ? (
// //                                 <span className="text-amber-600">
// //                                   Expires in {formatCountdown(otpData.otpCountdown)}
// //                                 </span>
// //                               ) : (
// //                                 <span className="text-red-600">OTP expired</span>
// //                               )}
// //                             </span>
// //                             <Button
// //                               type="button"
// //                               variant="link"
// //                               size="sm"
// //                               onClick={handleSendOTP}
// //                               disabled={isSendingOtp || otpData.otpCountdown > 0 || otpData.otpResendCount >= otpData.maxOtpResends}
// //                               className="h-auto p-0 text-xs sm:text-sm"
// //                             >
// //                               {isSendingOtp ? (
// //                                 <>
// //                                   <Loader2 className="h-3 w-3 mr-1 animate-spin" />
// //                                   Sending...
// //                                 </>
// //                               ) : (
// //                                 <>
// //                                   <RefreshCw className="h-3 w-3 mr-1" />
// //                                   Resend
// //                                 </>
// //                               )}
// //                             </Button>
// //                           </div>
// //                         </div>
// //                         <Button
// //                           type="button"
// //                           onClick={handleVerifyOTP}
// //                           disabled={otpData.otp.length !== 6 || isVerifyingOtp}
// //                           className="bg-green-600 hover:bg-green-700"
// //                         >
// //                           {isVerifyingOtp ? (
// //                             <Loader2 className="h-4 w-4 animate-spin" />
// //                           ) : (
// //                             "Verify"
// //                           )}
// //                         </Button>
// //                       </div>

// //                       <div className="flex justify-center pt-2">
// //                         <Button
// //                           type="button"
// //                           variant="outline"
// //                           size="sm"
// //                           onClick={() => {
// //                             setOtpData(prev => ({
// //                               ...prev,
// //                               otpSent: false,
// //                               otp: "",
// //                               otpCountdown: 0
// //                             }));
// //                           }}
// //                           className="text-xs sm:text-sm"
// //                         >
// //                           <ArrowLeft className="h-3 w-3 mr-1" />
// //                           Back to Form
// //                         </Button>
// //                       </div>
// //                     </div>
// //                   </div>
// //                 )}
// //               </div>
// //             )}

// //             {/* Action Buttons */}
// //             {showForm && (
// //               <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t">
// //                 <Button
// //                   type="button"
// //                   variant="outline"
// //                   onClick={() => {
// //                     onClose();
// //                   }}
// //                   disabled={isSubmitting || isSendingOtp || isVerifyingOtp || isSendingPhoneOTP || isVerifyingPhoneOTP}
// //                   className="w-full sm:w-auto text-sm sm:text-base"
// //                 >
// //                   Cancel
// //                 </Button>
// //                 <Button
// //                   type="submit"
// //                   disabled={isSubmitDisabled()}
// //                   className={`w-full sm:w-auto text-sm sm:text-base min-w-32 ${!isAvailablePlan ? 'bg-amber-500 hover:bg-amber-600' :
// //                     formData.plan === 'pro' ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : ''
// //                     }`}
// //                 >
// //                   {getButtonText()}
// //                 </Button>
// //               </div>
// //             )}

// //             {/* Plan Summary */}
// //             {showForm && (
// //               <div className={`text-xs sm:text-sm text-center p-2 sm:p-3 rounded ${formData.plan === 'enterprise'
// //                 ? 'bg-amber-50 border border-amber-200 text-amber-800'
// //                 : formData.plan === 'pro'
// //                   ? 'bg-blue-50 border border-blue-200 text-blue-800'
// //                   : 'bg-gray-50 border border-gray-200 text-gray-800'
// //                 }`}>
// //                 {formData.plan === 'enterprise' ? (
// //                   <div className="space-y-1">
// //                     <div className="font-semibold">ENTERPRISE Plan - Coming Soon!</div>
// //                     <div>Contact sales: <span className="font-medium">sales@hotelmanagementsystem.com</span></div>
// //                   </div>
// //                 ) : formData.plan === 'pro' ? (
// //                   <div className="space-y-1">
// //                     <div className="font-semibold">PRO Plan - 30 Day FREE Trial</div>
// //                     <div>Phone verification required. Password is your phone number.</div>
// //                     {phoneOTPVerified && (
// //                       <div className="text-green-600 font-medium">
// //                         ✓ Phone verified
// //                       </div>
// //                     )}
// //                   </div>
// //                 ) : (
// //                   <div className="space-y-1">
// //                     <div className="font-semibold">
// //                       BASIC Plan - Lifetime Free
// //                       {otpData.isPhoneVerified && (
// //                         <CheckCircle className="h-3 w-3 text-green-500 inline ml-1" />
// //                       )}
// //                     </div>
// //                     <div>Perfect for small hotels. Password is your phone number.</div>
// //                   </div>
// //                 )}
// //               </div>
// //             )}
// //           </form>
// //         </DialogContent>
// //       </Dialog>

// //       {/* Welcome Screen Modal */}
// //       <Dialog open={showWelcomeScreen} onOpenChange={() => setShowWelcomeScreen(false)}>
// //         <WelcomeScreen />
// //       </Dialog>
// //     </>
// //   );
// // };

// // export default RegisterModal;

// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import { Badge } from "@/components/ui/badge";
// import { useToast } from "@/hooks/use-toast";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import {
//   Loader2,
//   ShieldCheck,
//   RefreshCw,
//   CheckCircle,
//   ArrowLeft,
//   Phone,
//   Mail,
//   Calendar,
//   Clock,
//   Check,
//   ChevronDown,
//   ChevronUp,
//   X,
//   Star,
//   Hotel,
//   User,
//   Key,
//   LogIn,
//   Copy,
//   CheckCheck,
//   PartyPopper,
//   AlertCircle,
//   AlertTriangle
// } from "lucide-react";

// interface RegisterModalProps {
//   open: boolean;
//   onClose: () => void;
//   onTryDemo?: () => void;
// }

// // Google Apps Script URL for FREE plan
// const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwA1sC2rREM50Ri9p0r-tWy3Jz-RSe39N9iu90qiRopKUvJ17fxYptB4yhbfQOBM62z/exec";

// // Node.js backend URL
// const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// const RegisterModal = ({ open, onClose, onTryDemo }: RegisterModalProps) => {
//   const navigate = useNavigate();
//   const { toast } = useToast();

//   // Form data state
//   const [formData, setFormData] = useState({
//     adminName: "",
//     username: "",
//     password: "",
//     hotelName: "",
//     email: "",
//     phone: "",
//     address: "",
//     gstNumber: "",
//     plan: "pro", // Default to PRO plan
//   });

//   // SMS OTP states for FREE plan
//   const [otpData, setOtpData] = useState({
//     otp: "",
//     isPhoneVerified: false,
//     otpSent: false,
//     otpCountdown: 0,
//     otpResendCount: 0,
//     maxOtpResends: 3,
//   });

//   // Phone OTP states for PRO plan
//   const [phoneOTP, setPhoneOTP] = useState("");
//   const [phoneOTPVerified, setPhoneOTPVerified] = useState(false);
//   const [showPhoneOTPInput, setShowPhoneOTPInput] = useState(false);
//   const [showForm, setShowForm] = useState(true);

//   // Loading states
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isSendingOtp, setIsSendingOtp] = useState(false);
//   const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
//   const [isSendingPhoneOTP, setIsSendingPhoneOTP] = useState(false);
//   const [isVerifyingPhoneOTP, setIsVerifyingPhoneOTP] = useState(false);
//   const [showOtpInput, setShowOtpInput] = useState(false);

//   const [referralCode, setReferralCode] = useState('');
//   const [referralValidating, setReferralValidating] = useState(false);
//   const [referralValid, setReferralValid] = useState(false);
//   const [referralDetails, setReferralDetails] = useState<any>(null);
//   const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

//   // Add state for welcome screen
//   const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);
//   const [registeredData, setRegisteredData] = useState({
//     hotelName: "",
//     username: "",
//     password: "",
//     phone: "",
//     plan: ""
//   });
//   const [passwordCopied, setPasswordCopied] = useState(false);

//   // Add state for checking duplicates
//   const [checkingDuplicate, setCheckingDuplicate] = useState(false);
//   const [isDuplicateChecked, setIsDuplicateChecked] = useState(false);
//   const [isDuplicateValid, setIsDuplicateValid] = useState(false);

//   // Add state for duplicate warning popup
//   const [showDuplicatePopup, setShowDuplicatePopup] = useState(false);

//   // OTP Countdown Timer for SMS
//   useEffect(() => {
//     let interval: NodeJS.Timeout;
//     if (otpData.otpCountdown > 0) {
//       interval = setInterval(() => {
//         setOtpData(prev => ({
//           ...prev,
//           otpCountdown: prev.otpCountdown - 1
//         }));
//       }, 1000);
//     }
//     return () => {
//       if (interval) clearInterval(interval);
//     };
//   }, [otpData.otpCountdown]);

//   // Auto-check duplicate when both username and phone are filled
//   useEffect(() => {
//     const checkDuplicateAutomatically = async () => {
//       if (formData.username && formData.phone && formData.username.length >= 3 && formData.phone.replace(/\D/g, '').length === 10) {
//         await checkDuplicateUser(formData.username, formData.phone);
//       } else {
//         setIsDuplicateChecked(false);
//         setIsDuplicateValid(false);
//       }
//     };

//     // Debounce the check to avoid too many API calls
//     const timeoutId = setTimeout(() => {
//       checkDuplicateAutomatically();
//     }, 500);

//     return () => clearTimeout(timeoutId);
//   }, [formData.username, formData.phone]);

//   // Helper functions
//   const formatIndianPhone = (phone: string) => {
//     const clean = phone.replace(/\D/g, '');
//     if (clean.length === 10) {
//       return `+91 ${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
//     }
//     return phone;
//   };

//   const formatCountdown = (seconds: number) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins}:${secs.toString().padStart(2, '0')}`;
//   };

//   // Form change handlers
//   const handleChange = (field: string, value: string) => {
//     setFormData((prev) => ({ ...prev, [field]: value }));

//     // Reset verification states when phone changes
//     if (field === "phone") {
//       setOtpData(prev => ({
//         ...prev,
//         isPhoneVerified: false,
//         otpSent: false,
//         otp: ""
//       }));
//       setShowOtpInput(false);

//       setPhoneOTPVerified(false);
//       setShowPhoneOTPInput(false);
//       setPhoneOTP("");
//     }

//     // Reset duplicate check state when fields change
//     if (field === "username" || field === "phone") {
//       setIsDuplicateChecked(false);
//       setIsDuplicateValid(false);
//     }
//   };

//   const handleOtpChange = (value: string) => {
//     const numericValue = value.replace(/\D/g, '').slice(0, 6);
//     setOtpData(prev => ({ ...prev, otp: numericValue }));
//   };

//   const handlePhoneOtpChange = (value: string) => {
//     const numericValue = value.replace(/\D/g, '').slice(0, 6);
//     setPhoneOTP(numericValue);
//   };

//   // Plan change handler
//   const handlePlanChange = (value: string) => {
//     handleChange("plan", value);

//     if (value === "free") {
//       setPhoneOTPVerified(false);
//       setShowPhoneOTPInput(false);
//       setPhoneOTP("");
//     } else if (value === "pro") {
//       setOtpData({
//         otp: "",
//         isPhoneVerified: false,
//         otpSent: false,
//         otpCountdown: 0,
//         otpResendCount: 0,
//         maxOtpResends: 3,
//       });
//       setShowOtpInput(false);
//     }
//   };

//   const validateReferralCode = async () => {
//     if (!referralCode.trim()) {
//       setReferralValid(false);
//       return;
//     }

//     setReferralValidating(true);
//     try {
//       const response = await fetch(`${NODE_BACKEND_URL}/wallet/referral/validate/${referralCode}`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });

//       if (response.ok) {
//         const data = await response.json();
//         if (data.success) {
//           setReferralValid(true);
//           setReferralDetails(data.data);
//           toast({
//             title: 'Referral Code Valid!',
//             description: `You'll earn benefits from ${data.data.referrer_name}`,
//             variant: 'default',
//           });
//         } else {
//           setReferralValid(false);
//           toast({
//             title: 'Invalid Code',
//             description: 'Please enter a valid referral code',
//             variant: 'destructive',
//           });
//         }
//       } else {
//         setReferralValid(false);
//         toast({
//           title: 'Error',
//           description: 'Failed to validate referral code',
//           variant: 'destructive',
//         });
//       }
//     } catch (error) {
//       setReferralValid(false);
//       toast({
//         title: 'Error',
//         description: 'Network error. Please try again.',
//         variant: 'destructive',
//       });
//     } finally {
//       setReferralValidating(false);
//     }
//   };

//   // JSONP function for Google Apps Script (FREE plan)
//   function jsonpRequest(url: string): Promise<any> {
//     return new Promise((resolve, reject) => {
//       const callbackName = "cb_" + Date.now();
//       (window as any)[callbackName] = (data: any) => {
//         resolve(data);
//         delete (window as any)[callbackName];
//         script.remove();
//       };
//       const script = document.createElement("script");
//       script.src = url + (url.includes("?") ? "&" : "?") + "callback=" + callbackName;
//       script.onerror = () => {
//         reject(new Error("Failed to load script"));
//         delete (window as any)[callbackName];
//         script.remove();
//       };
//       document.body.appendChild(script);
//     });
//   }

//   // Fetch function for Node.js backend
//   async function fetchBackendRequest(endpoint: string, data: any): Promise<any> {
//     console.log("📤 Sending to backend:", {
//       endpoint: `${NODE_BACKEND_URL}${endpoint}`,
//       data: { ...data, admin: { ...data.admin, password: '[HIDDEN]' } }
//     });

//     const response = await fetch(`${NODE_BACKEND_URL}${endpoint}`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(data),
//     });

//     const responseText = await response.text();
//     console.log("📥 Backend response:", {
//       status: response.status,
//       statusText: response.statusText,
//       body: responseText
//     });

//     if (!response.ok) {
//       let errorMessage = `HTTP error! status: ${response.status}`;
//       try {
//         const errorData = JSON.parse(responseText);
//         errorMessage = errorData.message || errorData.error || errorMessage;
//       } catch (e) {
//         errorMessage = responseText || errorMessage;
//       }
//       throw new Error(errorMessage);
//     }

//     try {
//       return JSON.parse(responseText);
//     } catch (e) {
//       throw new Error('Invalid JSON response from server');
//     }
//   }

//   const encodeValue = (val: unknown) =>
//     typeof val === "string" || typeof val === "number" || typeof val === "boolean"
//       ? encodeURIComponent(val.toString())
//       : "";

//   const buildQueryString = (params: Record<string, unknown>): string =>
//     Object.entries(params)
//       .map(([key, val]) => {
//         if (typeof val === "object" && val !== null) {
//           return Object.entries(val as Record<string, unknown>)
//             .map(
//               ([subKey, subVal]) =>
//                 encodeURIComponent(`${key}[${subKey}]`) + "=" + encodeValue(subVal)
//             )
//             .join("&");
//         }
//         return encodeURIComponent(key) + "=" + encodeValue(val);
//       })
//       .join("&");

//   // SMS OTP functions for FREE plan
//   async function generateSMSOTP(phone: string, email: string, hotelName: string, username: string): Promise<any> {
//     const paramObj = {
//       action: "generateOTP",
//       phone: phone,
//       email: email,
//       hotelName: hotelName,
//       username: username
//     };

//     const queryString = buildQueryString(paramObj);
//     const url = APPS_SCRIPT_URL + "?" + queryString;

//     console.log("📱 Generating SMS OTP for phone:", phone);
//     return await jsonpRequest(url);
//   }

//   async function verifySMSOTP(phone: string, email: string, otp: string): Promise<any> {
//     const paramObj = {
//       action: "verifyOTP",
//       phone: phone,
//       email: email,
//       otp: otp
//     };

//     const queryString = buildQueryString(paramObj);
//     const url = APPS_SCRIPT_URL + "?" + queryString;

//     console.log("🔐 Verifying SMS OTP for phone:", phone);
//     return await jsonpRequest(url);
//   }

//   // NEW: Function to check if user exists with same username AND phone
// const checkDuplicateUser = async (username: string, phone: string): Promise<boolean> => {
//   try {
//     setCheckingDuplicate(true);

//     // Clean phone number
//     const cleanPhone = phone.replace(/\D/g, '');

//     const response = await fetch(`${NODE_BACKEND_URL}/users/check-duplicate`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         username: username.trim(),
//         phone: cleanPhone
//       }),
//     });

//     // Handle 401 Unauthorized - fallback to letting backend handle it
//     if (response.status === 401) {
//       console.log("⚠️ Duplicate check endpoint requires authentication, falling back to backend validation");
//       setIsDuplicateChecked(true);
//       setIsDuplicateValid(true); // Allow registration, backend will handle duplicates
//       return false;
//     }

//     const data = await response.json();

//     const isDuplicate = data.success && data.exists;

//     setIsDuplicateChecked(true);
//     setIsDuplicateValid(!isDuplicate);

//     if (isDuplicate) {
//       setShowDuplicatePopup(true);
//     }

//     return isDuplicate;
//   } catch (error) {
//     console.error("Error checking duplicate user:", error);
//     setIsDuplicateChecked(true);
//     setIsDuplicateValid(true); // Allow registration if check fails
//     return false;
//   } finally {
//     setCheckingDuplicate(false);
//   }
// };

//   // Send SMS OTP for FREE plan
//   const handleSendOTP = async () => {
//     if (!formData.phone) {
//       toast({
//         title: "Phone Number Required",
//         description: "Please enter your phone number to receive SMS OTP",
//         variant: "destructive",
//       });
//       return;
//     }

//     const phoneRegex = /^[6-9]\d{9}$/;
//     const cleanPhone = formData.phone.replace(/\D/g, '');

//     if (!phoneRegex.test(cleanPhone)) {
//       toast({
//         title: "Invalid Phone Number",
//         description: "Please enter a valid 10-digit Indian mobile number",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (otpData.otpResendCount >= otpData.maxOtpResends) {
//       toast({
//         title: "Resend Limit Reached",
//         description: "You have reached the maximum OTP resend attempts. Please try again later.",
//         variant: "destructive",
//       });
//       return;
//     }

//     setIsSendingOtp(true);
//     try {
//       const response = await generateSMSOTP(
//         cleanPhone,
//         formData.email || `${formData.username}@temp.com`,
//         formData.hotelName || `${formData.username} Hotel`,
//         formData.username
//       );

//       if (response.success) {
//         setOtpData(prev => ({
//           ...prev,
//           otpSent: true,
//           otpCountdown: 300,
//           otpResendCount: prev.otpResendCount + 1,
//           isPhoneVerified: false
//         }));

//         setShowOtpInput(true);

//         toast({
//           title: "OTP Sent Successfully! 📱",
//           description: `We've sent a 6-digit OTP to ${formatIndianPhone(formData.phone)}`,
//           variant: "default",
//         });
//       } else {
//         throw new Error(response.message || "Failed to send OTP");
//       }
//     } catch (error: any) {
//       console.error("OTP send error:", error);

//       let errorMessage = "Failed to send OTP. Please try again.";
//       if (error.message.includes("OTP_GENERATION_FAILED")) {
//         errorMessage = "Unable to send SMS OTP. Please check your phone number.";
//       } else if (error.message.includes("INVALID_PHONE")) {
//         errorMessage = "Invalid phone number. Please enter a valid 10-digit Indian number.";
//       }

//       toast({
//         title: "SMS OTP Send Failed",
//         description: errorMessage,
//         variant: "destructive",
//       });
//     } finally {
//       setIsSendingOtp(false);
//     }
//   };

//   // Verify SMS OTP for FREE plan
//   const handleVerifyOTP = async () => {
//     if (!otpData.otp || otpData.otp.length !== 6) {
//       toast({
//         title: "Invalid OTP",
//         description: "Please enter a valid 6-digit OTP",
//         variant: "destructive",
//       });
//       return;
//     }

//     const cleanPhone = formData.phone.replace(/\D/g, '');
//     const autoEmail = formData.email || `${formData.username}@temp.com`;

//     setIsVerifyingOtp(true);
//     try {
//       const response = await verifySMSOTP(cleanPhone, autoEmail, otpData.otp);

//       if (response.success) {
//         setOtpData(prev => ({
//           ...prev,
//           isPhoneVerified: true
//         }));

//         setShowOtpInput(false);

//         toast({
//           title: "Phone Verified Successfully! ✅",
//           description: "Your phone number has been verified. You can now proceed with registration.",
//           variant: "default",
//         });
//       } else {
//         if (response.error === "INVALID_OTP") {
//           toast({
//             title: "Invalid OTP",
//             description: response.message || "The OTP you entered is incorrect.",
//             variant: "destructive",
//           });
//         } else if (response.error === "OTP_EXPIRED") {
//           setOtpData(prev => ({
//             ...prev,
//             otpSent: false,
//             otpCountdown: 0
//           }));
//           setShowOtpInput(false);

//           toast({
//             title: "OTP Expired",
//             description: "The OTP has expired. Please request a new one.",
//             variant: "destructive",
//           });
//         } else if (response.error === "MAX_ATTEMPTS") {
//           setOtpData(prev => ({
//             ...prev,
//             otpSent: false,
//             otpCountdown: 0
//           }));
//           setShowOtpInput(false);

//           toast({
//             title: "Maximum Attempts Exceeded",
//             description: "Too many failed attempts. Please request a new OTP.",
//             variant: "destructive",
//           });
//         }
//       }
//     } catch (error: any) {
//       console.error("OTP verification error:", error);

//       toast({
//         title: "Verification Failed",
//         description: "Failed to verify OTP. Please try again.",
//         variant: "destructive",
//       });
//     } finally {
//       setIsVerifyingOtp(false);
//     }
//   };

//   // Send Phone OTP for PRO plan (using WhatsApp)
//   const handleSendPhoneOTP = async () => {
//     if (!formData.phone) {
//       toast({
//         title: "Phone Required",
//         description: "Please enter your phone number to receive OTP",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!formData.username) {
//       toast({
//         title: "Username Required",
//         description: "Please enter your username",
//         variant: "destructive",
//       });
//       return;
//     }

//     const autoEmail = formData.email || `${formData.username.replace(/\s+/g, '')}@hotel.com`;
//     const autoHotelName = formData.hotelName || `${formData.username} Hotel`;
//     const autoAdminName = formData.adminName || formData.username;
//     const cleanPhone = formData.phone ? formData.phone.replace(/\D/g, '') : null;

//     setIsSendingPhoneOTP(true);
//     try {
//       const response = await fetch(`${NODE_BACKEND_URL}/hotels/send-pro-otp-whatsapp`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           email: autoEmail,
//           hotelName: autoHotelName,
//           adminName: autoAdminName,
//           phone: cleanPhone
//         }),
//       });

//       const data = await response.json();

//       if (data.success) {
//         setShowPhoneOTPInput(true);

//         let successMessage = `OTP sent to ${formatIndianPhone(formData.phone)} via WhatsApp`;

//         toast({
//           title: "OTP Sent Successfully! 📱",
//           description: successMessage,
//           variant: "default",
//         });

//         console.log("✅ OTP Delivery Status:", data.data?.delivery);
//       } else {
//         throw new Error(data.message || "Failed to send OTP");
//       }
//     } catch (error: any) {
//       toast({
//         title: "Failed to Send OTP",
//         description: error.message || "Please try again",
//         variant: "destructive",
//       });
//     } finally {
//       setIsSendingPhoneOTP(false);
//     }
//   };

//   // Verify Phone OTP for PRO plan
//   const handleVerifyPhoneOTP = async () => {
//     if (!phoneOTP || phoneOTP.length !== 6) {
//       toast({
//         title: "Invalid OTP",
//         description: "Please enter a valid 6-digit OTP",
//         variant: "destructive",
//       });
//       return;
//     }

//     const autoEmail = formData.email || `${formData.username.replace(/\s+/g, '')}@hotel.com`;

//     setIsVerifyingPhoneOTP(true);
//     try {
//       const response = await fetch(`${NODE_BACKEND_URL}/hotels/verify-email-otp`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           email: autoEmail,
//           otp: phoneOTP
//         }),
//       });

//       const data = await response.json();

//       if (data.success) {
//         setPhoneOTPVerified(true);
//         setShowPhoneOTPInput(false);
//         toast({
//           title: "Phone Verified Successfully! ✅",
//           description: "Your phone has been verified for PRO plan",
//           variant: "default",
//         });
//       } else {
//         throw new Error(data.message || "Invalid OTP");
//       }
//     } catch (error: any) {
//       toast({
//         title: "OTP Verification Failed",
//         description: error.message || "Please try again",
//         variant: "destructive",
//       });
//     } finally {
//       setIsVerifyingPhoneOTP(false);
//     }
//   };

//   // Main submit handler
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (formData.plan === "enterprise") {
//       toast({
//         title: "Enterprise Plan - Coming Soon",
//         description: "Please contact sales for enterprise solutions",
//         variant: "default",
//       });
//       return;
//     }

//     // FOR FREE PLAN
//     if (formData.plan === "free") {
//       if (!otpData.isPhoneVerified) {
//         if (!showOtpInput) {
//           await handleSendOTP();
//           return;
//         } else {
//           await handleVerifyOTP();
//           return;
//         }
//       }
//     }

//     // FOR PRO PLAN
//     if (formData.plan === "pro") {
//       if (!phoneOTPVerified) {
//         if (!showPhoneOTPInput) {
//           await handleSendPhoneOTP();
//           return;
//         } else {
//           await handleVerifyPhoneOTP();
//           return;
//         }
//       }
//     }

//     // Before completing registration, check for duplicate user
//     // Only block if BOTH username AND phone match an existing user
//     const isDuplicate = await checkDuplicateUser(formData.username, formData.phone);

//     if (isDuplicate) {
//       setShowDuplicatePopup(true);
//       return;
//     }

//     // If all validations pass, complete registration
//     await completeRegistration();
//   };

//   // Complete registration
//   const completeRegistration = async () => {
//     setIsSubmitting(true);

//     try {
//       const cleanPhone = formData.phone.replace(/\D/g, '');
//       const autoEmail = formData.email || `${formData.username.replace(/\s+/g, '')}@hotel.com`;
//       const autoHotelName = formData.hotelName || `${formData.username} Hotel`;
//       const autoAdminName = formData.adminName || formData.username;
//       const autoAddress = formData.address || 'Address not provided';
//       const autoPassword = formData.password || cleanPhone;

//       const hotelData = {
//         hotelName: autoHotelName,
//         address: autoAddress,
//         plan: formData.plan,
//         gstNumber: formData.gstNumber.trim(),
//         referralCode: referralValid ? referralCode : null,
//         admin: {
//           username: formData.username.trim(),
//           password: autoPassword,
//           role: "admin",
//           name: autoAdminName,
//           email: autoEmail,
//           phone: cleanPhone,
//           status: formData.plan === "free" ? "active" : "pending"
//         }
//       };

//       if (formData.plan === "pro") {
//         (hotelData as any).emailOTP = phoneOTP;
//       }

//       let data;

//       if (formData.plan === "free") {
//         console.log("FREE plan selected - Saving to Google Sheets");

//         const paramObj: Record<string, unknown> = {
//           action: "createHotel",
//           ...hotelData,
//           "admin[status]": "active"
//         };

//         const queryString = buildQueryString(paramObj);
//         const url = APPS_SCRIPT_URL + "?" + queryString;

//         console.log("Sending to Google Apps Script:", url);
//         data = await jsonpRequest(url);

//       } else {
//         console.log("PRO plan selected - Saving to MySQL Database");
//         console.log("Sending to Node.js backend:", hotelData);

//         data = await fetchBackendRequest("/hotels/register", hotelData);
//       }

//       if (data.success) {
//         // Save registration data for welcome screen
//         setRegisteredData({
//           hotelName: autoHotelName,
//           username: formData.username.trim(),
//           password: autoPassword,
//           phone: formatIndianPhone(cleanPhone),
//           plan: formData.plan
//         });

//         // Reset form
//         setFormData({
//           adminName: "",
//           username: "",
//           password: "",
//           hotelName: "",
//           email: "",
//           phone: "",
//           address: "",
//           gstNumber: "",
//           plan: "free",
//         });

//         setOtpData({
//           otp: "",
//           isPhoneVerified: false,
//           otpSent: false,
//           otpCountdown: 0,
//           otpResendCount: 0,
//           maxOtpResends: 3,
//         });

//         setPhoneOTP("");
//         setPhoneOTPVerified(false);
//         setShowPhoneOTPInput(false);
//         setShowOtpInput(false);

//         // Close registration modal and show welcome screen
//         setShowWelcomeScreen(true);
//         // Don't call onClose() or navigate yet
//       } else {
//         // Handle specific error cases
//         if (data.error === "HOTEL_EXISTS") {
//           toast({
//             title: "Registration Failed",
//             description: "Hotel already registered. Try a different name.",
//             variant: "destructive",
//           });
//         } else if (data.error === "USERNAME_EXISTS") {
//           // Username exists but phone is different - this is actually allowed
//           toast({
//             title: "Registration Failed",
//             description: "Username already exists. Please choose a different username.",
//             variant: "destructive",
//           });
//         } else if (data.error === "PHONE_EXISTS") {
//           // Phone exists but username is different - this is allowed
//           toast({
//             title: "Registration Failed",
//             description: "Phone number already exists. Please use a different phone number.",
//             variant: "destructive",
//           });
//         } else if (data.error === "USERNAME_AND_PHONE_EXIST") {
//           // This is the only case we want to block
//           setShowDuplicatePopup(true);
//         } else if (data.error === "INVALID_OTP") {
//           toast({
//             title: "OTP Verification Failed",
//             description: "Please verify your OTP again",
//             variant: "destructive",
//           });
//         } else {
//           throw new Error(data.message || data.error || "Failed to create hotel");
//         }
//       }
//     } catch (err: any) {
//       console.error("Registration error:", err);

//       let errorMessage = err.message || "Something went wrong.";

//       if (err.message.includes("Failed to fetch")) {
//         errorMessage = "Cannot connect to the server. Please check if the backend is running.";
//       } else if (err.message.includes("Failed to load script")) {
//         errorMessage = "Cannot connect to Google Sheets. Please check your internet connection.";
//       }

//       toast({
//         title: "Registration Failed",
//         description: errorMessage,
//         variant: "destructive",
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Handle copy password to clipboard
//   const copyPasswordToClipboard = () => {
//     navigator.clipboard.writeText(registeredData.password);
//     setPasswordCopied(true);
//     setTimeout(() => setPasswordCopied(false), 3000);

//     toast({
//       title: "Password Copied!",
//       description: "Password has been copied to clipboard",
//       variant: "default",
//     });
//   };

//   // Handle proceed to login
//   const handleProceedToLogin = () => {
//     setShowWelcomeScreen(false);
//     onClose();
//     navigate("/login");
//   };

//   // Plan features detail
//   const detailedFeatures = {
//     free: [
//       { text: "Basic booking register", included: true },
//       { text: "5,000 records limit", included: true },
//       { text: "Manual room status update (max 20 rooms)", included: true },
//       { text: "Simple digital check-in/check-out (no guest history)", included: true },
//       { text: "Mobile version (limited view mode only)", included: true },
//       { text: "Basic print invoice", included: true },
//       { text: "Manual payment entry only", included: true },
//       { text: "Only today's check-in/check-out report (no export)", included: true },
//       { text: "No staff management", included: false },
//       { text: "No WhatsApp alerts", included: false },
//       { text: "No OTA connectivity", included: false },
//       { text: "Basic owner dashboard (daily summary only)", included: true },
//       { text: "No AI features", included: false },
//       { text: "No integrations", included: false },
//       { text: "Help docs support only", included: true },
//       { text: "Go live in less than a minute", included: true },
//       { text: "Lifetime free", included: true }
//     ],
//     pro: [
//       { text: "Full PMS: room allocation, early/late check-in/out", included: true },
//       { text: "50,000 records", included: true },
//       { text: "Housekeeping app + live status", included: true },
//       { text: "Automated check-in/out + guest history", included: true },
//       { text: "Full mobile app for staff & owner", included: true },
//       { text: "GST invoice generator", included: true },
//       { text: "Online payment links", included: true },
//       { text: "Split billing + outstanding tracking", included: true },
//       { text: "Daily revenue dashboard + audit report", included: true },
//       { text: "Attendance + payroll", included: true },
//       { text: "WhatsApp reminders (check-out, payments, tasks)", included: true },
//       { text: "Booking.com / MMT / Goibibo auto-sync", included: true },
//       { text: "Daily MIS via WhatsApp", included: true },
//       { text: "No AI pricing engine", included: false },
//       { text: "POS optional integration", included: true },
//       { text: "WhatsApp & call support", included: true },
//       { text: "Go live in less than 1 hour", included: true },
//       { text: "30-day FREE trial, then ₹999 / 6 months", included: true }
//     ],
//     enterprise: [
//       { text: "Chain-level PMS & coordination", included: true },
//       { text: "Unlimited records", included: true },
//       { text: "Central housekeeping monitoring", included: true },
//       { text: "Central guest database across properties", included: true },
//       { text: "Advanced chain manager mobile app", included: true },
//       { text: "Multi-property GST/ledger system", included: true },
//       { text: "Central finance dashboard", included: true },
//       { text: "Chain-level analytics (ADR, RevPAR, occupancy)", included: true },
//       { text: "Multi-property HR & approvals", included: true },
//       { text: "Advanced WhatsApp automation (chain MIS, AI alerts)", included: true },
//       { text: "Centralized rate & multiple OTA management", included: true },
//       { text: "Group-level performance dashboard", included: true },
//       { text: "AI pricing engine + forecasting", included: true },
//       { text: "Full API + channel managers + smart locks", included: true },
//       { text: "Dedicated manager + SLA", included: true },
//       { text: "Go live in a day", included: true },
//       { text: "Custom pricing", included: true }
//     ]
//   };

//   // Plan configurations
//   const plans = [
//     {
//       id: "free",
//       name: "BASIC",
//       subtitle: "Small Hotels – Limited",
//       price: "₹0/month",
//       color: "border-gray-300",
//       buttonVariant: "secondary" as const,
//       available: true,
//       icon: "🆓"
//     },
//     {
//       id: "pro",
//       name: "PRO",
//       subtitle: "Boutique / 20–70 Rooms",
//       price: "30-day FREE trial",
//       color: "border-blue-500",
//       buttonVariant: "default" as const,
//       available: true,
//       icon: "⭐"
//     },
//     {
//       id: "enterprise",
//       name: "ENTERPRISE",
//       subtitle: "Hotel Chains",
//       price: "Contact for pricing",
//       color: "border-purple-600",
//       buttonVariant: "default" as const,
//       available: false,
//       icon: "🏢"
//     }
//   ];

//   // Get current plan
//   const selectedPlan = plans.find(p => p.id === formData.plan);
//   const isAvailablePlan = selectedPlan?.available;

//   // Get button text based on current state
//   const getButtonText = () => {
//     if (!isAvailablePlan) return 'Upcoming';

//     if (isSubmitting) return 'Registering...';
//     if (checkingDuplicate) return 'Checking...';
//     if (isSendingOtp) return 'Sending SMS OTP...';
//     if (isVerifyingOtp) return 'Verifying SMS OTP...';
//     if (isSendingPhoneOTP) return 'Sending OTP...';
//     if (isVerifyingPhoneOTP) return 'Verifying OTP...';

//     if (formData.plan === "free") {
//       if (!otpData.isPhoneVerified) {
//         if (!showOtpInput) {
//           return 'Send SMS OTP to Register';
//         } else {
//           return 'Verify SMS OTP & Register';
//         }
//       }
//     } else if (formData.plan === "pro") {
//       if (!phoneOTPVerified) {
//         if (!showPhoneOTPInput) {
//           return 'Send OTP for PRO Plan';
//         } else {
//           return 'Verify OTP & Register';
//         }
//       }
//     }

//     return `Start ${formData.plan.toUpperCase()} Plan`;
//   };

//   // Determine if submit button should be disabled
//   const isSubmitDisabled = () => {
//     if (!isAvailablePlan) return true;
//     if (isSubmitting || checkingDuplicate || isSendingOtp || isVerifyingOtp || isSendingPhoneOTP || isVerifyingPhoneOTP) return true;

//     if (formData.plan === "free") {
//       // For FREE plan, disable if duplicate check hasn't passed
//       if (!isDuplicateChecked || !isDuplicateValid) return true;

//       if (showOtpInput && !otpData.isPhoneVerified) {
//         return otpData.otp.length !== 6;
//       }
//     }

//     if (formData.plan === "pro") {
//       // For PRO plan, disable if duplicate check hasn't passed
//       if (!isDuplicateChecked || !isDuplicateValid) return true;

//       if (showPhoneOTPInput && !phoneOTPVerified) {
//         return phoneOTP.length !== 6;
//       }
//     }

//     return false;
//   };

//   // Duplicate Warning Popup Component
//   const DuplicateWarningPopup = () => (
//     <Dialog open={showDuplicatePopup} onOpenChange={setShowDuplicatePopup}>
//       <DialogContent className="max-w-md mx-auto">
//         <div className="text-center py-4">
//           <div className="flex justify-center mb-4">
//             <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
//               <AlertTriangle className="h-8 w-8 text-red-600" />
//             </div>
//           </div>

//           <DialogTitle className="text-xl font-bold text-red-600 mb-2">
//             Account Already Exists!
//           </DialogTitle>

//           <DialogDescription className="text-gray-600 mb-6">
//             An account with this username and phone number combination already exists.
//             Please use different credentials to register.
//           </DialogDescription>

//           <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
//             <p className="text-sm font-medium text-gray-700 mb-2">Details you entered:</p>
//             <div className="space-y-2">
//               <div className="flex items-center gap-2">
//                 <User className="h-4 w-4 text-gray-500" />
//                 <span className="text-sm text-gray-600">Username: <span className="font-mono font-medium">{formData.username}</span></span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <Phone className="h-4 w-4 text-gray-500" />
//                 <span className="text-sm text-gray-600">Phone: <span className="font-mono font-medium">{formatIndianPhone(formData.phone)}</span></span>
//               </div>
//             </div>
//           </div>

//           <div className="flex gap-3 justify-center">
//             <Button
//               variant="outline"
//               onClick={() => {
//                 setShowDuplicatePopup(false);
//                 // Optionally clear the form or highlight fields
//               }}
//             >
//               Try Again
//             </Button>
//             <Button
//               className="bg-red-600 hover:bg-red-700"
//               onClick={() => {
//                 setShowDuplicatePopup(false);
//                 // Clear the form or navigate to login
//                 setFormData(prev => ({ ...prev, username: "", phone: "" }));
//               }}
//             >
//               Use Different Credentials
//             </Button>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );

//   // Welcome Screen Component - Optimized for Responsive Design
//   const WelcomeScreen = () => (
//     <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
//       <style>{`
//         @keyframes gradientShift {
//           0% { background-position: 0% 50%; }
//           50% { background-position: 100% 50%; }
//           100% { background-position: 0% 50%; }
//         }
//         .animate-gradient-shift {
//           background: linear-gradient(-45deg, #10b981, #059669, #047857, #065f46);
//           background-size: 300% 300%;
//           animation: gradientShift 8s ease infinite;
//         }
//         @keyframes pulseSlow {
//           0%, 100% { transform: scale(1); opacity: 1; }
//           50% { transform: scale(1.05); opacity: 0.9; }
//         }
//         .animate-pulse-slow {
//           animation: pulseSlow 3s ease-in-out infinite;
//         }
//         @keyframes confetti {
//           0% { transform: translateY(0) rotate(0deg); opacity: 1; }
//           100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
//         }
//         .confetti {
//           position: absolute;
//           width: 8px;
//           height: 8px;
//           background: var(--color);
//           top: -10px;
//           border-radius: 0;
//           animation: confetti 3s ease-in-out infinite;
//         }
//         @media (max-width: 640px) {
//           .confetti {
//             width: 5px;
//             height: 5px;
//           }
//         }
//       `}</style>

//       <div className="relative min-h-[500px] sm:min-h-[600px]">
//         {/* Animated gradient background */}
//         <div className="absolute inset-0 animate-gradient-shift"></div>

//         {/* Confetti effect - fewer on mobile */}
//         {[...Array(window.innerWidth < 640 ? 10 : 20)].map((_, i) => (
//           <div
//             key={i}
//             className="confetti"
//             style={{
//               left: `${Math.random() * 100}%`,
//               animationDelay: `${Math.random() * 2}s`,
//               backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
//               width: `${Math.random() * (window.innerWidth < 640 ? 6 : 10) + 3}px`,
//               height: `${Math.random() * (window.innerWidth < 640 ? 6 : 10) + 3}px`,
//               transform: `rotate(${Math.random() * 360}deg)`,
//             }}
//           />
//         ))}

//         {/* Content */}
//         <div className="relative z-10 p-4 sm:p-8 text-white flex flex-col min-h-[500px] sm:min-h-[600px]">
//           {/* Success animation */}
//           <div className="flex justify-center mb-4 sm:mb-6">
//             <div className="relative">
//               <div className="w-20 h-20 sm:w-28 sm:h-28 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse-slow">
//                 <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center shadow-xl">
//                   <PartyPopper className="h-8 w-8 sm:h-12 sm:w-12 text-emerald-600" />
//                 </div>
//               </div>
//               <div className="absolute -top-2 -right-2">
//                 <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-400 rounded-full flex items-center justify-center text-xl sm:text-2xl animate-bounce shadow-lg">
//                   🎉
//                 </div>
//               </div>
//             </div>
//           </div>

//           <DialogTitle className="text-xl sm:text-3xl font-bold text-center mb-1 sm:mb-2 text-white drop-shadow-lg">
//             Welcome to {registeredData.hotelName}!
//           </DialogTitle>

//           <DialogDescription className="text-center text-white/90 text-sm sm:text-lg mb-4 sm:mb-8 drop-shadow px-2">
//             Your account has been created successfully
//           </DialogDescription>

//           {/* Credentials Card */}
//           <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-6 mb-3 sm:mb-6 border border-white/20 shadow-xl">
//             <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-white">
//               <Key className="h-4 w-4 sm:h-5 sm:w-5" />
//               Your Login Credentials
//             </h3>

//             <div className="space-y-2 sm:space-y-4">
//               {/* Username */}
//               <div className="flex items-start gap-2 sm:gap-3">
//                 <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg shrink-0">
//                   <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-xs sm:text-sm text-white/70">Username</p>
//                   <p className="font-mono font-bold text-sm sm:text-lg text-white break-all">
//                     {registeredData.username}
//                   </p>
//                 </div>
//               </div>

//               {/* Password */}
//               <div className="flex items-start gap-2 sm:gap-3">
//                 <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg shrink-0">
//                   <Key className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-xs sm:text-sm text-white/70">Password</p>
//                   <div className="flex items-center gap-1 sm:gap-2">
//                     <p className="font-mono font-bold text-sm sm:text-lg flex-1 text-white break-all">
//                       {registeredData.password}
//                     </p>
//                     <Button
//                       type="button"
//                       size="sm"
//                       variant="secondary"
//                       className="bg-white/20 hover:bg-white/30 text-white border-0 transition-all shrink-0 h-7 sm:h-8 px-2 sm:px-3"
//                       onClick={copyPasswordToClipboard}
//                     >
//                       {passwordCopied ? (
//                         <CheckCheck className="h-3 w-3 sm:h-4 sm:w-4" />
//                       ) : (
//                         <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
//                       )}
//                     </Button>
//                   </div>
//                 </div>
//               </div>

//               {/* Phone */}
//               <div className="flex items-start gap-2 sm:gap-3">
//                 <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg shrink-0">
//                   <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-xs sm:text-sm text-white/70">Registered Phone</p>
//                   <p className="font-mono font-bold text-sm sm:text-lg text-white break-all">
//                     {registeredData.phone}
//                   </p>
//                 </div>
//               </div>

//               {/* Plan */}
//               <div className="flex items-start gap-2 sm:gap-3">
//                 <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg shrink-0">
//                   <Hotel className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-xs sm:text-sm text-white/70">Plan</p>
//                   <p className="font-bold text-sm sm:text-lg text-white">
//                     {registeredData.plan === 'pro' ? (
//                       <span className="inline-flex items-center gap-1">
//                         ⭐ PRO Plan (30-day FREE trial)
//                       </span>
//                     ) : (
//                       <span className="inline-flex items-center gap-1">
//                         🆓 BASIC Plan (Lifetime Free)
//                       </span>
//                     )}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Trial Alert */}
//             {registeredData.plan === 'pro' && (
//               <Alert className="mt-3 sm:mt-4 bg-yellow-400/20 border-yellow-400/30 text-white p-2 sm:p-3">
//                 <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 shrink-0" />
//                 <AlertDescription className="text-xs sm:text-sm">
//                   Your 30-day FREE trial starts now. After trial ends, subscription is ₹999/6 months.
//                 </AlertDescription>
//               </Alert>
//             )}
//           </div>

//           {/* Important Note */}
//           <div className="bg-black/20 backdrop-blur-sm rounded-lg p-3 sm:p-4 mb-3 sm:mb-6 text-xs sm:text-sm text-white/90 border border-white/10">
//             <p className="font-semibold mb-1 sm:mb-2 flex items-center gap-2">
//               <ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4" />
//               Important:
//             </p>
//             <ul className="list-disc list-inside space-y-0.5 sm:space-y-1 text-white/80 text-xs sm:text-sm">
//               <li>Save your password - you won't see it again</li>
//               <li>You can change password after login in Settings</li>
//               <li>Use your username and password to login</li>
//             </ul>
//           </div>

//           {/* Action Buttons */}
//           <div className="flex flex-col gap-2 sm:gap-3 mt-auto">
//             <Button
//               size="lg"
//               className="w-full bg-white text-emerald-700 hover:bg-white/90 font-bold text-sm sm:text-lg py-4 sm:py-6 shadow-xl transform transition-all hover:scale-105"
//               onClick={handleProceedToLogin}
//             >
//               <LogIn className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
//               Proceed to Login
//             </Button>

//             <Button
//               variant="outline"
//               size="lg"
//               className="w-full border-white/30 text-white hover:bg-white/10 font-medium backdrop-blur-sm text-sm sm:text-base py-3 sm:py-4"
//               onClick={() => {
//                 setShowWelcomeScreen(false);
//                 onClose();
//               }}
//             >
//               Close
//             </Button>
//           </div>
//         </div>
//       </div>
//     </DialogContent>
//   );

//   return (
//     <>
//       {/* Registration Modal */}
//       <Dialog open={open && !showWelcomeScreen} onOpenChange={onClose}>
//         <DialogContent className="max-w-[95vw] mx-auto sm:max-w-6xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
//           <DialogHeader className="px-0 sm:px-2">
//             <DialogTitle className="text-lg sm:text-xl">Register New Hotel</DialogTitle>
//             <DialogDescription className="text-sm sm:text-base">
//               Choose your plan and fill in details
//             </DialogDescription>
//           </DialogHeader>

//           <form onSubmit={handleSubmit} className="space-y-4">
//             {/* Plan Selection Header - With Try Demo Button */}
//             <div className="space-y-2">
//               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
//                 <Label className="text-base sm:text-lg font-semibold">Choose Your Plan</Label>
//                 {onTryDemo && (
//                   <Button
//                     type="button"
//                     size="lg"
//                     className="w-full sm:w-auto animate-fast-pulse bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 font-bold shadow-lg px-3 sm:px-4 py-3 sm:py-5 text-xs sm:text-sm rounded-xl transition-all"
//                     onClick={(e) => {
//                       e.preventDefault();
//                       onClose();
//                       onTryDemo();
//                     }}
//                   >
//                     ✨ Try Demo
//                   </Button>
//                 )}
//               </div>

//               <Tabs
//                 value={formData.plan}
//                 onValueChange={handlePlanChange}
//                 className="w-full"
//               >
//                 <TabsList className="grid w-full grid-cols-3 mb-4 h-12 sm:h-16 bg-slate-100/80 p-1 rounded-xl sm:p-1.5 border border-slate-200">
//                   <TabsTrigger
//                     value="pro"
//                     className="rounded-lg h-full data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center justify-center gap-1 font-bold text-xs sm:text-sm text-slate-600 data-[state=active]:text-blue-600 transition-all duration-200"
//                   >
//                     <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" /> PRO
//                   </TabsTrigger>
//                   <TabsTrigger
//                     value="free"
//                     className="rounded-lg h-full data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center justify-center gap-1 font-bold text-xs sm:text-sm text-slate-600 data-[state=active]:text-emerald-600 transition-all duration-200"
//                   >
//                     <span className="text-xs sm:text-sm">🆓</span> BASIC
//                   </TabsTrigger>
//                   <TabsTrigger
//                     value="enterprise"
//                     className="rounded-lg h-full data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center justify-center gap-1 font-bold text-xs sm:text-sm text-slate-600 data-[state=active]:text-purple-600 transition-all duration-200"
//                   >
//                     <span className="text-xs sm:text-sm">🏢</span> ENTERPRISE
//                   </TabsTrigger>
//                 </TabsList>

//                 {plans.map((plan) => (
//                   <TabsContent key={plan.id} value={plan.id} className="mt-0">
//                     <div className="relative max-w-xl mx-auto">
//                       {plan.id === "pro" && (
//                         <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
//                           <Badge className="bg-green-600 text-white text-[8px] sm:text-xs shadow-sm ring-2 ring-background px-2 sm:px-3 py-0.5 uppercase tracking-wider">
//                             ⭐ Most Popular
//                           </Badge>
//                         </div>
//                       )}
//                       {!plan.available && (
//                         <div className="absolute -top-3 right-2 sm:right-4 z-10">
//                           <Badge className="bg-amber-500 text-white text-[8px] sm:text-xs shadow-sm ring-2 ring-background">Upcoming</Badge>
//                         </div>
//                       )}

//                       <div
//                         className={`flex flex-col rounded-xl border-2 ${plan.color} bg-card p-3 sm:p-5 transition-all ring-2 ring-primary ring-offset-1 shadow-lg ${!plan.available ? 'opacity-70' : ''}`}
//                       >
//                         <div className="flex-grow">
//                           <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 mb-2 sm:mb-3 border-b pb-2 sm:pb-3">
//                             <div className="text-center sm:text-left min-w-0">
//                               <div className="flex justify-center sm:justify-start items-center gap-1 sm:gap-2 mb-1">
//                                 <span className="text-xl sm:text-3xl shrink-0">{plan.icon}</span>
//                                 <h3 className="font-bold text-base sm:text-2xl truncate uppercase tracking-wide">{plan.name}</h3>
//                               </div>
//                               <p className="text-xs sm:text-sm text-muted-foreground truncate">{plan.subtitle}</p>
//                             </div>
//                             <Badge
//                               variant={plan.buttonVariant}
//                               className={`text-xs sm:text-sm whitespace-nowrap border-none shrink-0 py-1 px-2 sm:py-1.5 sm:px-4 rounded-full ${plan.id === 'free' ? 'bg-secondary text-secondary-foreground' : 'bg-cyan-500 text-white hover:bg-cyan-600'
//                                 }`}
//                             >
//                               {plan.price}
//                             </Badge>
//                           </div>

//                           <div className="text-xs sm:text-sm space-y-2 sm:space-y-3 mb-2">
//                             <div className="flex flex-col space-y-2 sm:space-y-3 bg-slate-50 p-2 sm:p-3 rounded-lg border border-slate-100">
//                               <div className="flex items-center text-xs sm:text-sm font-medium">
//                                 <span className="text-green-600 mr-1 sm:mr-2 bg-green-100 p-0.5 rounded-full text-xs">✓</span>
//                                 <span>
//                                   {plan.id === "free" ? "5,000 records" :
//                                     plan.id === "pro" ? "50,000 records" :
//                                       "Unlimited records"}
//                                 </span>
//                               </div>
//                               {plan.id === "pro" && (
//                                 <div className="space-y-2 sm:space-y-3">
//                                   <div className="flex items-center text-xs sm:text-sm font-medium">
//                                     <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-600 bg-blue-100 p-0.5 rounded-sm" />
//                                     <span>30-day FREE trial</span>
//                                   </div>
//                                   <div className="flex items-center text-xs sm:text-sm font-medium">
//                                     <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-600 bg-blue-100 p-0.5 rounded-sm" />
//                                     <span>Phone verification required</span>
//                                   </div>
//                                 </div>
//                               )}
//                             </div>

//                             <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-dashed">
//                               {/* Shiny Badges */}
//                               <div className="text-center mb-2 sm:mb-4">
//                                 <div className="inline-block transform transition-all hover:scale-105">
//                                   {plan.id === "free" ?
//                                     <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg px-2 sm:px-4 py-1 sm:py-2 shadow-sm">
//                                       <span className="text-xs sm:text-base font-bold text-blue-700 tracking-wide uppercase">
//                                         ✨ Life Time Free ✨
//                                       </span>
//                                     </div> :
//                                     plan.id === "pro" ?
//                                       <div className="bg-gradient-to-r from-amber-50 to-orange-100 border border-amber-200 rounded-lg px-2 sm:px-4 py-1 sm:py-2 shadow-sm">
//                                         <span className="text-xs sm:text-base font-bold text-amber-700 tracking-wide uppercase">
//                                           ✨ 30 Days FREE ✨
//                                         </span>
//                                       </div> :
//                                       <div className="bg-gradient-to-r from-purple-50 to-pink-100 border border-purple-200 rounded-lg px-2 sm:px-4 py-1 sm:py-2 shadow-sm">
//                                         <span className="text-xs sm:text-base font-bold text-purple-700 tracking-wide uppercase">
//                                           ✨ Contact Pricing ✨
//                                         </span>
//                                       </div>
//                                   }
//                                 </div>
//                               </div>

//                               {/* Actions Group (Know More) */}
//                               <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
//                                 <Button
//                                   type="button"
//                                   variant="outline"
//                                   size="sm"
//                                   className="flex-1 text-slate-700 hover:text-slate-900 font-medium py-2 sm:py-4 flex items-center justify-center gap-1 sm:gap-2 rounded-lg text-xs sm:text-sm"
//                                   onClick={(e) => {
//                                     e.preventDefault();
//                                     setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id);
//                                   }}
//                                 >
//                                   {expandedPlanId === plan.id ? (
//                                     <>Show Less <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" /></>
//                                   ) : (
//                                     <>🔍 Know More <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" /></>
//                                   )}
//                                 </Button>
//                               </div>

//                               {/* Expanded Features List */}
//                               <div
//                                 className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedPlanId === plan.id ? 'max-h-[1000px] opacity-100 mt-2 sm:mt-4' : 'max-h-0 opacity-0'}`}
//                               >
//                                 <div className="bg-[#f8f9fa] rounded-xl p-2 sm:p-5 border border-slate-200 space-y-2 sm:space-y-3">
//                                   {(detailedFeatures as any)[plan.id].map((feature: { text: string, included: boolean }, idx: number) => (
//                                     <div key={idx} className={`flex items-start gap-2 sm:gap-3 text-xs sm:text-sm font-medium ${feature.included ? 'text-slate-800' : 'text-slate-400'}`}>
//                                       {feature.included ? (
//                                         <div className="bg-green-100 p-0.5 rounded-full mt-0.5 shrink-0">
//                                           <Check className="h-2 w-2 sm:h-3 sm:w-3 text-green-700" />
//                                         </div>
//                                       ) : (
//                                         <div className="bg-slate-100 p-0.5 rounded-full mt-0.5 shrink-0">
//                                           <X className="h-2 w-2 sm:h-3 sm:w-3 text-slate-400" />
//                                         </div>
//                                       )}
//                                       <span className="leading-snug">{feature.text}</span>
//                                     </div>
//                                   ))}
//                                 </div>
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </TabsContent>
//                 ))}
//               </Tabs>
//             </div>

//             {/* Hotel Details - Only Username and Phone fields shown */}
//             {isAvailablePlan && showForm && (
//               <div className="space-y-4 pt-4 border-t border-dashed mt-4">
//                 <Label className="text-base sm:text-lg font-semibold">Registration Details</Label>

//                 {/* Phone Verification Status for FREE Plan */}
//                 {formData.plan === "free" && otpData.isPhoneVerified && (
//                   <Alert className="bg-green-50 border-green-200 text-xs sm:text-sm p-2 sm:p-3">
//                     <div className="flex items-center gap-2">
//                       <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 shrink-0" />
//                       <AlertDescription className="text-green-800 text-xs sm:text-sm">
//                         <strong>Phone Verified!</strong> Your phone {formatIndianPhone(formData.phone)} is verified.
//                       </AlertDescription>
//                     </div>
//                   </Alert>
//                 )}

//                 {/* Phone Verification Status for PRO Plan */}
//                 {formData.plan === "pro" && phoneOTPVerified && (
//                   <Alert className="bg-green-50 border-green-200 text-xs sm:text-sm p-2 sm:p-3">
//                     <div className="flex items-center gap-2">
//                       <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 shrink-0" />
//                       <AlertDescription className="text-green-800 text-xs sm:text-sm">
//                         <strong>Phone Verified!</strong> Your phone {formatIndianPhone(formData.phone)} is verified for PRO plan.
//                       </AlertDescription>
//                     </div>
//                   </Alert>
//                 )}

//                 {/* Hotel Details Form - Only Username and Phone */}
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
//                   {[
//                     { id: "username", label: "Username *", placeholder: "Choose username" },
//                     {
//                       id: "phone",
//                       label: "Phone *",
//                       type: "tel",
//                       placeholder: "9876543210",
//                       disabled: (formData.plan === "free" && otpData.isPhoneVerified) || 
//                                (formData.plan === "pro" && phoneOTPVerified)
//                     },
//                   ].map((f) => (
//                     <div key={f.id} className="space-y-1">
//                       <Label htmlFor={f.id} className="text-xs sm:text-sm">
//                         {f.label}
//                         {f.id === "phone" && formData.plan === "free" && otpData.isPhoneVerified && (
//                           <CheckCircle className="h-3 w-3 text-green-500 inline ml-1" />
//                         )}
//                         {f.id === "phone" && formData.plan === "pro" && phoneOTPVerified && (
//                           <CheckCircle className="h-3 w-3 text-green-500 inline ml-1" />
//                         )}
//                       </Label>
//                       <Input
//                         id={f.id}
//                         type={f.type || "text"}
//                         value={(formData as any)[f.id]}
//                         onChange={(e) => handleChange(f.id, e.target.value)}
//                         placeholder={f.placeholder}
//                         required
//                         disabled={f.disabled || false}
//                         className={`text-sm sm:text-base h-9 sm:h-10 ${
//                           isDuplicateChecked && !isDuplicateValid && formData.username && formData.phone
//                             ? 'border-red-500 focus:ring-red-500'
//                             : isDuplicateChecked && isDuplicateValid && formData.username && formData.phone
//                             ? 'border-green-500 focus:ring-green-500'
//                             : ''
//                         }`}
//                       />

//                       {/* Validation indicators */}
//                       {formData.username && formData.phone && isDuplicateChecked && (
//                         <div className="text-xs mt-1">
//                           {isDuplicateValid ? (
//                             <span className="text-green-600 flex items-center gap-1">
//                               <CheckCircle className="h-3 w-3" />
//                               Username and phone are available
//                             </span>
//                           ) : (
//                             <span className="text-red-600 flex items-center gap-1">
//                               <AlertCircle className="h-3 w-3" />
//                               This combination already exists
//                             </span>
//                           )}
//                         </div>
//                       )}

//                       {checkingDuplicate && (
//                         <div className="text-xs mt-1 text-blue-600 flex items-center gap-1">
//                           <Loader2 className="h-3 w-3 animate-spin" />
//                           Checking availability...
//                         </div>
//                       )}
//                     </div>
//                   ))}
//                 </div>

//                 {/* Duplicate Check Info - Show only when both fields are filled */}
//                 {formData.username && formData.phone && !isDuplicateChecked && !checkingDuplicate && (
//                   <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded border border-blue-100">
//                     <p className="flex items-center gap-1">
//                       <AlertCircle className="h-3 w-3 text-blue-500" />
//                       We'll check if this username and phone combination is available.
//                     </p>
//                   </div>
//                 )}

//                 {/* Phone OTP Input Section for PRO Plan */}
//                 {formData.plan === "pro" && showPhoneOTPInput && !phoneOTPVerified && (
//                   <div className="space-y-3 sm:space-y-4 border rounded-lg p-3 sm:p-6 bg-gradient-to-br from-purple-50 to-pink-50">
//                     <div className="flex items-center gap-2 sm:gap-3">
//                       <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
//                         <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
//                       </div>
//                       <div>
//                         <h3 className="font-semibold text-sm sm:text-lg">Verify Your Phone for PRO Plan</h3>
//                         <p className="text-xs sm:text-sm text-muted-foreground">
//                           OTP sent to <strong>{formatIndianPhone(formData.phone)}</strong>
//                         </p>
//                       </div>
//                     </div>

//                     <Alert className="bg-amber-50 border-amber-200 text-xs sm:text-sm p-2 sm:p-3">
//                       <AlertDescription className="text-amber-800">
//                         <div className="flex items-start gap-2">
//                           <ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" />
//                           <div className="text-xs sm:text-sm">
//                             <strong>PRO Plan Trial:</strong> You'll get 30 days FREE trial.
//                           </div>
//                         </div>
//                       </AlertDescription>
//                     </Alert>

//                     <div className="space-y-2 sm:space-y-3">
//                       <Label htmlFor="phone-otp" className="text-sm sm:text-base">
//                         Enter 6-digit OTP
//                       </Label>
//                       <div className="flex gap-2">
//                         <div className="flex-1">
//                           <Input
//                             id="phone-otp"
//                             type="text"
//                             inputMode="numeric"
//                             pattern="\d*"
//                             maxLength={6}
//                             value={phoneOTP}
//                             onChange={(e) => handlePhoneOtpChange(e.target.value)}
//                             placeholder="000000"
//                             className="text-center text-lg sm:text-2xl font-mono tracking-widest h-10 sm:h-14"
//                             autoFocus
//                           />
//                         </div>
//                         <Button
//                           type="button"
//                           onClick={handleVerifyPhoneOTP}
//                           disabled={phoneOTP.length !== 6 || isVerifyingPhoneOTP}
//                           className="bg-green-600 hover:bg-green-700 h-10 sm:h-14 px-3 sm:px-4"
//                         >
//                           {isVerifyingPhoneOTP ? (
//                             <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
//                           ) : (
//                             "Verify"
//                           )}
//                         </Button>
//                       </div>

//                       <div className="flex justify-center pt-1 sm:pt-2">
//                         <Button
//                           type="button"
//                           variant="outline"
//                           size="sm"
//                           onClick={() => {
//                             setShowPhoneOTPInput(false);
//                             setPhoneOTP("");
//                           }}
//                           className="text-xs sm:text-sm h-8 sm:h-9"
//                         >
//                           <ArrowLeft className="h-3 w-3 mr-1" />
//                           Back to Form
//                         </Button>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {/* SMS OTP Input Section for FREE Plan */}
//                 {formData.plan === "free" && otpData.otpSent && !otpData.isPhoneVerified && (
//                   <div className="space-y-3 sm:space-y-4 border rounded-lg p-3 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
//                     <div className="flex items-center gap-2 sm:gap-3">
//                       <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
//                         <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
//                       </div>
//                       <div>
//                         <h3 className="font-semibold text-sm sm:text-lg">Verify Your Phone</h3>
//                         <p className="text-xs sm:text-sm text-muted-foreground">
//                           OTP sent to <strong>{formatIndianPhone(formData.phone)}</strong>
//                         </p>
//                       </div>
//                     </div>

//                     <Alert className="bg-amber-50 border-amber-200 text-xs sm:text-sm p-2 sm:p-3">
//                       <AlertDescription className="text-amber-800">
//                         <div className="flex items-start gap-2">
//                           <ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" />
//                           <div className="text-xs sm:text-sm">
//                             <strong>Security Notice:</strong> OTP valid for 5 minutes.
//                           </div>
//                         </div>
//                       </AlertDescription>
//                     </Alert>

//                     <div className="space-y-2 sm:space-y-3">
//                       <Label htmlFor="otp" className="text-sm sm:text-base">
//                         Enter 6-digit OTP
//                       </Label>
//                       <div className="flex gap-2">
//                         <div className="flex-1">
//                           <Input
//                             id="otp"
//                             type="text"
//                             inputMode="numeric"
//                             pattern="\d*"
//                             maxLength={6}
//                             value={otpData.otp}
//                             onChange={(e) => handleOtpChange(e.target.value)}
//                             placeholder="000000"
//                             className="text-center text-lg sm:text-2xl font-mono tracking-widest h-10 sm:h-14"
//                             autoFocus
//                           />
//                           <div className="flex justify-between items-center mt-1 sm:mt-2">
//                             <span className="text-xs sm:text-sm text-muted-foreground">
//                               {otpData.otpCountdown > 0 ? (
//                                 <span className="text-amber-600">
//                                   Expires in {formatCountdown(otpData.otpCountdown)}
//                                 </span>
//                               ) : (
//                                 <span className="text-red-600">OTP expired</span>
//                               )}
//                             </span>
//                             <Button
//                               type="button"
//                               variant="link"
//                               size="sm"
//                               onClick={handleSendOTP}
//                               disabled={isSendingOtp || otpData.otpCountdown > 0 || otpData.otpResendCount >= otpData.maxOtpResends}
//                               className="h-auto p-0 text-xs sm:text-sm"
//                             >
//                               {isSendingOtp ? (
//                                 <>
//                                   <Loader2 className="h-3 w-3 mr-1 animate-spin" />
//                                   Sending...
//                                 </>
//                               ) : (
//                                 <>
//                                   <RefreshCw className="h-3 w-3 mr-1" />
//                                   Resend
//                                 </>
//                               )}
//                             </Button>
//                           </div>
//                         </div>
//                         <Button
//                           type="button"
//                           onClick={handleVerifyOTP}
//                           disabled={otpData.otp.length !== 6 || isVerifyingOtp}
//                           className="bg-green-600 hover:bg-green-700 h-10 sm:h-14 px-3 sm:px-4"
//                         >
//                           {isVerifyingOtp ? (
//                             <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
//                           ) : (
//                             "Verify"
//                           )}
//                         </Button>
//                       </div>

//                       <div className="flex justify-center pt-1 sm:pt-2">
//                         <Button
//                           type="button"
//                           variant="outline"
//                           size="sm"
//                           onClick={() => {
//                             setOtpData(prev => ({
//                               ...prev,
//                               otpSent: false,
//                               otp: "",
//                               otpCountdown: 0
//                             }));
//                           }}
//                           className="text-xs sm:text-sm h-8 sm:h-9"
//                         >
//                           <ArrowLeft className="h-3 w-3 mr-1" />
//                           Back to Form
//                         </Button>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* Action Buttons */}
//             {showForm && (
//               <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end pt-4 border-t">
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={() => {
//                     onClose();
//                   }}
//                   disabled={isSubmitting || isSendingOtp || isVerifyingOtp || isSendingPhoneOTP || isVerifyingPhoneOTP}
//                   className="w-full sm:w-auto text-sm sm:text-base h-9 sm:h-10"
//                 >
//                   Cancel
//                 </Button>
//                 <Button
//                   type="submit"
//                   disabled={isSubmitDisabled()}
//                   className={`w-full sm:w-auto text-sm sm:text-base min-w-32 h-9 sm:h-10 ${
//                     !isAvailablePlan ? 'bg-amber-500 hover:bg-amber-600' :
//                     formData.plan === 'pro' ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : ''
//                   } ${
//                     !isDuplicateChecked || !isDuplicateValid ? 'opacity-50 cursor-not-allowed' : ''
//                   }`}
//                 >
//                   {checkingDuplicate ? (
//                     <>
//                       <Loader2 className="h-3 w-3 mr-2 animate-spin" />
//                       Checking...
//                     </>
//                   ) : (
//                     getButtonText()
//                   )}
//                 </Button>
//               </div>
//             )}

//             {/* Plan Summary */}
//             {showForm && (
//               <div className={`text-xs sm:text-sm text-center p-2 sm:p-3 rounded ${formData.plan === 'enterprise'
//                 ? 'bg-amber-50 border border-amber-200 text-amber-800'
//                 : formData.plan === 'pro'
//                   ? 'bg-blue-50 border border-blue-200 text-blue-800'
//                   : 'bg-gray-50 border border-gray-200 text-gray-800'
//                 }`}>
//                 {formData.plan === 'enterprise' ? (
//                   <div className="space-y-1">
//                     <div className="font-semibold">ENTERPRISE Plan - Coming Soon!</div>
//                     <div>Contact sales: <span className="font-medium">sales@hotelmanagementsystem.com</span></div>
//                   </div>
//                 ) : formData.plan === 'pro' ? (
//                   <div className="space-y-1">
//                     <div className="font-semibold">PRO Plan - 30 Day FREE Trial</div>
//                     <div className="text-xs">Phone verification required. Password is your phone number.</div>
//                     {phoneOTPVerified && (
//                       <div className="text-green-600 font-medium text-xs">
//                         ✓ Phone verified
//                       </div>
//                     )}
//                   </div>
//                 ) : (
//                   <div className="space-y-1">
//                     <div className="font-semibold">
//                       BASIC Plan - Lifetime Free
//                       {otpData.isPhoneVerified && (
//                         <CheckCircle className="h-3 w-3 text-green-500 inline ml-1" />
//                       )}
//                     </div>
//                     <div className="text-xs">Perfect for small hotels. Password is your phone number.</div>
//                   </div>
//                 )}
//               </div>
//             )}
//           </form>
//         </DialogContent>
//       </Dialog>

//       {/* Duplicate Warning Popup */}
//       <DuplicateWarningPopup />

//       {/* Welcome Screen Modal */}
//       <Dialog open={showWelcomeScreen} onOpenChange={() => setShowWelcomeScreen(false)}>
//         <WelcomeScreen />
//       </Dialog>
//     </>
//   );
// };

// export default RegisterModal;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  ShieldCheck,
  RefreshCw,
  CheckCircle,
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Clock,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Star,
  Hotel,
  User,
  Key,
  LogIn,
  Copy,
  CheckCheck,
  PartyPopper,
  AlertCircle,
  AlertTriangle,
  Sparkles
} from "lucide-react";

// interface RegisterModalProps {
//   open: boolean;
//   onClose: () => void;
//   onTryDemo?: () => void;
// }

interface RegisterModalProps {
  open: boolean;
  onClose: () => void;
  onTryDemo?: () => void;
  initialView?: "form" | "plans";
  /** Simple registration: username + phone only, no plan picker or OTP */
  basicOnly?: boolean;
}

// Google Apps Script URL for FREE plan
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwA1sC2rREM50Ri9p0r-tWy3Jz-RSe39N9iu90qiRopKUvJ17fxYptB4yhbfQOBM62z/exec";

// Node.js backend URL
const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const RegisterModal = ({ open, onClose, onTryDemo, initialView = "form", basicOnly = false }: RegisterModalProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();



  // Form data state
  const [formData, setFormData] = useState({
    adminName: "",
    username: "",
    password: "",
    hotelName: "",
    email: "",
    phone: "",
    address: "",
    gstNumber: "",
    plan: "free", // Default BASIC; user can switch to PRO tab
  });

  // SMS OTP states for FREE plan
  const [otpData, setOtpData] = useState({
    otp: "",
    isPhoneVerified: false,
    otpSent: false,
    otpCountdown: 0,
    otpResendCount: 0,
    maxOtpResends: 3,
  });

  // Phone OTP states for PRO plan
  const [phoneOTP, setPhoneOTP] = useState("");
  const [phoneOTPVerified, setPhoneOTPVerified] = useState(false);
  const [showPhoneOTPInput, setShowPhoneOTPInput] = useState(false);

  // WhatsApp OTP for basic registration
  const [basicOtp, setBasicOtp] = useState("");
  const [showBasicOtpInput, setShowBasicOtpInput] = useState(false);
  const [isSendingBasicOtp, setIsSendingBasicOtp] = useState(false);
  const [basicOtpError, setBasicOtpError] = useState("");

  const [showForm, setShowForm] = useState(true);

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSendingPhoneOTP, setIsSendingPhoneOTP] = useState(false);
  const [isVerifyingPhoneOTP, setIsVerifyingPhoneOTP] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);

  const [referralCode, setReferralCode] = useState('');
  const [referralValidating, setReferralValidating] = useState(false);
  const [referralValid, setReferralValid] = useState(false);
  const [referralDetails, setReferralDetails] = useState<any>(null);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  // Add state for welcome screen
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);
  const [registeredData, setRegisteredData] = useState({
    hotelName: "",
    username: "",
    password: "",
    phone: "",
    plan: ""
  });
  const [passwordCopied, setPasswordCopied] = useState(false);

  // Add state for checking duplicates
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [isDuplicateChecked, setIsDuplicateChecked] = useState(false);
  const [isDuplicateValid, setIsDuplicateValid] = useState(false);
  const [usernameExists, setUsernameExists] = useState(false);
  const [suggestedUsername, setSuggestedUsername] = useState<string | null>(null);

  // Add state for duplicate warning popup
  const [showDuplicatePopup, setShowDuplicatePopup] = useState(false);

  // OTP Countdown Timer for SMS
  // useEffect(() => {
  //   let interval: NodeJS.Timeout;
  //   if (otpData.otpCountdown > 0) {
  //     interval = setInterval(() => {
  //       setOtpData(prev => ({
  //         ...prev,
  //         otpCountdown: prev.otpCountdown - 1
  //       }));
  //     }, 1000);
  //   }
  //   return () => {
  //     if (interval) clearInterval(interval);
  //   };
  // }, [otpData.otpCountdown]);

  // OTP Countdown Timer for SMS
  useEffect(() => {
    let interval: number | undefined;
    if (otpData.otpCountdown > 0) {
      interval = window.setInterval(() => {
        setOtpData(prev => ({
          ...prev,
          otpCountdown: prev.otpCountdown - 1
        }));
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [otpData.otpCountdown]);

  // 👇 ADD THIS NEW useEffect HERE - after your existing useEffect
  // 👇 UPDATE THIS useEffect
  useEffect(() => {
    if (open) {
      setShowForm(true);
      setShowWelcomeScreen(false);
      setShowDuplicatePopup(false);
      setBasicOtp("");
      setBasicOtpError("");
      setShowBasicOtpInput(false);
      setIsSubmitting(false);
      setIsSendingBasicOtp(false);
    }
  }, [open]);

  // Auto-check duplicate when both username and phone are filled
  useEffect(() => {
    const checkDuplicateAutomatically = async () => {
      if (formData.username && formData.phone && formData.username.length >= 3 && formData.phone.replace(/\D/g, '').length === 10) {
        await checkDuplicateUser(formData.username, formData.phone);
      } else {
        setIsDuplicateChecked(false);
        setIsDuplicateValid(false);
        setUsernameExists(false);
        setSuggestedUsername(null);
      }
    };

    // Debounce the check to avoid too many API calls
    const timeoutId = setTimeout(() => {
      checkDuplicateAutomatically();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.username, formData.phone]);

  // Helper functions
  const formatIndianPhone = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 10) {
      return `+91 ${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
    }
    return phone;
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Form change handlers
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Reset verification states when phone changes
    if (field === "phone") {
      setOtpData(prev => ({
        ...prev,
        isPhoneVerified: false,
        otpSent: false,
        otp: ""
      }));
      setShowOtpInput(false);

      setPhoneOTPVerified(false);
      setShowPhoneOTPInput(false);
      setPhoneOTP("");

      setShowBasicOtpInput(false);
      setBasicOtp("");
      setBasicOtpError("");
    }

    if (field === "username") {
      setShowBasicOtpInput(false);
      setBasicOtp("");
      setBasicOtpError("");
    }

    // Reset duplicate check state when fields change
    if (field === "username" || field === "phone") {
      setIsDuplicateChecked(false);
      setIsDuplicateValid(false);
      setUsernameExists(false);
      setSuggestedUsername(null);
    }
  };

  const handleOtpChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setOtpData(prev => ({ ...prev, otp: numericValue }));
  };

  const handlePhoneOtpChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setPhoneOTP(numericValue);
  };

  // Plan change handler
  const handlePlanChange = (value: string) => {
    handleChange("plan", value);

    if (value === "free") {
      setPhoneOTPVerified(false);
      setShowPhoneOTPInput(false);
      setPhoneOTP("");
    } else if (value === "pro") {
      setOtpData({
        otp: "",
        isPhoneVerified: false,
        otpSent: false,
        otpCountdown: 0,
        otpResendCount: 0,
        maxOtpResends: 3,
      });
      setShowOtpInput(false);
    }
  };

  // Apply suggested username
  const handleApplySuggestedUsername = () => {
    if (suggestedUsername) {
      setFormData(prev => ({ ...prev, username: suggestedUsername }));
      setSuggestedUsername(null);
      setUsernameExists(false);
      // Re-check with new username
      setTimeout(() => {
        checkDuplicateUser(suggestedUsername, formData.phone);
      }, 100);
    }
  };

  const validateReferralCode = async () => {
    if (!referralCode.trim()) {
      setReferralValid(false);
      return;
    }

    setReferralValidating(true);
    try {
      const response = await fetch(`${NODE_BACKEND_URL}/wallet/referral/validate/${referralCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReferralValid(true);
          setReferralDetails(data.data);
          toast({
            title: 'Referral Code Valid!',
            description: `You'll earn benefits from ${data.data.referrer_name}`,
            variant: 'default',
          });
        } else {
          setReferralValid(false);
          toast({
            title: 'Invalid Code',
            description: 'Please enter a valid referral code',
            variant: 'destructive',
          });
        }
      } else {
        setReferralValid(false);
        toast({
          title: 'Error',
          description: 'Failed to validate referral code',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setReferralValid(false);
      toast({
        title: 'Error',
        description: 'Network error. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setReferralValidating(false);
    }
  };

  // JSONP function for Google Apps Script (FREE plan)
  function jsonpRequest(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const callbackName = "cb_" + Date.now();
      (window as any)[callbackName] = (data: any) => {
        resolve(data);
        delete (window as any)[callbackName];
        script.remove();
      };
      const script = document.createElement("script");
      script.src = url + (url.includes("?") ? "&" : "?") + "callback=" + callbackName;
      script.onerror = () => {
        reject(new Error("Failed to load script"));
        delete (window as any)[callbackName];
        script.remove();
      };
      document.body.appendChild(script);
    });
  }

  // Fetch function for Node.js backend
  async function fetchBackendRequest(endpoint: string, data: any): Promise<any> {
    console.log("📤 Sending to backend:", {
      endpoint: `${NODE_BACKEND_URL}${endpoint}`,
      data: { ...data, admin: { ...data.admin, password: '[HIDDEN]' } }
    });

    const response = await fetch(`${NODE_BACKEND_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const responseText = await response.text();
    console.log("📥 Backend response:", {
      status: response.status,
      statusText: response.statusText,
      body: responseText
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = responseText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    try {
      return JSON.parse(responseText);
    } catch (e) {
      throw new Error('Invalid JSON response from server');
    }
  }

  const encodeValue = (val: unknown) =>
    typeof val === "string" || typeof val === "number" || typeof val === "boolean"
      ? encodeURIComponent(val.toString())
      : "";

  const buildQueryString = (params: Record<string, unknown>): string =>
    Object.entries(params)
      .map(([key, val]) => {
        if (typeof val === "object" && val !== null) {
          return Object.entries(val as Record<string, unknown>)
            .map(
              ([subKey, subVal]) =>
                encodeURIComponent(`${key}[${subKey}]`) + "=" + encodeValue(subVal)
            )
            .join("&");
        }
        return encodeURIComponent(key) + "=" + encodeValue(val);
      })
      .join("&");

  // SMS OTP functions for FREE plan
  async function generateSMSOTP(phone: string, email: string, hotelName: string, username: string): Promise<any> {
    const paramObj = {
      action: "generateOTP",
      phone: phone,
      email: email,
      hotelName: hotelName,
      username: username
    };

    const queryString = buildQueryString(paramObj);
    const url = APPS_SCRIPT_URL + "?" + queryString;

    console.log("📱 Generating SMS OTP for phone:", phone);
    return await jsonpRequest(url);
  }

  async function verifySMSOTP(phone: string, email: string, otp: string): Promise<any> {
    const paramObj = {
      action: "verifyOTP",
      phone: phone,
      email: email,
      otp: otp
    };

    const queryString = buildQueryString(paramObj);
    const url = APPS_SCRIPT_URL + "?" + queryString;

    console.log("🔐 Verifying SMS OTP for phone:", phone);
    return await jsonpRequest(url);
  }

  // Function to check if user exists with same username AND phone
  const checkDuplicateUser = async (username: string, phone: string): Promise<boolean> => {
    try {
      setCheckingDuplicate(true);

      // Clean phone number
      const cleanPhone = phone.replace(/\D/g, '');

      const response = await fetch(`${NODE_BACKEND_URL}/users/check-duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          phone: cleanPhone
        }),
      });

      // Handle 401 Unauthorized - fallback to letting backend handle it
      if (response.status === 401) {
        console.log("⚠️ Duplicate check endpoint requires authentication, falling back to backend validation");
        setIsDuplicateChecked(true);
        setIsDuplicateValid(true); // Allow registration, backend will handle duplicates
        setUsernameExists(false);
        return false;
      }

      const data = await response.json();

      const isDuplicate = data.success && data.exists;

      setIsDuplicateChecked(true);
      setIsDuplicateValid(!isDuplicate);
      setUsernameExists(data.usernameExists || false);
      setSuggestedUsername(data.suggestedUsername || null);

      if (isDuplicate) {
        setShowDuplicatePopup(true);
      }

      return isDuplicate;
    } catch (error) {
      console.error("Error checking duplicate user:", error);
      setIsDuplicateChecked(true);
      setIsDuplicateValid(true); // Allow registration if check fails
      setUsernameExists(false);
      return false;
    } finally {
      setCheckingDuplicate(false);
    }
  };

  // Send SMS OTP for FREE plan
  const handleSendOTP = async () => {
    if (!formData.phone) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your phone number to receive SMS OTP",
        variant: "destructive",
      });
      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = formData.phone.replace(/\D/g, '');

    if (!phoneRegex.test(cleanPhone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit Indian mobile number",
        variant: "destructive",
      });
      return;
    }

    if (otpData.otpResendCount >= otpData.maxOtpResends) {
      toast({
        title: "Resend Limit Reached",
        description: "You have reached the maximum OTP resend attempts. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingOtp(true);
    try {
      const response = await generateSMSOTP(
        cleanPhone,
        formData.email || `${formData.username}@temp.com`,
        formData.hotelName || `${formData.username} Hotel`,
        formData.username
      );

      if (response.success) {
        setOtpData(prev => ({
          ...prev,
          otpSent: true,
          otpCountdown: 300,
          otpResendCount: prev.otpResendCount + 1,
          isPhoneVerified: false
        }));

        setShowOtpInput(true);

        toast({
          title: "OTP Sent Successfully! 📱",
          description: `We've sent a 6-digit OTP to ${formatIndianPhone(formData.phone)}`,
          variant: "default",
        });
      } else {
        throw new Error(response.message || "Failed to send OTP");
      }
    } catch (error: any) {
      console.error("OTP send error:", error);

      let errorMessage = "Failed to send OTP. Please try again.";
      if (error.message.includes("OTP_GENERATION_FAILED")) {
        errorMessage = "Unable to send SMS OTP. Please check your phone number.";
      } else if (error.message.includes("INVALID_PHONE")) {
        errorMessage = "Invalid phone number. Please enter a valid 10-digit Indian number.";
      }

      toast({
        title: "SMS OTP Send Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify SMS OTP for FREE plan
  const handleVerifyOTP = async () => {
    if (!otpData.otp || otpData.otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    const autoEmail = formData.email || `${formData.username}@temp.com`;

    setIsVerifyingOtp(true);
    try {
      const response = await verifySMSOTP(cleanPhone, autoEmail, otpData.otp);

      if (response.success) {
        setOtpData(prev => ({
          ...prev,
          isPhoneVerified: true
        }));

        setShowOtpInput(false);

        toast({
          title: "Phone Verified Successfully! ✅",
          description: "Your phone number has been verified. You can now proceed with registration.",
          variant: "default",
        });
      } else {
        if (response.error === "INVALID_OTP") {
          toast({
            title: "Invalid OTP",
            description: response.message || "The OTP you entered is incorrect.",
            variant: "destructive",
          });
        } else if (response.error === "OTP_EXPIRED") {
          setOtpData(prev => ({
            ...prev,
            otpSent: false,
            otpCountdown: 0
          }));
          setShowOtpInput(false);

          toast({
            title: "OTP Expired",
            description: "The OTP has expired. Please request a new one.",
            variant: "destructive",
          });
        } else if (response.error === "MAX_ATTEMPTS") {
          setOtpData(prev => ({
            ...prev,
            otpSent: false,
            otpCountdown: 0
          }));
          setShowOtpInput(false);

          toast({
            title: "Maximum Attempts Exceeded",
            description: "Too many failed attempts. Please request a new OTP.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);

      toast({
        title: "Verification Failed",
        description: "Failed to verify OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Send Phone OTP for PRO plan (using WhatsApp)
  const handleSendPhoneOTP = async () => {
    if (!formData.phone) {
      toast({
        title: "Phone Required",
        description: "Please enter your phone number to receive OTP",
        variant: "destructive",
      });
      return;
    }

    if (!formData.username) {
      toast({
        title: "Username Required",
        description: "Please enter your username",
        variant: "destructive",
      });
      return;
    }

    const autoEmail = formData.email || `${formData.username.replace(/\s+/g, '')}@hotel.com`;
    const autoHotelName = formData.hotelName || `${formData.username} Hotel`;
    const autoAdminName = formData.adminName || formData.username;
    const cleanPhone = formData.phone ? formData.phone.replace(/\D/g, '') : null;

    setIsSendingPhoneOTP(true);
    try {
      const response = await fetch(`${NODE_BACKEND_URL}/hotels/send-pro-otp-whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: autoEmail,
          hotelName: autoHotelName,
          adminName: autoAdminName,
          phone: cleanPhone
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowPhoneOTPInput(true);

        let successMessage = `OTP sent to ${formatIndianPhone(formData.phone)} via WhatsApp`;

        toast({
          title: "OTP Sent Successfully! 📱",
          description: successMessage,
          variant: "default",
        });

        console.log("✅ OTP Delivery Status:", data.data?.delivery);
      } else {
        throw new Error(data.message || "Failed to send OTP");
      }
    } catch (error: any) {
      toast({
        title: "Failed to Send OTP",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSendingPhoneOTP(false);
    }
  };

  // Verify Phone OTP for PRO plan
  const handleVerifyPhoneOTP = async () => {
    if (!phoneOTP || phoneOTP.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    const autoEmail = formData.email || `${formData.username.replace(/\s+/g, '')}@hotel.com`;

    setIsVerifyingPhoneOTP(true);
    try {
      const response = await fetch(`${NODE_BACKEND_URL}/hotels/verify-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: autoEmail,
          otp: phoneOTP
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPhoneOTPVerified(true);
        setShowPhoneOTPInput(false);
        toast({
          title: "Phone Verified Successfully! ✅",
          description: "Your phone has been verified for PRO plan",
          variant: "default",
        });
      } else {
        throw new Error(data.message || "Invalid OTP");
      }
    } catch (error: any) {
      toast({
        title: "OTP Verification Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingPhoneOTP(false);
    }
  };

  const handleSendBasicWhatsAppOTP = async () => {
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!formData.username.trim() || formData.username.trim().length < 3) {
      toast({ title: "Username required", description: "Enter a username (min 3 characters)", variant: "destructive" });
      return;
    }
    if (cleanPhone.length !== 10) {
      toast({ title: "Phone required", description: "Enter a valid 10-digit phone number", variant: "destructive" });
      return;
    }

    setIsSendingBasicOtp(true);
    try {
      const response = await fetch(`${NODE_BACKEND_URL}/hotels/register-basic/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username.trim(),
          phone: cleanPhone,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setShowBasicOtpInput(true);
        setBasicOtp("");
        setBasicOtpError("");
        toast({
          title: "OTP Sent on WhatsApp 📱",
          description: `Check WhatsApp on ${formatIndianPhone(cleanPhone)}. Enter OTP below, then tap Register.`,
          variant: "default",
        });
      } else {
        throw new Error(data.message || "Failed to send OTP");
      }
    } catch (error: any) {
      setBasicOtpError(error.message || "Could not send WhatsApp OTP");
      toast({
        title: "Failed to Send OTP",
        description: error.message || "Could not send WhatsApp OTP",
        variant: "destructive",
      });
    } finally {
      setIsSendingBasicOtp(false);
    }
  };

  // Main submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (basicOnly) {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      if (!formData.username.trim() || formData.username.trim().length < 3) {
        toast({ title: "Invalid username", description: "Username must be at least 3 characters", variant: "destructive" });
        return;
      }
      if (cleanPhone.length !== 10) {
        toast({ title: "Invalid phone", description: "Enter a valid 10-digit phone number", variant: "destructive" });
        return;
      }

      const isDuplicate = await checkDuplicateUser(formData.username, formData.phone);
      if (isDuplicate) {
        setShowDuplicatePopup(true);
        return;
      }

      if (!showBasicOtpInput) {
        await handleSendBasicWhatsAppOTP();
        return;
      }
      if (basicOtp.length !== 6) {
        setBasicOtpError("Enter the 6-digit OTP from WhatsApp");
        return;
      }

      setBasicOtpError("");
      await completeBasicRegistration();
      return;
    }

    if (formData.plan === "enterprise") {
      toast({
        title: "Enterprise Plan - Coming Soon",
        description: "Please contact sales for enterprise solutions",
        variant: "default",
      });
      return;
    }

    // FOR FREE PLAN
    if (formData.plan === "free") {
      if (!otpData.isPhoneVerified) {
        if (!showOtpInput) {
          await handleSendOTP();
          return;
        } else {
          await handleVerifyOTP();
          return;
        }
      }
    }

    // FOR PRO PLAN
    if (formData.plan === "pro") {
      if (!phoneOTPVerified) {
        if (!showPhoneOTPInput) {
          await handleSendPhoneOTP();
          return;
        } else {
          await handleVerifyPhoneOTP();
          return;
        }
      }
    }

    const isDuplicate = await checkDuplicateUser(formData.username, formData.phone);

    if (isDuplicate) {
      setShowDuplicatePopup(true);
      return;
    }

    await completeRegistration();
  };

  const completeBasicRegistration = async () => {
    setIsSubmitting(true);
    setBasicOtpError("");
    setShowDuplicatePopup(false);
    try {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      const data = await fetchBackendRequest("/hotels/register-basic", {
        username: formData.username.trim(),
        phone: cleanPhone,
        otp: basicOtp,
      });

      if (data.success) {
        setRegisteredData({
          hotelName: data.data?.hotelName || `${formData.username.trim()} Hotel`,
          username: formData.username.trim(),
          password: cleanPhone,
          phone: formatIndianPhone(cleanPhone),
          plan: "free",
        });
        setFormData({
          adminName: "",
          username: "",
          password: "",
          hotelName: "",
          email: "",
          phone: "",
          address: "",
          gstNumber: "",
          plan: "free",
        });
        setBasicOtp("");
        setBasicOtpError("");
        setShowBasicOtpInput(false);
        setShowDuplicatePopup(false);
        setShowWelcomeScreen(true);
        return;
      }

      throw new Error(data.message || "Registration failed");
    } catch (err: any) {
      console.error("Basic registration error:", err);
      let errorMessage = err.message || "Something went wrong.";
      if (err.message?.includes("Failed to fetch")) {
        errorMessage = "Cannot connect to the server. Please check if the backend is running.";
      } else if (err.message?.includes("Invalid or expired OTP") || err.message?.includes("INVALID_OTP")) {
        errorMessage = "OTP is wrong or expired. Tap Resend OTP on WhatsApp, then enter the new code.";
        setShowBasicOtpInput(true);
      } else if (err.message?.includes("already registered") || err.message?.includes("USERNAME")) {
        setShowDuplicatePopup(true);
      }

      setBasicOtpError(errorMessage);
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Complete registration
  const completeRegistration = async () => {
    setIsSubmitting(true);

    try {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      const autoEmail = formData.email || `${formData.username.replace(/\s+/g, '')}@hotel.com`;
      const autoHotelName = formData.hotelName || `${formData.username} Hotel`;
      const autoAdminName = formData.adminName || formData.username;
      const autoAddress = formData.address || 'Address not provided';
      const autoPassword = formData.password || cleanPhone;

      const hotelData = {
        hotelName: autoHotelName,
        address: autoAddress,
        plan: formData.plan,
        gstNumber: formData.gstNumber.trim(),
        referralCode: referralValid ? referralCode : null,
        admin: {
          username: formData.username.trim(),
          password: autoPassword,
          role: "admin",
          name: autoAdminName,
          email: autoEmail,
          phone: cleanPhone,
          status: formData.plan === "free" ? "active" : "pending"
        }
      };

      // if (formData.plan === "pro") {
      //   (hotelData as any).emailOTP = phoneOTP;
      // }

      let data;

      if (formData.plan === "free") {
        console.log("BASIC (free) plan selected - Saving to MySQL Database");
        data = await fetchBackendRequest("/hotels/register", {
          ...hotelData,
          plan: "free",
        });
      } else {
        console.log("PRO plan selected - Saving to MySQL Database");
        console.log("Sending to Node.js backend:", hotelData);

        data = await fetchBackendRequest("/hotels/register", hotelData);
      }

      if (data.success) {
        // Save registration data for welcome screen
        setRegisteredData({
          hotelName: autoHotelName,
          username: formData.username.trim(),
          password: autoPassword,
          phone: formatIndianPhone(cleanPhone),
          plan: formData.plan
        });

        // Reset form
        setFormData({
          adminName: "",
          username: "",
          password: "",
          hotelName: "",
          email: "",
          phone: "",
          address: "",
          gstNumber: "",
          plan: "free",
        });

        setOtpData({
          otp: "",
          isPhoneVerified: false,
          otpSent: false,
          otpCountdown: 0,
          otpResendCount: 0,
          maxOtpResends: 3,
        });

        setPhoneOTP("");
        setPhoneOTPVerified(false);
        setShowPhoneOTPInput(false);
        setShowOtpInput(false);
        setBasicOtp("");
        setBasicOtpVerified(false);
        setShowBasicOtpInput(false);

        // Close registration modal and show welcome screen
        setShowWelcomeScreen(true);
        // Don't call onClose() or navigate yet
      } else {
        // Handle specific error cases
        if (data.error === "HOTEL_EXISTS") {
          toast({
            title: "Registration Failed",
            description: "Hotel already registered. Try a different name.",
            variant: "destructive",
          });
        } else if (data.error === "USERNAME_EXISTS") {
          // Username exists but phone is different - we already handled this with suggestions
          // But if backend still returns this, show suggestion
          if (suggestedUsername) {
            setUsernameExists(true);
            toast({
              title: "Username Already Taken",
              description: `Try "${suggestedUsername}" instead.`,
              variant: "default",
            });
          } else {
            toast({
              title: "Username Already Taken",
              description: "Please choose a different username.",
              variant: "destructive",
            });
          }
        } else if (data.error === "PHONE_EXISTS") {
          // Phone exists but username is different - this is allowed
          toast({
            title: "Registration Failed",
            description: "Phone number already exists. Please use a different phone number.",
            variant: "destructive",
          });
        } else if (data.error === "USERNAME_AND_PHONE_EXIST") {
          // This is the only case we want to block
          setShowDuplicatePopup(true);
        } else if (data.error === "INVALID_OTP") {
          toast({
            title: "OTP Verification Failed",
            description: "Please verify your OTP again",
            variant: "destructive",
          });
        } else {
          throw new Error(data.message || data.error || "Failed to create hotel");
        }
      }
    } catch (err: any) {
      console.error("Registration error:", err);

      let errorMessage = err.message || "Something went wrong.";

      if (err.message.includes("Failed to fetch")) {
        errorMessage = "Cannot connect to the server. Please check if the backend is running.";
      } else if (err.message.includes("Failed to load script")) {
        errorMessage = "Cannot connect to Google Sheets. Please check your internet connection.";
      }

      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle copy password to clipboard
  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(registeredData.password);
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 3000);

    toast({
      title: "Password Copied!",
      description: "Password has been copied to clipboard",
      variant: "default",
    });
  };

  // Handle proceed to login
  const handleProceedToLogin = () => {
    setShowWelcomeScreen(false);
    onClose();
    localStorage.setItem("loginTab", "database");
    navigate("/login");
  };

  // Plan features detail
  const detailedFeatures = {
    free: [
      { text: "Basic booking register", included: true },
      { text: "5,000 records limit", included: true },
      { text: "Manual room status update (max 20 rooms)", included: true },
      { text: "Simple digital check-in/check-out (no guest history)", included: true },
      { text: "Mobile version (limited view mode only)", included: true },
      { text: "Basic print invoice", included: true },
      { text: "Manual payment entry only", included: true },
      { text: "Only today's check-in/check-out report (no export)", included: true },
      { text: "No staff management", included: false },
      { text: "No WhatsApp alerts", included: false },
      { text: "No OTA connectivity", included: false },
      { text: "Basic owner dashboard (daily summary only)", included: true },
      { text: "No AI features", included: false },
      { text: "No integrations", included: false },
      { text: "Help docs support only", included: true },
      { text: "Go live in less than a minute", included: true },
      { text: "Lifetime free", included: true }
    ],
    pro: [
      { text: "Full PMS: room allocation, early/late check-in/out", included: true },
      { text: "50,000 records", included: true },
      { text: "Housekeeping app + live status", included: true },
      { text: "Automated check-in/out + guest history", included: true },
      { text: "Full mobile app for staff & owner", included: true },
      { text: "GST invoice generator", included: true },
      { text: "Online payment links", included: true },
      { text: "Split billing + outstanding tracking", included: true },
      { text: "Daily revenue dashboard + audit report", included: true },
      { text: "Attendance + payroll", included: true },
      { text: "WhatsApp reminders (check-out, payments, tasks)", included: true },
      { text: "Booking.com / MMT / Goibibo auto-sync", included: true },
      { text: "Daily MIS via WhatsApp", included: true },
      { text: "No AI pricing engine", included: false },
      { text: "POS optional integration", included: true },
      { text: "WhatsApp & call support", included: true },
      { text: "Go live in less than 1 hour", included: true },
      { text: "30-day FREE trial, then ₹999 / 6 months", included: true }
    ],
    enterprise: [
      { text: "Chain-level PMS & coordination", included: true },
      { text: "Unlimited records", included: true },
      { text: "Central housekeeping monitoring", included: true },
      { text: "Central guest database across properties", included: true },
      { text: "Advanced chain manager mobile app", included: true },
      { text: "Multi-property GST/ledger system", included: true },
      { text: "Central finance dashboard", included: true },
      { text: "Chain-level analytics (ADR, RevPAR, occupancy)", included: true },
      { text: "Multi-property HR & approvals", included: true },
      { text: "Advanced WhatsApp automation (chain MIS, AI alerts)", included: true },
      { text: "Centralized rate & multiple OTA management", included: true },
      { text: "Group-level performance dashboard", included: true },
      { text: "AI pricing engine + forecasting", included: true },
      { text: "Full API + channel managers + smart locks", included: true },
      { text: "Dedicated manager + SLA", included: true },
      { text: "Go live in a day", included: true },
      { text: "Custom pricing", included: true }
    ]
  };

  // Plan configurations
  const plans = [
    {
      id: "free",
      name: "BASIC",
      subtitle: "Small Hotels – Limited",
      price: "₹0/month",
      color: "border-gray-300",
      buttonVariant: "secondary" as const,
      available: true,
      icon: "🆓"
    },
    {
      id: "pro",
      name: "PRO",
      subtitle: "Boutique / 20–70 Rooms",
      price: "30-day FREE trial",
      color: "border-blue-500",
      buttonVariant: "default" as const,
      available: true,
      icon: "⭐"
    },
    {
      id: "enterprise",
      name: "ENTERPRISE",
      subtitle: "Hotel Chains",
      price: "Contact for pricing",
      color: "border-purple-600",
      buttonVariant: "default" as const,
      available: false,
      icon: "🏢"
    }
  ];

  // Get current plan
  const selectedPlan = plans.find(p => p.id === formData.plan);
  const isAvailablePlan = selectedPlan?.available;

  // Get button text based on current state
  const getButtonText = () => {
    if (basicOnly) {
      if (isSubmitting) return 'Registering...';
      if (checkingDuplicate) return 'Checking...';
      if (isSendingBasicOtp) return 'Sending WhatsApp OTP...';
      if (!showBasicOtpInput) return 'Send WhatsApp OTP';
      return 'Register';
    }

    if (!isAvailablePlan) return 'Upcoming';

    if (isSubmitting) return 'Registering...';
    if (checkingDuplicate) return 'Checking...';
    if (isSendingOtp) return 'Sending SMS OTP...';
    if (isVerifyingOtp) return 'Verifying SMS OTP...';
    if (isSendingPhoneOTP) return 'Sending OTP...';
    if (isVerifyingPhoneOTP) return 'Verifying OTP...';

    if (formData.plan === "free") {
      if (!otpData.isPhoneVerified) {
        if (!showOtpInput) {
          return 'Send SMS OTP to Register';
        } else {
          return 'Verify SMS OTP & Register';
        }
      }
    } else if (formData.plan === "pro") {
      if (!phoneOTPVerified) {
        if (!showPhoneOTPInput) {
          return 'Send OTP for PRO Plan';
        } else {
          return 'Verify OTP & Register';
        }
      }
    }

    return `Start ${formData.plan.toUpperCase()} Plan`;
  };

  // Determine if submit button should be disabled
  const isSubmitDisabled = () => {
    if (basicOnly) {
      if (isSubmitting || checkingDuplicate || isSendingBasicOtp) return true;
      const cleanPhone = formData.phone.replace(/\D/g, '');
      if (!formData.username.trim() || formData.username.trim().length < 3 || cleanPhone.length !== 10) return true;
      if (!isDuplicateChecked || !isDuplicateValid) return true;
      if (showBasicOtpInput && basicOtp.length !== 6) return true;
      return false;
    }

    if (!isAvailablePlan) return true;
    if (isSubmitting || checkingDuplicate || isSendingOtp || isVerifyingOtp || isSendingPhoneOTP || isVerifyingPhoneOTP) return true;

    if (formData.plan === "free") {
      // For FREE plan, disable if duplicate check hasn't passed
      if (!isDuplicateChecked || !isDuplicateValid) return true;

      if (showOtpInput && !otpData.isPhoneVerified) {
        return otpData.otp.length !== 6;
      }
    }

    if (formData.plan === "pro") {
      // For PRO plan, disable if duplicate check hasn't passed
      if (!isDuplicateChecked || !isDuplicateValid) return true;

      if (showPhoneOTPInput && !phoneOTPVerified) {
        return phoneOTP.length !== 6;
      }
    }

    return false;
  };

  // Duplicate Warning Popup Component
  const DuplicateWarningPopup = () => (
    <Dialog open={showDuplicatePopup} onOpenChange={setShowDuplicatePopup}>
      <DialogContent className="max-w-md mx-auto">
        <div className="text-center py-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <DialogTitle className="text-xl font-bold text-red-600 mb-2">
            Account Already Exists!
          </DialogTitle>

          <DialogDescription className="text-gray-600 mb-6">
            An account with this username and phone number combination already exists.
            Please use different credentials to register.
          </DialogDescription>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-medium text-gray-700 mb-2">Details you entered:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Username: <span className="font-mono font-medium">{formData.username}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Phone: <span className="font-mono font-medium">{formatIndianPhone(formData.phone)}</span></span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => {
                setShowDuplicatePopup(false);
                // Optionally clear the form or highlight fields
              }}
            >
              Try Again
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                setShowDuplicatePopup(false);
                // Clear the form
                setFormData(prev => ({ ...prev, username: "", phone: "" }));
              }}
            >
              Use Different Credentials
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Welcome Screen Component - Optimized for Responsive Design
  const WelcomeScreen = () => (
    <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-shift {
          background: linear-gradient(-45deg, #10b981, #059669, #047857, #065f46);
          background-size: 300% 300%;
          animation: gradientShift 8s ease infinite;
        }
        @keyframes pulseSlow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        .animate-pulse-slow {
          animation: pulseSlow 3s ease-in-out infinite;
        }
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .confetti {
          position: absolute;
          width: 8px;
          height: 8px;
          background: var(--color);
          top: -10px;
          border-radius: 0;
          animation: confetti 3s ease-in-out infinite;
        }
        @media (max-width: 640px) {
          .confetti {
            width: 5px;
            height: 5px;
          }
        }
      `}</style>

      <div className="relative min-h-[500px] sm:min-h-[600px]">
        {/* Animated gradient background */}
        <div className="absolute inset-0 animate-gradient-shift"></div>

        {/* Confetti effect - fewer on mobile */}
        {/* {[...Array(window.innerWidth < 640 ? 10 : 20)].map((_, i) => (
          <div
            key={i}
            className="confetti"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
              width: `${Math.random() * (window.innerWidth < 640 ? 6 : 10) + 3}px`,
              height: `${Math.random() * (window.innerWidth < 640 ? 6 : 10) + 3}px`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))} */}
        {(() => {
          // Safely check if window is defined (for SSR compatibility)
          const isClient = typeof window !== 'undefined';
          const width = isClient ? window.innerWidth : 1024; // Default to desktop size
          const confettiCount = width < 640 ? 10 : 20;

          return [...Array(confettiCount)].map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
                width: `${Math.random() * (width < 640 ? 6 : 10) + 3}px`,
                height: `${Math.random() * (width < 640 ? 6 : 10) + 3}px`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ));
        })()}

        {/* Content */}
        <div className="relative z-10 p-4 sm:p-8 text-white flex flex-col min-h-[500px] sm:min-h-[600px]">
          {/* Success animation */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="relative">
              <div className="w-20 h-20 sm:w-28 sm:h-28 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse-slow">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center shadow-xl">
                  <PartyPopper className="h-8 w-8 sm:h-12 sm:w-12 text-emerald-600" />
                </div>
              </div>
              <div className="absolute -top-2 -right-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-400 rounded-full flex items-center justify-center text-xl sm:text-2xl animate-bounce shadow-lg">
                  🎉
                </div>
              </div>
            </div>
          </div>

          <DialogTitle className="text-xl sm:text-3xl font-bold text-center mb-1 sm:mb-2 text-white drop-shadow-lg">
            Welcome to {registeredData.hotelName}!
          </DialogTitle>

          <DialogDescription className="text-center text-white/90 text-sm sm:text-lg mb-4 sm:mb-8 drop-shadow px-2">
            Your account has been created successfully
          </DialogDescription>

          {/* Credentials Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-6 mb-3 sm:mb-6 border border-white/20 shadow-xl">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-white">
              <Key className="h-4 w-4 sm:h-5 sm:w-5" />
              Your Login Credentials
            </h3>

            <div className="space-y-2 sm:space-y-4">
              {/* Username */}
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg shrink-0">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-white/70">Username</p>
                  <p className="font-mono font-bold text-sm sm:text-lg text-white break-all">
                    {registeredData.username}
                  </p>
                </div>
              </div>

              {/* Password */}
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg shrink-0">
                  <Key className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-white/70">Password</p>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <p className="font-mono font-bold text-sm sm:text-lg flex-1 text-white break-all">
                      {registeredData.password}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="bg-white/20 hover:bg-white/30 text-white border-0 transition-all shrink-0 h-7 sm:h-8 px-2 sm:px-3"
                      onClick={copyPasswordToClipboard}
                    >
                      {passwordCopied ? (
                        <CheckCheck className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : (
                        <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg shrink-0">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-white/70">Registered Phone</p>
                  <p className="font-mono font-bold text-sm sm:text-lg text-white break-all">
                    {registeredData.phone}
                  </p>
                </div>
              </div>

              {/* Plan */}
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg shrink-0">
                  <Hotel className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-white/70">Plan</p>
                  <p className="font-bold text-sm sm:text-lg text-white">
                    {registeredData.plan === 'pro' ? (
                      <span className="inline-flex items-center gap-1">
                        ⭐ PRO Plan (30-day FREE trial)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        🆓 BASIC Plan (Lifetime Free)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Trial Alert */}
            {registeredData.plan === 'pro' && (
              <Alert className="mt-3 sm:mt-4 bg-yellow-400/20 border-yellow-400/30 text-white p-2 sm:p-3">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 shrink-0" />
                <AlertDescription className="text-xs sm:text-sm">
                  Your 30-day FREE trial starts now. After trial ends, subscription is ₹999/6 months.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Important Note */}
          <div className="bg-black/20 backdrop-blur-sm rounded-lg p-3 sm:p-4 mb-3 sm:mb-6 text-xs sm:text-sm text-white/90 border border-white/10">
            <p className="font-semibold mb-1 sm:mb-2 flex items-center gap-2">
              <ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4" />
              Important:
            </p>
            <ul className="list-disc list-inside space-y-0.5 sm:space-y-1 text-white/80 text-xs sm:text-sm">
              <li>Save your password - you won't see it again</li>
              <li>You can change password after login in Settings</li>
              <li>Use your username and password to login</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 sm:gap-3 mt-auto">
            <Button
              size="lg"
              className="w-full bg-white text-emerald-700 hover:bg-white/90 font-bold text-sm sm:text-lg py-4 sm:py-6 shadow-xl transform transition-all hover:scale-105"
              onClick={handleProceedToLogin}
            >
              <LogIn className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Proceed to Login
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full border-white/30 text-white hover:bg-white/10 font-medium backdrop-blur-sm text-sm sm:text-base py-3 sm:py-4"
              onClick={() => {
                setShowWelcomeScreen(false);
                onClose();
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  );

  return (
    <>
      {/* Registration Modal */}
      <Dialog open={open && !showWelcomeScreen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] mx-auto sm:max-w-6xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="px-0 sm:px-2">
            <DialogTitle className="text-lg sm:text-xl">
              {basicOnly ? "Register" : "Register New Hotel"}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {basicOnly
                ? "Enter your username and phone number to create your account"
                : "Choose your plan and fill in details"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Plan selection — hidden for basic-only registration */}
            {!basicOnly && (
            <div className="space-y-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                  <Label className="text-base sm:text-lg font-semibold">Choose Your Plan</Label>
                  {onTryDemo && initialView === "plans" && (
                    <Button
                      type="button"
                      size="lg"
                      className="w-full sm:w-auto animate-fast-pulse bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 font-bold shadow-lg px-3 sm:px-4 py-3 sm:py-5 text-xs sm:text-sm rounded-xl transition-all"
                      onClick={(e) => {
                        e.preventDefault();
                        onClose();
                        onTryDemo();
                      }}
                    >
                      ✨ Try Demo
                    </Button>
                  )}
                </div>

                <Tabs
                  value={formData.plan}
                  onValueChange={handlePlanChange}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3 mb-4 h-12 sm:h-16 bg-slate-100/80 p-1 rounded-xl sm:p-1.5 border border-slate-200">
                    <TabsTrigger
                      value="pro"
                      className="rounded-lg h-full data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center justify-center gap-1 font-bold text-xs sm:text-sm text-slate-600 data-[state=active]:text-blue-600 transition-all duration-200"
                    >
                      <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" /> PRO
                    </TabsTrigger>
                    <TabsTrigger
                      value="free"
                      className="rounded-lg h-full data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center justify-center gap-1 font-bold text-xs sm:text-sm text-slate-600 data-[state=active]:text-emerald-600 transition-all duration-200"
                    >
                      <span className="text-xs sm:text-sm">🆓</span> BASIC
                    </TabsTrigger>
                    <TabsTrigger
                      value="enterprise"
                      className="rounded-lg h-full data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center justify-center gap-1 font-bold text-xs sm:text-sm text-slate-600 data-[state=active]:text-purple-600 transition-all duration-200"
                    >
                      <span className="text-xs sm:text-sm">🏢</span> ENTERPRISE
                    </TabsTrigger>
                  </TabsList>

                  {initialView === "plans" && plans.map((plan) => (
                    <TabsContent key={plan.id} value={plan.id} className="mt-0">
                      <div className="relative max-w-xl mx-auto">
                        {plan.id === "pro" && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                            <Badge className="bg-green-600 text-white text-[8px] sm:text-xs shadow-sm ring-2 ring-background px-2 sm:px-3 py-0.5 uppercase tracking-wider">
                              ⭐ Most Popular
                            </Badge>
                          </div>
                        )}
                        {!plan.available && (
                          <div className="absolute -top-3 right-2 sm:right-4 z-10">
                            <Badge className="bg-amber-500 text-white text-[8px] sm:text-xs shadow-sm ring-2 ring-background">Upcoming</Badge>
                          </div>
                        )}

                        <div
                          className={`flex flex-col rounded-xl border-2 ${plan.color} bg-card p-3 sm:p-5 transition-all ring-2 ring-primary ring-offset-1 shadow-lg ${!plan.available ? 'opacity-70' : ''}`}
                        >
                          <div className="flex-grow">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 mb-2 sm:mb-3 border-b pb-2 sm:pb-3">
                              <div className="text-center sm:text-left min-w-0">
                                <div className="flex justify-center sm:justify-start items-center gap-1 sm:gap-2 mb-1">
                                  <span className="text-xl sm:text-3xl shrink-0">{plan.icon}</span>
                                  <h3 className="font-bold text-base sm:text-2xl truncate uppercase tracking-wide">{plan.name}</h3>
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground truncate">{plan.subtitle}</p>
                              </div>
                              <Badge
                                variant={plan.buttonVariant}
                                className={`text-xs sm:text-sm whitespace-nowrap border-none shrink-0 py-1 px-2 sm:py-1.5 sm:px-4 rounded-full ${plan.id === 'free' ? 'bg-secondary text-secondary-foreground' : 'bg-cyan-500 text-white hover:bg-cyan-600'
                                  }`}
                              >
                                {plan.price}
                              </Badge>
                            </div>

                            <div className="text-xs sm:text-sm space-y-2 sm:space-y-3 mb-2">
                              <div className="flex flex-col space-y-2 sm:space-y-3 bg-slate-50 p-2 sm:p-3 rounded-lg border border-slate-100">
                                <div className="flex items-center text-xs sm:text-sm font-medium">
                                  <span className="text-green-600 mr-1 sm:mr-2 bg-green-100 p-0.5 rounded-full text-xs">✓</span>
                                  <span>
                                    {plan.id === "free" ? "5,000 records" :
                                      plan.id === "pro" ? "50,000 records" :
                                        "Unlimited records"}
                                  </span>
                                </div>
                                {plan.id === "pro" && (
                                  <div className="space-y-2 sm:space-y-3">
                                    <div className="flex items-center text-xs sm:text-sm font-medium">
                                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-600 bg-blue-100 p-0.5 rounded-sm" />
                                      <span>30-day FREE trial</span>
                                    </div>
                                    <div className="flex items-center text-xs sm:text-sm font-medium">
                                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-600 bg-blue-100 p-0.5 rounded-sm" />
                                      <span>Phone verification required</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-dashed">
                                {/* Shiny Badges */}
                                <div className="text-center mb-2 sm:mb-4">
                                  <div className="inline-block transform transition-all hover:scale-105">
                                    {plan.id === "free" ?
                                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg px-2 sm:px-4 py-1 sm:py-2 shadow-sm">
                                        <span className="text-xs sm:text-base font-bold text-blue-700 tracking-wide uppercase">
                                          ✨ Life Time Free ✨
                                        </span>
                                      </div> :
                                      plan.id === "pro" ?
                                        <div className="bg-gradient-to-r from-amber-50 to-orange-100 border border-amber-200 rounded-lg px-2 sm:px-4 py-1 sm:py-2 shadow-sm">
                                          <span className="text-xs sm:text-base font-bold text-amber-700 tracking-wide uppercase">
                                            ✨ 30 Days FREE ✨
                                          </span>
                                        </div> :
                                        <div className="bg-gradient-to-r from-purple-50 to-pink-100 border border-purple-200 rounded-lg px-2 sm:px-4 py-1 sm:py-2 shadow-sm">
                                          <span className="text-xs sm:text-base font-bold text-purple-700 tracking-wide uppercase">
                                            ✨ Contact Pricing ✨
                                          </span>
                                        </div>
                                    }
                                  </div>
                                </div>

                                {/* Actions Group (Know More) */}
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-slate-700 hover:text-slate-900 font-medium py-2 sm:py-4 flex items-center justify-center gap-1 sm:gap-2 rounded-lg text-xs sm:text-sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id);
                                    }}
                                  >
                                    {expandedPlanId === plan.id ? (
                                      <>Show Less <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" /></>
                                    ) : (
                                      <>🔍 Know More <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" /></>
                                    )}
                                  </Button>
                                </div>

                                {/* Expanded Features List */}
                                <div
                                  className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedPlanId === plan.id ? 'max-h-[1000px] opacity-100 mt-2 sm:mt-4' : 'max-h-0 opacity-0'}`}
                                >
                                  <div className="bg-[#f8f9fa] rounded-xl p-2 sm:p-5 border border-slate-200 space-y-2 sm:space-y-3">
                                    {(detailedFeatures as any)[plan.id].map((feature: { text: string, included: boolean }, idx: number) => (
                                      <div key={idx} className={`flex items-start gap-2 sm:gap-3 text-xs sm:text-sm font-medium ${feature.included ? 'text-slate-800' : 'text-slate-400'}`}>
                                        {feature.included ? (
                                          <div className="bg-green-100 p-0.5 rounded-full mt-0.5 shrink-0">
                                            <Check className="h-2 w-2 sm:h-3 sm:w-3 text-green-700" />
                                          </div>
                                        ) : (
                                          <div className="bg-slate-100 p-0.5 rounded-full mt-0.5 shrink-0">
                                            <X className="h-2 w-2 sm:h-3 sm:w-3 text-slate-400" />
                                          </div>
                                        )}
                                        <span className="leading-snug">{feature.text}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                {initialView === "form" && formData.plan === "free" && (
                  <p className="text-xs sm:text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    <strong>BASIC (free):</strong> Database only — Overview, Rooms &amp; Bookings after login. Phone OTP required to register.
                  </p>
                )}
                {initialView === "form" && formData.plan === "pro" && (
                  <p className="text-xs sm:text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                    <strong>PRO:</strong> Full hotel system with 30-day free trial. Phone OTP required to register.
                  </p>
                )}
              </div>
            )}

            {basicOnly && (
              <p className="text-xs sm:text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <strong>BASIC (free):</strong> We will send a 6-digit OTP on WhatsApp to verify your phone. Password will be your phone number.
              </p>
            )}

            {/* Hotel Details - Only Username and Phone fields shown */}
            {(basicOnly || (isAvailablePlan && showForm)) && (
              <div className="space-y-4 pt-4 border-t border-dashed mt-4">
                <Label className="text-base sm:text-lg font-semibold">Registration Details</Label>

                {/* Phone Verification Status for FREE Plan */}
                {!basicOnly && formData.plan === "free" && otpData.isPhoneVerified && (
                  <Alert className="bg-green-50 border-green-200 text-xs sm:text-sm p-2 sm:p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 shrink-0" />
                      <AlertDescription className="text-green-800 text-xs sm:text-sm">
                        <strong>Phone Verified!</strong> Your phone {formatIndianPhone(formData.phone)} is verified.
                      </AlertDescription>
                    </div>
                  </Alert>
                )}

                {/* Phone Verification Status for PRO Plan */}
                {!basicOnly && formData.plan === "pro" && phoneOTPVerified && (
                  <Alert className="bg-green-50 border-green-200 text-xs sm:text-sm p-2 sm:p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 shrink-0" />
                      <AlertDescription className="text-green-800 text-xs sm:text-sm">
                        <strong>Phone Verified!</strong> Your phone {formatIndianPhone(formData.phone)} is verified for PRO plan.
                      </AlertDescription>
                    </div>
                  </Alert>
                )}

                {/* Hotel Details Form - Only Username and Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {[
                    {
                      id: "username",
                      label: "Username *",
                      placeholder: "Choose username"
                    },
                    {
                      id: "phone",
                      label: "Phone *",
                      type: "tel",
                      placeholder: "9876543210",
                      disabled: !basicOnly && (
                        (formData.plan === "free" && otpData.isPhoneVerified) ||
                        (formData.plan === "pro" && phoneOTPVerified)
                      )
                    },
                  ].map((f) => (
                    <div key={f.id} className="space-y-1">
                      <Label htmlFor={f.id} className="text-xs sm:text-sm">
                        {f.label}
                        {f.id === "phone" && formData.plan === "free" && otpData.isPhoneVerified && (
                          <CheckCircle className="h-3 w-3 text-green-500 inline ml-1" />
                        )}
                        {f.id === "phone" && formData.plan === "pro" && phoneOTPVerified && (
                          <CheckCircle className="h-3 w-3 text-green-500 inline ml-1" />
                        )}
                      </Label>
                      <Input
                        id={f.id}
                        type={f.type || "text"}
                        value={(formData as any)[f.id]}
                        onChange={(e) => handleChange(f.id, e.target.value)}
                        placeholder={f.placeholder}
                        required
                        disabled={f.disabled || false}
                        className={`text-sm sm:text-base h-9 sm:h-10 ${f.id === "username" && isDuplicateChecked && !isDuplicateValid && formData.username && formData.phone
                          ? 'border-red-500 focus:ring-red-500'
                          : f.id === "username" && isDuplicateChecked && isDuplicateValid && formData.username && formData.phone
                            ? 'border-green-500 focus:ring-green-500'
                            : ''
                          }`}
                      />

                      {/* Validation indicators for username */}
                      {f.id === "username" && formData.username && formData.phone && isDuplicateChecked && (
                        <div className="text-xs mt-1">
                          {isDuplicateValid ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Username and phone are available
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              This combination already exists
                            </span>
                          )}
                        </div>
                      )}

                      {/* Username suggestion */}
                      {f.id === "username" && usernameExists && suggestedUsername && suggestedUsername !== formData.username && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="flex items-start gap-2">
                            <Sparkles className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs text-blue-700">
                                <span className="font-medium">Username "{formData.username}"</span> is already taken.
                              </p>
                              <p className="text-xs text-blue-600 mt-1">
                                Try: <span className="font-mono font-bold">{suggestedUsername}</span>
                              </p>
                              <Button
                                type="button"
                                size="sm"
                                variant="link"
                                className="text-blue-600 hover:text-blue-800 p-0 h-auto mt-1 text-xs"
                                onClick={handleApplySuggestedUsername}
                              >
                                Use this suggestion
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {f.id === "username" && checkingDuplicate && (
                        <div className="text-xs mt-1 text-blue-600 flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Checking availability...
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Duplicate Check Info - Show only when both fields are filled */}
                {formData.username && formData.phone && !isDuplicateChecked && !checkingDuplicate && (
                  <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded border border-blue-100">
                    <p className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-blue-500" />
                      We'll check if this username and phone combination is available.
                    </p>
                  </div>
                )}

                {/* WhatsApp OTP Input — basic registration */}
                {basicOnly && showBasicOtpInput && (
                  <div className="space-y-3 sm:space-y-4 border rounded-lg p-3 sm:p-6 bg-gradient-to-br from-green-50 to-emerald-50">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                        <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm sm:text-lg">Verify via WhatsApp</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          OTP sent to <strong>{formatIndianPhone(formData.phone)}</strong>
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="basic-otp" className="text-sm sm:text-base">Enter 6-digit OTP</Label>
                      <div className="flex gap-2">
                        <Input
                          id="basic-otp"
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={basicOtp}
                          onChange={(e) => {
                            setBasicOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                            setBasicOtpError("");
                          }}
                          placeholder="000000"
                          className="text-center text-lg sm:text-2xl font-mono tracking-widest h-10 sm:h-14"
                          autoFocus
                        />
                      </div>
                      {basicOtpError && (
                        <Alert className="bg-red-50 border-red-200 text-xs sm:text-sm p-2 sm:p-3">
                          <AlertDescription className="text-red-800">{basicOtpError}</AlertDescription>
                        </Alert>
                      )}
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={handleSendBasicWhatsAppOTP}
                        disabled={isSendingBasicOtp}
                      >
                        Resend OTP on WhatsApp
                      </Button>
                    </div>
                  </div>
                )}

                {/* Phone OTP Input Section for PRO Plan */}
                {!basicOnly && formData.plan === "pro" && showPhoneOTPInput && !phoneOTPVerified && (
                  <div className="space-y-3 sm:space-y-4 border rounded-lg p-3 sm:p-6 bg-gradient-to-br from-purple-50 to-pink-50">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                        <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm sm:text-lg">Verify Your Phone for PRO Plan</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          OTP sent to <strong>{formatIndianPhone(formData.phone)}</strong>
                        </p>
                      </div>
                    </div>

                    <Alert className="bg-amber-50 border-amber-200 text-xs sm:text-sm p-2 sm:p-3">
                      <AlertDescription className="text-amber-800">
                        <div className="flex items-start gap-2">
                          <ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" />
                          <div className="text-xs sm:text-sm">
                            <strong>PRO Plan Trial:</strong> You'll get 30 days FREE trial.
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2 sm:space-y-3">
                      <Label htmlFor="phone-otp" className="text-sm sm:text-base">
                        Enter 6-digit OTP
                      </Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            id="phone-otp"
                            type="text"
                            inputMode="numeric"
                            pattern="\d*"
                            maxLength={6}
                            value={phoneOTP}
                            onChange={(e) => handlePhoneOtpChange(e.target.value)}
                            placeholder="000000"
                            className="text-center text-lg sm:text-2xl font-mono tracking-widest h-10 sm:h-14"
                            autoFocus
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={handleVerifyPhoneOTP}
                          disabled={phoneOTP.length !== 6 || isVerifyingPhoneOTP}
                          className="bg-green-600 hover:bg-green-700 h-10 sm:h-14 px-3 sm:px-4"
                        >
                          {isVerifyingPhoneOTP ? (
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          ) : (
                            "Verify"
                          )}
                        </Button>
                      </div>

                      <div className="flex justify-center pt-1 sm:pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowPhoneOTPInput(false);
                            setPhoneOTP("");
                          }}
                          className="text-xs sm:text-sm h-8 sm:h-9"
                        >
                          <ArrowLeft className="h-3 w-3 mr-1" />
                          Back to Form
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* SMS OTP Input Section for FREE Plan */}
                {!basicOnly && formData.plan === "free" && otpData.otpSent && !otpData.isPhoneVerified && (
                  <div className="space-y-3 sm:space-y-4 border rounded-lg p-3 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                        <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm sm:text-lg">Verify Your Phone</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          OTP sent to <strong>{formatIndianPhone(formData.phone)}</strong>
                        </p>
                      </div>
                    </div>

                    <Alert className="bg-amber-50 border-amber-200 text-xs sm:text-sm p-2 sm:p-3">
                      <AlertDescription className="text-amber-800">
                        <div className="flex items-start gap-2">
                          <ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" />
                          <div className="text-xs sm:text-sm">
                            <strong>Security Notice:</strong> OTP valid for 5 minutes.
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2 sm:space-y-3">
                      <Label htmlFor="otp" className="text-sm sm:text-base">
                        Enter 6-digit OTP
                      </Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            id="otp"
                            type="text"
                            inputMode="numeric"
                            pattern="\d*"
                            maxLength={6}
                            value={otpData.otp}
                            onChange={(e) => handleOtpChange(e.target.value)}
                            placeholder="000000"
                            className="text-center text-lg sm:text-2xl font-mono tracking-widest h-10 sm:h-14"
                            autoFocus
                          />
                          <div className="flex justify-between items-center mt-1 sm:mt-2">
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              {otpData.otpCountdown > 0 ? (
                                <span className="text-amber-600">
                                  Expires in {formatCountdown(otpData.otpCountdown)}
                                </span>
                              ) : (
                                <span className="text-red-600">OTP expired</span>
                              )}
                            </span>
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              onClick={handleSendOTP}
                              disabled={isSendingOtp || otpData.otpCountdown > 0 || otpData.otpResendCount >= otpData.maxOtpResends}
                              className="h-auto p-0 text-xs sm:text-sm"
                            >
                              {isSendingOtp ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Resend
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={handleVerifyOTP}
                          disabled={otpData.otp.length !== 6 || isVerifyingOtp}
                          className="bg-green-600 hover:bg-green-700 h-10 sm:h-14 px-3 sm:px-4"
                        >
                          {isVerifyingOtp ? (
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          ) : (
                            "Verify"
                          )}
                        </Button>
                      </div>

                      <div className="flex justify-center pt-1 sm:pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setOtpData(prev => ({
                              ...prev,
                              otpSent: false,
                              otp: "",
                              otpCountdown: 0
                            }));
                          }}
                          className="text-xs sm:text-sm h-8 sm:h-9"
                        >
                          <ArrowLeft className="h-3 w-3 mr-1" />
                          Back to Form
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {showForm && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onClose();
                  }}
                  disabled={isSubmitting || isSendingOtp || isVerifyingOtp || isSendingPhoneOTP || isVerifyingPhoneOTP || isSendingBasicOtp}
                  className="w-full sm:w-auto text-sm sm:text-base h-9 sm:h-10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitDisabled()}
                  className={`w-full sm:w-auto text-sm sm:text-base min-w-32 h-9 sm:h-10 ${!isAvailablePlan ? 'bg-amber-500 hover:bg-amber-600' :
                    formData.plan === 'pro' ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : ''
                    } ${!isDuplicateChecked || !isDuplicateValid ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  {checkingDuplicate ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    getButtonText()
                  )}
                </Button>
              </div>
            )}

            {/* Plan Summary */}
            {showForm && !basicOnly && (
              <div className={`text-xs sm:text-sm text-center p-2 sm:p-3 rounded ${formData.plan === 'enterprise'
                ? 'bg-amber-50 border border-amber-200 text-amber-800'
                : formData.plan === 'pro'
                  ? 'bg-blue-50 border border-blue-200 text-blue-800'
                  : 'bg-gray-50 border border-gray-200 text-gray-800'
                }`}>
                {formData.plan === 'enterprise' ? (
                  <div className="space-y-1">
                    <div className="font-semibold">ENTERPRISE Plan - Coming Soon!</div>
                    <div>Contact sales: <span className="font-medium">sales@hotelmanagementsystem.com</span></div>
                  </div>
                ) : formData.plan === 'pro' ? (
                  <div className="space-y-1">
                    <div className="font-semibold">PRO Plan - 30 Day FREE Trial</div>
                    <div className="text-xs">Phone verification required. Password is your phone number.</div>
                    {phoneOTPVerified && (
                      <div className="text-green-600 font-medium text-xs">
                        ✓ Phone verified
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="font-semibold">
                      BASIC Plan - Lifetime Free
                      {otpData.isPhoneVerified && (
                        <CheckCircle className="h-3 w-3 text-green-500 inline ml-1" />
                      )}
                    </div>
                    <div className="text-xs">Perfect for small hotels. Password is your phone number.</div>
                  </div>
                )}
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* Duplicate Warning Popup */}
      <DuplicateWarningPopup />

      {/* Welcome Screen Modal */}
      <Dialog open={showWelcomeScreen} onOpenChange={() => setShowWelcomeScreen(false)}>
        <WelcomeScreen />
      </Dialog>
    </>
  );
};

export default RegisterModal;