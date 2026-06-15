




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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  Gift, Check, Info, ChevronDown, ChevronUp, X, Star
} from "lucide-react";

interface RegisterModalProps {
  open: boolean;
  onClose: () => void;
  onTryDemo?: () => void;
}

// Google Apps Script URL for FREE plan
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwA1sC2rREM50Ri9p0r-tWy3Jz-RSe39N9iu90qiRopKUvJ17fxYptB4yhbfQOBM62z/exec";

// Node.js backend URL
const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const RegisterModal = ({ open, onClose, onTryDemo }: RegisterModalProps) => {
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
    plan: "pro", // Default to PRO plan
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

  // Email OTP states for PRO plan
  const [emailOTP, setEmailOTP] = useState("");
  const [emailOTPVerified, setEmailOTPVerified] = useState(false);
  const [showEmailOTPInput, setShowEmailOTPInput] = useState(false);
  const [showForm, setShowForm] = useState(true);

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSendingEmailOTP, setIsSendingEmailOTP] = useState(false);
  const [isVerifyingEmailOTP, setIsVerifyingEmailOTP] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);

  const [referralCode, setReferralCode] = useState('');
  const [referralValidating, setReferralValidating] = useState(false);
  const [referralValid, setReferralValid] = useState(false);
  const [referralDetails, setReferralDetails] = useState<any>(null);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  // OTP Countdown Timer for SMS
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpData.otpCountdown > 0) {
      interval = setInterval(() => {
        setOtpData(prev => ({
          ...prev,
          otpCountdown: prev.otpCountdown - 1
        }));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpData.otpCountdown]);

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

    // Reset verification states when email or phone changes
    if (field === "email") {
      setEmailOTPVerified(false);
      setShowEmailOTPInput(false);
      setEmailOTP("");
    }
    if (field === "phone") {
      setOtpData(prev => ({
        ...prev,
        isPhoneVerified: false,
        otpSent: false,
        otp: ""
      }));
      setShowOtpInput(false);
    }
  };

  const handleOtpChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setOtpData(prev => ({ ...prev, otp: numericValue }));
  };

  const handleEmailOtpChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setEmailOTP(numericValue);
  };

  // Plan change handler
  const handlePlanChange = (value: string) => {
    handleChange("plan", value);
    setShowForm(false);

    // Reset verification states when plan changes
    if (value === "free") {
      // Reset PRO plan states
      setEmailOTPVerified(false);
      setShowEmailOTPInput(false);
      setEmailOTP("");
    } else if (value === "pro") {
      // Reset FREE plan states
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
        formData.email,
        formData.hotelName,
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

    setIsVerifyingOtp(true);
    try {
      const response = await verifySMSOTP(cleanPhone, formData.email, otpData.otp);

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

  // Send Email OTP for PRO plan
  const handleSendEmailOTP = async () => {
    if (!formData.email) {
      toast({
        title: "Email Required",
        description: "Please enter your email to receive OTP",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsSendingEmailOTP(true);
    try {
      const response = await fetch(`${NODE_BACKEND_URL}/hotels/send-pro-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          hotelName: formData.hotelName,
          adminName: formData.adminName
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowEmailOTPInput(true);
        toast({
          title: "OTP Sent Successfully! 📧",
          description: `We've sent a 6-digit OTP to ${formData.email}`,
          variant: "default",
        });
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
      setIsSendingEmailOTP(false);
    }
  };

  // Send OTP via Email AND WhatsApp for PRO plan
  const handleSendProPlanOTP = async () => {
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

    // Auto-generate missing fields for backend validation if they were removed from UI
    const autoEmail = formData.email || `${formData.username.replace(/\s+/g, '')}@hotel.com`;
    const autoHotelName = formData.hotelName || `${formData.username} Hotel`;
    const autoAdminName = formData.adminName || formData.username;

    // Phone is mandatory for WhatsApp
    const cleanPhone = formData.phone ? formData.phone.replace(/\D/g, '') : null;

    setIsSendingEmailOTP(true);
    try {
      // Use the new endpoint that sends both Email AND WhatsApp
      const response = await fetch(`${NODE_BACKEND_URL}/hotels/send-pro-otp-whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: autoEmail,
          hotelName: autoHotelName,
          adminName: autoAdminName,
          phone: cleanPhone // Include phone for WhatsApp
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowEmailOTPInput(true);

        // Build success message based on delivery channels
        let successMessage = `OTP sent to ${formData.email}`;
        if (data.data?.delivery?.whatsapp?.sent) {
          const formattedPhone = formData.phone ?
            `+91 ${formData.phone.slice(0, 3)}-${formData.phone.slice(3, 6)}-${formData.phone.slice(6)}` :
            'your WhatsApp';
          successMessage += ` and 📱 ${formattedPhone}`;
        }

        toast({
          title: "OTP Sent Successfully! 📧📱",
          description: successMessage,
          variant: "default",
        });

        // Log which channels worked
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
      setIsSendingEmailOTP(false);
    }
  };

  // Verify Email/Phone OTP for PRO plan
  const handleVerifyEmailOTP = async () => {
    if (!emailOTP || emailOTP.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    const autoEmail = formData.email || `${formData.username.replace(/\s+/g, '')}@hotel.com`;

    setIsVerifyingEmailOTP(true);
    try {
      const response = await fetch(`${NODE_BACKEND_URL}/hotels/verify-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: autoEmail,
          otp: emailOTP
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEmailOTPVerified(true);
        setShowEmailOTPInput(false);
        toast({
          title: "Email Verified Successfully! ✅",
          description: "Your email has been verified for PRO plan",
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
      setIsVerifyingEmailOTP(false);
    }
  };

  // Main submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      if (!emailOTPVerified) {
        if (!showEmailOTPInput) {
          await handleSendProPlanOTP();
          return;
        } else {
          await handleVerifyEmailOTP();
          return;
        }
      }
    }

    // If all validations pass, complete registration
    await completeRegistration();
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
      const autoPassword = formData.password || cleanPhone; // Use phone as default pass if empty

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

      // Add email OTP for PRO plan verification
      if (formData.plan === "pro") {
        (hotelData as any).emailOTP = emailOTP;
        console.log("📤 [PRO REGISTRATION] Sending OTP:", emailOTP);
        console.log("📤 [PRO REGISTRATION] Email:", autoEmail);
      }

      let data;

      if (formData.plan === "free") {
        console.log("FREE plan selected - Saving to Google Sheets");

        const paramObj: Record<string, unknown> = {
          action: "createHotel",
          ...hotelData,
          "admin[status]": "active"
        };

        const queryString = buildQueryString(paramObj);
        const url = APPS_SCRIPT_URL + "?" + queryString;

        console.log("Sending to Google Apps Script:", url);
        data = await jsonpRequest(url);

      } else {
        console.log("PRO plan selected - Saving to MySQL Database");
        console.log("Sending to Node.js backend:", hotelData);

        data = await fetchBackendRequest("/hotels/register", hotelData);
      }

      if (data.success) {
        let message = '';
        if (formData.plan === 'pro') {
          message = `${autoHotelName} has been registered with PRO Plan (30-day FREE trial). Your default password is your phone number.`;
        } else {
          message = `${autoHotelName} is now on FREE Plan. Your default password is your phone number. You can login now.`;
        }

        toast({
          title: `Registration Successful! 🎉`,
          description: message,
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

        // Reset OTP states
        setOtpData({
          otp: "",
          isPhoneVerified: false,
          otpSent: false,
          otpCountdown: 0,
          otpResendCount: 0,
          maxOtpResends: 3,
        });

        setEmailOTP("");
        setEmailOTPVerified(false);
        setShowEmailOTPInput(false);
        setShowOtpInput(false);
        setShowForm(false);

        onClose();
        navigate("/login");

      } else {
        if (data.error === "HOTEL_EXISTS") {
          toast({
            title: "Registration Failed",
            description: "Hotel already registered. Try a different name.",
            variant: "destructive",
          });
        } else if (data.error === "USERNAME_EXISTS") {
          toast({
            title: "Username Taken",
            description: "This username is already in use. Choose another one.",
            variant: "destructive",
          });
        } else if (data.error === "INVALID_OTP") {
          toast({
            title: "OTP Verification Failed",
            description: "Please verify your email OTP again",
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
    if (!isAvailablePlan) return 'Upcoming';

    if (isSubmitting) return 'Registering...';
    if (isSendingOtp) return 'Sending SMS OTP...';
    if (isVerifyingOtp) return 'Verifying SMS OTP...';
    if (isSendingEmailOTP) return 'Sending Email OTP...';
    if (isVerifyingEmailOTP) return 'Verifying Email OTP...';

    if (formData.plan === "free") {
      if (!otpData.isPhoneVerified) {
        if (!showOtpInput) {
          return 'Send SMS OTP to Register';
        } else {
          return 'Verify SMS OTP & Register';
        }
      }
    } else if (formData.plan === "pro") {
      if (!emailOTPVerified) {
        if (!showEmailOTPInput) {
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
    if (!isAvailablePlan) return true;
    if (isSubmitting || isSendingOtp || isVerifyingOtp || isSendingEmailOTP || isVerifyingEmailOTP) return true;

    if (formData.plan === "free" && showOtpInput && !otpData.isPhoneVerified) {
      return otpData.otp.length !== 6;
    }

    if (formData.plan === "pro" && showEmailOTPInput && !emailOTPVerified) {
      return emailOTP.length !== 6;
    }

    return false;
  };

  return (

    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] mx-auto sm:max-w-6xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="px-0 sm:px-2">
          <DialogTitle className="text-lg sm:text-xl">Register New Hotel</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Choose your plan and fill in details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Plan Selection Header - Mobile Optimized */}
          {!showForm && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base sm:text-lg font-semibold">Choose Your Plan</Label>
                {onTryDemo && (
                  <Button
                    type="button"
                    size="lg"
                    className="animate-fast-pulse bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 font-bold shadow-lg px-4 py-5 sm:px-6 sm:py-5 text-sm sm:text-base rounded-xl transition-all"
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
                <TabsList className="grid w-full grid-cols-3 mb-4 h-16 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
                  <TabsTrigger
                    value="pro"
                    className="rounded-lg h-full data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center justify-center gap-1.5 font-bold text-[10px] sm:text-sm text-slate-600 data-[state=active]:text-blue-600 transition-all duration-200"
                  >
                    <Star className="h-3.5 w-3.5 fill-current" /> PRO
                  </TabsTrigger>
                  <TabsTrigger
                    value="free"
                    className="rounded-lg h-full data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center justify-center gap-1.5 font-bold text-[10px] sm:text-sm text-slate-600 data-[state=active]:text-emerald-600 transition-all duration-200"
                  >
                    <span className="text-xs sm:text-sm">🆓</span> BASIC
                  </TabsTrigger>
                  <TabsTrigger
                    value="enterprise"
                    className="rounded-lg h-full data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center justify-center gap-1.5 font-bold text-[10px] sm:text-sm text-slate-600 data-[state=active]:text-purple-600 transition-all duration-200"
                  >
                    <span className="text-xs sm:text-sm">🏢</span> ENTERPRISE
                  </TabsTrigger>
                </TabsList>

                {plans.map((plan) => (
                  <TabsContent key={plan.id} value={plan.id} className="mt-0">
                    <div className="relative max-w-xl mx-auto">
                      {plan.id === "pro" && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                          <Badge className="bg-green-600 text-white text-[10px] sm:text-xs shadow-sm ring-2 ring-background px-3 py-0.5 uppercase tracking-wider">
                            ⭐ Most Popular
                          </Badge>
                        </div>
                      )}
                      {!plan.available && (
                        <div className="absolute -top-3 right-4 z-10">
                          <Badge className="bg-amber-500 text-white text-[10px] sm:text-xs shadow-sm ring-2 ring-background">Upcoming</Badge>
                        </div>
                      )}

                      <div
                        className={`flex flex-col rounded-xl border-2 ${plan.color} bg-card p-4 sm:p-5 transition-all ring-2 ring-primary ring-offset-1 sm:ring-offset-2 shadow-lg ${!plan.available ? 'opacity-70' : ''}`}
                      >
                        <div className="flex-grow">
                          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-3 border-b pb-3">
                            <div className="text-center sm:text-left min-w-0">
                              <div className="flex justify-center sm:justify-start items-center gap-2 mb-1">
                                <span className="text-2xl sm:text-3xl shrink-0">{plan.icon}</span>
                                <h3 className="font-bold text-lg sm:text-2xl truncate uppercase tracking-wide">{plan.name}</h3>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">{plan.subtitle}</p>
                            </div>
                            <Badge
                              variant={plan.buttonVariant}
                              className={`text-xs sm:text-sm whitespace-nowrap border-none shrink-0 py-1.5 px-4 rounded-full ${plan.id === 'free' ? 'bg-secondary text-secondary-foreground' : 'bg-cyan-500 text-white hover:bg-cyan-600'
                                }`}
                            >
                              {plan.price}
                            </Badge>
                          </div>

                          <div className="text-sm space-y-3 mb-2">
                            <div className="flex flex-col space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                              <div className="flex items-center text-sm font-medium">
                                <span className="text-green-600 mr-2 bg-green-100 p-0.5 rounded-full">✓</span>
                                <span>
                                  {plan.id === "free" ? "5,000 records" :
                                    plan.id === "pro" ? "50,000 records" :
                                      "Unlimited records"}
                                </span>
                              </div>
                              {plan.id === "pro" && (
                                <div className="space-y-3">
                                  <div className="flex items-center text-sm font-medium">
                                    <Calendar className="h-4 w-4 mr-2 text-blue-600 bg-blue-100 p-0.5 rounded-sm" />
                                    <span>30-day FREE trial</span>
                                  </div>
                                  <div className="flex items-center text-sm font-medium">
                                    <Phone className="h-4 w-4 mr-2 text-blue-600 bg-blue-100 p-0.5 rounded-sm" />
                                    <span>Phone verification required</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-dashed">
                              {/* Shiny Badges */}
                              <div className="text-center mb-4">
                                <div className="inline-block transform transition-all hover:scale-105">
                                  {plan.id === "free" ?
                                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg px-4 py-2 shadow-sm">
                                      <span className="text-sm sm:text-base font-bold text-blue-700 tracking-wide uppercase">
                                        ✨ Life Time Free ✨
                                      </span>
                                    </div> :
                                    plan.id === "pro" ?
                                      <div className="bg-gradient-to-r from-amber-50 to-orange-100 border border-amber-200 rounded-lg px-4 py-2 shadow-sm">
                                        <span className="text-sm sm:text-base font-bold text-amber-700 tracking-wide uppercase">
                                          ✨ 30 Days FREE ✨
                                        </span>
                                      </div> :
                                      <div className="bg-gradient-to-r from-purple-50 to-pink-100 border border-purple-200 rounded-lg px-4 py-2 shadow-sm">
                                        <span className="text-sm sm:text-base font-bold text-purple-700 tracking-wide uppercase">
                                          ✨ Contact Pricing ✨
                                        </span>
                                      </div>
                                  }
                                </div>
                              </div>

                              {/* Actions Group (Know More & Register) */}
                              <div className="flex flex-col sm:flex-row gap-3">


                                {!showForm && plan.available && (
                                  <Button
                                    type="button"
                                    onClick={() => setShowForm(true)}
                                    size="sm"
                                    className={`flex-1 py-4 text-sm sm:text-base font-bold tracking-wide shadow-md rounded-lg text-white ${plan.id === 'pro' || plan.id === 'enterprise'
                                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                                      : 'bg-primary hover:bg-primary/90'
                                      }`}
                                  >
                                    Register Now
                                  </Button>
                                )}
                              </div>

                              {/* Expanded Features List */}
                              <div
                                className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedPlanId === plan.id ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
                              >
                                <div className="bg-[#f8f9fa] rounded-xl p-4 sm:p-5 border border-slate-200 space-y-3">
                                  {(detailedFeatures as any)[plan.id].map((feature: { text: string, included: boolean }, idx: number) => (
                                    <div key={idx} className={`flex items-start gap-3 text-xs sm:text-sm font-medium ${feature.included ? 'text-slate-800' : 'text-slate-400'}`}>
                                      {feature.included ? (
                                        <div className="bg-green-100 p-0.5 rounded-full mt-0.5 shrink-0">
                                          <Check className="h-3 w-3 text-green-700" />
                                        </div>
                                      ) : (
                                        <div className="bg-slate-100 p-0.5 rounded-full mt-0.5 shrink-0">
                                          <X className="h-3 w-3 text-slate-400" />
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
            </div>
          )}

          {/* Hotel Details - Mobile Optimized */}

          {isAvailablePlan && showForm && (
            <div className="space-y-4">
              <Label className="text-base sm:text-lg font-semibold">Hotel & Admin Details</Label>

              {/* Phone Verification Status for FREE Plan */}
              {formData.plan === "free" && otpData.isPhoneVerified && (
                <Alert className="bg-green-50 border-green-200 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Phone Verified!</strong> Your phone {formatIndianPhone(formData.phone)} is verified.
                    </AlertDescription>
                  </div>
                </Alert>
              )}



              {/* Hotel Details Form - Mobile Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {[
                  { id: "username", label: "Username *", placeholder: "Choose username" },
                  {
                    id: "phone",
                    label: "Phone *",
                    type: "tel",
                    placeholder: "9876543210",
                    disabled: formData.plan === "free" && otpData.isPhoneVerified
                  },
                ].map((f) => (
                  <div key={f.id} className="space-y-1 sm:space-y-2">
                    <Label htmlFor={f.id} className="text-xs sm:text-sm">
                      {f.label}
                      {f.id === "phone" && formData.plan === "free" && otpData.isPhoneVerified && (
                        <CheckCircle className="h-3 w-3 text-green-500 inline ml-1" />
                      )}
                      {f.id === "email" && formData.plan === "pro" && emailOTPVerified && (
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
                      className="text-sm sm:text-base"
                    />
                  </div>
                ))}
              </div>

              {/* Email OTP Input Section for PRO Plan */}
              {formData.plan === "pro" && showEmailOTPInput && !emailOTPVerified && (
                <div className="space-y-4 border rounded-lg p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-pink-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base sm:text-lg">Verify Your Phone for PRO Plan</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        OTP sent to <strong>{formatIndianPhone(formData.phone)}</strong>
                      </p>
                    </div>
                  </div>

                  <Alert className="bg-amber-50 border-amber-200 text-xs sm:text-sm">
                    <AlertDescription className="text-amber-800">
                      <div className="flex items-start gap-2">
                        <ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>PRO Plan Trial:</strong> You'll get 30 days FREE trial.
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <Label htmlFor="email-otp" className="text-sm sm:text-base">
                      Enter 6-digit OTP
                    </Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          id="email-otp"
                          type="text"
                          inputMode="numeric"
                          pattern="\d*"
                          maxLength={6}
                          value={emailOTP}
                          onChange={(e) => handleEmailOtpChange(e.target.value)}
                          placeholder="000000"
                          className="text-center text-xl sm:text-2xl font-mono tracking-widest h-12 sm:h-14"
                          autoFocus
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleVerifyEmailOTP}
                        disabled={emailOTP.length !== 6 || isVerifyingEmailOTP}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isVerifyingEmailOTP ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    </div>

                    <div className="flex justify-center pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowEmailOTPInput(false);
                          setEmailOTP("");
                        }}
                        className="text-xs sm:text-sm"
                      >
                        <ArrowLeft className="h-3 w-3 mr-1" />
                        Back to Form
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* SMS OTP Input Section for FREE Plan - Always show when OTP is sent */}
              {formData.plan === "free" && otpData.otpSent && !otpData.isPhoneVerified && (
                <div className="space-y-4 border rounded-lg p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base sm:text-lg">Verify Your Phone</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        OTP sent to <strong>{formatIndianPhone(formData.phone)}</strong>
                      </p>
                    </div>
                  </div>

                  <Alert className="bg-amber-50 border-amber-200 text-xs sm:text-sm">
                    <AlertDescription className="text-amber-800">
                      <div className="flex items-start gap-2">
                        <ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>Security Notice:</strong> OTP valid for 5 minutes.
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
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
                          className="text-center text-xl sm:text-2xl font-mono tracking-widest h-12 sm:h-14"
                          autoFocus
                        />
                        <div className="flex justify-between items-center mt-2">
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
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isVerifyingOtp ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    </div>

                    <div className="flex justify-center pt-2">
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
                        className="text-xs sm:text-sm"
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
            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onClose();
                  setShowForm(false);
                }}
                disabled={isSubmitting || isSendingOtp || isVerifyingOtp || isSendingEmailOTP || isVerifyingEmailOTP}
                className="w-full sm:w-auto text-sm sm:text-base"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitDisabled()}
                className={`w-full sm:w-auto text-sm sm:text-base min-w-32 ${!isAvailablePlan ? 'bg-amber-500 hover:bg-amber-600' :
                  formData.plan === 'pro' ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : ''
                  }`}
              >
                {getButtonText()}
              </Button>
            </div>
          )}

          {/* Plan Summary - Mobile Optimized */}
          {showForm && (
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
                  <div>Phone verification required.</div>
                  {emailOTPVerified && (
                    <div className="text-green-600 font-medium">
                      ✓ Phone verified
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="font-semibold">
                    BASIC Plan
                    {otpData.isPhoneVerified && (
                      <CheckCircle className="h-3 w-3 text-green-500 inline ml-1" />
                    )}
                  </div>
                  <div>Perfect for small hotels. Phone verification required.</div>
                </div>
              )}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterModal;