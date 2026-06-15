// components/ForgotPassword.tsx - Add hotel selection

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Mail, 
  Loader2, 
  ArrowLeft, 
  CheckCircle, 
  Hotel,
  User,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL ;

interface HotelOption {
  hotelId: number;
  hotelName: string;
  userName: string;
  userRole: string;
  status: string;
}

const ForgotPassword = () => {
  const { toast } = useToast();
  
  const [step, setStep] = useState<'email' | 'hotel-selection' | 'success'>('email');
  const [email, setEmail] = useState("");
  const [hotels, setHotels] = useState<HotelOption[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    try {
      setIsLoading(true);
      console.log("🔐 [FRONTEND] Checking email:", email);

      const response = await fetch(`${NODE_BACKEND_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.requiresHotelSelection) {
        // Multiple hotels found - show selection
        setHotels(data.data.hotels);
        setStep('hotel-selection');
        console.log("🏨 Multiple hotels found:", data.data.hotels);
      } else if (response.ok) {
        // Single hotel or no user - show success
        setStep('success');
        toast({
          title: "Reset Link Sent",
          description: data.message,
        });
      } else {
        throw new Error(data.message || "Request failed");
      }

    } catch (error: any) {
      console.error("❌ Error:", error);
      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleHotelSelect = async (hotelId: number) => {
    setSelectedHotelId(hotelId);
    
    try {
      setIsLoading(true);
      console.log("🏨 Selected hotel:", hotelId, "for email:", email);

      const response = await fetch(`${NODE_BACKEND_URL}/auth/forgot-password-with-hotel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, hotelId }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep('success');
        toast({
          title: "Reset Link Sent",
          description: data.message,
        });
      } else {
        throw new Error(data.message || "Failed to send reset link");
      }

    } catch (error: any) {
      console.error("❌ Error:", error);
      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>
              We've sent a reset link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/login">
              <Button className="w-full">Back to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Hotel selection step
  if (step === 'hotel-selection') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Select Your Hotel</CardTitle>
            <CardDescription className="text-center">
              Multiple accounts found for <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p>Please select which hotel account you want to reset:</p>
            </div>
            
            <div className="space-y-3">
              {hotels.map((hotel) => (
                <button
                  key={hotel.hotelId}
                  onClick={() => handleHotelSelect(hotel.hotelId)}
                  disabled={isLoading}
                  className="w-full p-4 border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left disabled:opacity-50"
                >
                  <div className="flex items-start gap-3">
                    <Hotel className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{hotel.hotelName}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{hotel.userName}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Shield className="w-4 h-4 text-gray-500" />
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                          {hotel.userRole}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          hotel.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {hotel.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => setStep('email')}
              className="w-full mt-4"
            >
              Use Different Email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Email input step
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Forgot Password?</CardTitle>
          <CardDescription className="text-center">
            Enter your email to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Checking...</span>
                </div>
              ) : (
                "Continue"
              )}
            </Button>

            <Link to="/login" className="block text-center text-sm text-blue-600 hover:underline">
              Back to Login
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;