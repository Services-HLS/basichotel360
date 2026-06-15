import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Star, Check, Zap, Shield, MessageCircle, BarChart3, Palette } from 'lucide-react';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  currentHotel?: {
    id: string;
    name: string;
    adminName: string;
    email: string;
    phone: string;
  };
}

// Node.js backend URL for pro plan upgrade
const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL ;

async function fetchBackendRequest(endpoint: string, data: any): Promise<any> {
  const response = await fetch(`${NODE_BACKEND_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const responseText = await response.text();

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

const UpgradeModal = ({ open, onClose, currentHotel }: UpgradeModalProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    hotelName: currentHotel?.name || "",
    adminName: currentHotel?.adminName || "",
    email: currentHotel?.email || "",
    phone: currentHotel?.phone || "",
    password: "",
    confirmPassword: "",
    paymentMethod: "card",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: Plan details, 2: Payment, 3: Success

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const proPlanFeatures = [
    {
      icon: Zap,
      title: "Advanced Dashboard",
      description: "Real-time analytics and performance metrics"
    },
    {
      icon: MessageCircle,
      title: "AI Assistant",
      description: "Smart recommendations and automated responses"
    },
    {
      icon: Shield,
      title: "WhatsApp Reminders",
      description: "Automated guest communication and reminders"
    },
    {
      icon: BarChart3,
      title: "Financial Reports",
      description: "Complete financial module with detailed reports"
    },
    {
      icon: Palette,
      title: "Custom Branding",
      description: "Upload your logo and customize the interface"
    },
    {
      icon: Star,
      title: "Priority Support",
      description: "Dedicated support with faster response times"
    }
  ];

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const upgradeData = {
        hotelName: formData.hotelName.trim(),
        admin: {
          name: formData.adminName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
        },
        plan: "pro",
        upgradeFrom: "basic",
        paymentMethod: formData.paymentMethod,
      };

      console.log("Upgrading to Pro plan:", upgradeData);
      
      const data = await fetchBackendRequest("/hotels/upgrade", upgradeData);

      if (data.success) {
        setStep(3); // Success step
        toast({
          title: "🎉 Upgrade Successful!",
          description: "Your hotel has been upgraded to Pro Plan. Enjoy all the advanced features!",
        });
        
        // Update local storage with new plan
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        localStorage.setItem('currentUser', JSON.stringify({
          ...currentUser,
          plan: 'pro'
        }));
        
      } else {
        throw new Error(data.message || "Failed to upgrade plan");
      }
    } catch (err: any) {
      console.error("Upgrade error:", err);
      
      let errorMessage = err.message || "Something went wrong during upgrade.";
      
      if (err.message.includes("Failed to fetch")) {
        errorMessage = "Cannot connect to the server. Please check if the backend is running.";
      }
      
      toast({
        title: "Upgrade Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartOver = () => {
    setStep(1);
    setFormData({
      hotelName: currentHotel?.name || "",
      adminName: currentHotel?.adminName || "",
      email: currentHotel?.email || "",
      phone: currentHotel?.phone || "",
      password: "",
      confirmPassword: "",
      paymentMethod: "card",
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Step 1: Plan Details */}
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-center">Upgrade to Pro Plan</DialogTitle>
              <DialogDescription className="text-center text-lg">
                Unlock powerful features to grow your hotel business
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Features List */}
              <div className="space-y-6">
                <div className="text-center p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white">
                  <Star className="w-12 h-12 mx-auto mb-4" fill="white" />
                  <h3 className="text-2xl font-bold mb-2">Pro Plan</h3>
                  <div className="text-3xl font-bold">₹999<span className="text-lg">/month</span></div>
                  {/* <p className="text-blue-100 mt-2">14-day free trial • No credit card required</p> */}
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Everything in Pro:</h4>
                  {proPlanFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <feature.icon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">{feature.title}</div>
                        <div className="text-sm text-gray-600">{feature.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits Comparison */}
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">🚀 Why Upgrade?</h4>
                  <div className="space-y-2 text-sm text-yellow-700">
                    <div className="flex items-center">
                      <Check className="w-4 h-4 mr-2" />
                      <span>Migrate from Google Sheets to secure MySQL Database</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="w-4 h-4 mr-2" />
                      <span>Handle up to 50,000 records (10x more than Basic)</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="w-4 h-4 mr-2" />
                      <span>Advanced calendar with interactive booking</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="w-4 h-4 mr-2" />
                      <span>AI-powered insights and automation</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-600">Current Plan</div>
                    <div className="font-bold text-red-600">Basic</div>
                    <div className="text-xs text-gray-500">Google Sheets</div>
                  </div>
                  <div className="p-4 border-2 border-green-500 rounded-lg bg-green-50">
                    <div className="text-sm text-gray-600">Upgrading To</div>
                    <div className="font-bold text-green-600">Pro</div>
                    <div className="text-xs text-gray-500">MySQL Database</div>
                  </div>
                </div>

                <Button 
                  onClick={() => setStep(2)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 text-lg"
                  size="lg"
                >
                  <Star className="w-5 h-5 mr-2" />
                  Continue to Upgrade
                </Button>

                <div className="text-center text-sm text-gray-500">
                  🔒 Secure process • No hidden fees • Cancel anytime
                </div>
              </div>
            </div>
          </>
        )}

        {/* Step 2: Upgrade Form */}
        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Complete Your Upgrade</DialogTitle>
              <DialogDescription>
                Fill in your details to upgrade to Pro Plan
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpgrade} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: "hotelName", label: "Hotel Name *", value: formData.hotelName },
                  { id: "adminName", label: "Admin Name *", value: formData.adminName },
                  { id: "email", label: "Email *", type: "email", value: formData.email },
                  { id: "phone", label: "Phone *", type: "tel", value: formData.phone },
                  { id: "password", label: "Password *", type: "password", value: formData.password },
                  { id: "confirmPassword", label: "Confirm Password *", type: "password", value: formData.confirmPassword },
                ].map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id}>{field.label}</Label>
                    <Input
                      id={field.id}
                      type={field.type || "text"}
                      value={field.value}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-semibold">Payment Method</Label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: "card", label: "Credit Card", icon: "💳" },
                    { id: "upi", label: "UPI", icon: "📱" },
                    { id: "netbanking", label: "Net Banking", icon: "🏦" },
                  ].map((method) => (
                    <div key={method.id}>
                      <input
                        type="radio"
                        id={`payment-${method.id}`}
                        name="paymentMethod"
                        value={method.id}
                        checked={formData.paymentMethod === method.id}
                        onChange={(e) => handleChange("paymentMethod", e.target.value)}
                        className="hidden"
                      />
                      <Label
                        htmlFor={`payment-${method.id}`}
                        className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.paymentMethod === method.id 
                            ? "border-blue-500 bg-blue-50" 
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <span className="text-2xl mb-2">{method.icon}</span>
                        <span className="text-sm font-medium">{method.label}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span>Pro Plan Subscription</span>
                  <span className="font-semibold">₹999/month</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>14-day free trial</span>
                  <span>₹0 for first 14 days</span>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="min-w-32 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Upgrading...
                    </>
                  ) : (
                    'Complete Upgrade'
                  )}
                </Button>
              </div>
            </form>
          </>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-center text-green-600">
                🎉 Upgrade Successful!
              </DialogTitle>
            </DialogHeader>

            <div className="text-center space-y-6 py-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-2">Welcome to Pro Plan!</h3>
                <p className="text-gray-600">
                  Your hotel <strong>{formData.hotelName}</strong> has been successfully upgraded to Pro Plan.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">What happens next:</h4>
                <ul className="text-sm text-green-700 space-y-1 text-left">
                  <li>• Your data is being migrated from Google Sheets to MySQL Database</li>
                  <li>• All Pro features are now activated</li>
                  <li>• You can access the interactive calendar immediately</li>
                  <li>• AI Assistant will be available in 2-3 minutes</li>
                </ul>
              </div>

              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={handleStartOver}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Continue to Dashboard
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    handleStartOver();
                    navigate('/features');
                  }}
                >
                  Explore Features
                </Button>
              </div>

              <p className="text-sm text-gray-500">
                Need help? Contact our support team at support@hotelmanager.com
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;