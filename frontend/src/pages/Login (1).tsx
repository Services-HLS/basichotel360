

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom"; // Add Link import
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Hotel, Loader2, User, Lock, Eye, EyeOff, Clock,
  Database, Sheet, HelpCircle // Add HelpCircle icon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import RegisterModal from "@/components/RegisterModal";
import { cn } from "@/lib/utils";

// URLs
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyzexlVpr_2umhzBdpoW4juzQo4rj2zB1pU3vlz6wqY78YQX3d2BFntfiV7dgLf6PvC/exec";
const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"database" | "google">("database");
  const [showRegisterModal, setShowRegisterModal] = useState(false);


  useEffect(() => {
    const checkExistingSession = () => {
      const token = localStorage.getItem('authToken');
      const user = localStorage.getItem('currentUser');

      if (token && user) {
        console.log("✅ Existing session found, redirecting to dashboard");
        navigate("/dashboard", { replace: true });
      }
    };

    checkExistingSession();
  }, [navigate]);

  useEffect(() => {
    const shouldShowRegister = localStorage.getItem('showRegisterModal');
    if (shouldShowRegister === 'true') {
      setShowRegisterModal(true);
      localStorage.removeItem('showRegisterModal');

      toast({
        title: "Register for Pro",
        description: "Complete your hotel registration to access Pro features",
      });
    }
  }, [toast]);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-y-auto py-4 sm:py-6 md:py-8 font-sans">
      {/* Background Image - Luxury Hotel Warm Tone */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=2070&auto=format&fit=crop')`
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
      </div>


      {/* Glassmorphism Signin Card */}
      <Card className="relative z-10 w-full max-w-[90%] sm:max-w-md mx-auto my-4 sm:my-6 border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden">
        <CardHeader className="flex flex-col items-center space-y-1 sm:space-y-2 pt-6 sm:pt-8 md:pt-10 pb-2 sm:pb-3 md:pb-4 px-4 sm:px-6">

          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-white/10 flex items-center justify-center mb-1 sm:mb-2 backdrop-blur-md border border-white/5">
            <Hotel className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
          </div>


          <div className="text-center">
            <CardTitle className="text-xl sm:text-2xl font-bold text-white tracking-wide">
              Hotel Management
            </CardTitle>
            <CardDescription className="text-gray-300 mt-0.5 sm:mt-1 text-xs sm:text-sm font-medium">
              Choose your login method
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 md:px-8 pb-6 sm:pb-8 md:pb-10 pt-1 sm:pt-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-3 bg-white/10 border border-white/20 p-0.5 rounded-lg h-auto min-h-[36px]">
              <TabsTrigger
                value="database"
                className={cn(
                  "flex items-center justify-center gap-1 text-xs sm:text-sm py-1.5 px-1 rounded-md transition-all",
                  "data-[state=active]:bg-white/20 data-[state=active]:text-white",
                  "data-[state=inactive]:text-white/70 data-[state=inactive]:hover:text-white/90",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                )}
              >
                <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Pro plan</span>
              </TabsTrigger>
              <TabsTrigger
                value="google"
                className={cn(
                  "flex items-center justify-center gap-1 text-xs sm:text-sm py-1.5 px-1 rounded-md transition-all",
                  "data-[state=active]:bg-white/20 data-[state=active]:text-white",
                  "data-[state=inactive]:text-white/70 data-[state=inactive]:hover:text-white/90",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                )}
              >
                <Sheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Basic plan</span>
              </TabsTrigger>
            </TabsList>

            {/* DATABASE LOGIN TAB */}
            <TabsContent value="database">
              <DatabaseLoginForm />
            </TabsContent>

            {/* GOOGLE SHEETS LOGIN TAB */}
            <TabsContent value="google">
              <GoogleSheetsLoginForm />
            </TabsContent>
          </Tabs>

          {/* Divider */}
          <div className="relative flex py-2 sm:py-3 md:py-4 items-center">
            <div className="flex-grow border-t border-white/20"></div>
            <span className="flex-shrink-0 mx-3 sm:mx-4 text-[8px] sm:text-[10px] text-white/50 uppercase tracking-widest font-semibold">Or</span>
            <div className="flex-grow border-t border-white/20"></div>
          </div>

          {/* Register Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => { setShowRegisterModal(true) }}
            className="w-full h-10 sm:h-11 md:h-12 bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white rounded-lg sm:rounded-xl text-xs sm:text-sm"
          >
            Register New Property
          </Button>
          <a
            href="https://hithlakshsolutions.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 sm:gap-3 mt-4 sm:mt-5 md:mt-6 pt-4 sm:pt-5 md:pt-6 border-t border-white/20 hover:opacity-80 transition-opacity"
          >
            {/* Company Logo */}
            <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-white/10 p-1">
              <img
                src="/logo.jpeg"
                alt="HUS Solutions Logo"
                className="w-full h-full rounded-full object-contain"
              />
            </div>

            {/* Company Name */}
            <span className="text-white/80 text-xs sm:text-sm font-medium">
              Hithlaksh Solutions Private Limited
            </span>
          </a>
        </CardContent>
      </Card>


      <RegisterModal
        open={showRegisterModal}
        onClose={() => {
          console.log("❌ Closing register modal");
          setShowRegisterModal(false);
        }}
        onTryDemo={() => {
          setActiveTab("database");
          window.dispatchEvent(new Event("trigger-demo-login"));
        }}
      />

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/917795791587"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 text-[#25D366] md:bg-[#25D366] md:text-white md:p-3 md:rounded-full drop-shadow-lg hover:text-[#128C7E] md:hover:bg-[#128C7E] md:hover:text-white transition-all duration-300 hover:scale-110 flex items-center justify-center"
        aria-label="Contact us on WhatsApp"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-10 h-10 md:w-7 md:h-7"
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="none"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </a>
    </div>
  );

};

// ==================== DATABASE LOGIN FORM ====================
const DatabaseLoginForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);

  useEffect(() => {
    const handleDemoLoginEvent = () => {
      setUsername("Hotel 360");
      setPassword("12345678");
      handleLogin(undefined, "Hotel 360", "12345678");
    };
    window.addEventListener("trigger-demo-login", handleDemoLoginEvent);
    return () => window.removeEventListener("trigger-demo-login", handleDemoLoginEvent);
  }, []);

  const handleLogin = async (e?: React.FormEvent, overrideUser?: string, overridePass?: string) => {
    if (e) e.preventDefault();

    const currentUsername = overrideUser !== undefined ? overrideUser : username;
    const currentPassword = overridePass !== undefined ? overridePass : password;

    if (!currentUsername || !currentPassword) {
      toast({
        title: "Missing Details",
        description: "Please enter username and password.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log("🔐 Starting Database login...");

      const response = await fetch(`${NODE_BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUsername, password: currentPassword }),
      });

      const responseText = await response.text();
      console.log("📥 Database Response:", response.status, responseText);

      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Error parsing response JSON");
      }

      // Handle authentication errors
      if (!response.ok || !data.success) {
        // Handle expired trial for PRO users
        if (data.error === 'TRIAL_EXPIRED') {
          setShowPendingModal(false); // Don't show pending modal
          toast({
            title: "Trial Expired",
            description: data.message || "Your 30-day trial has expired. Please upgrade to continue.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Handle suspended accounts
        if (data.error === 'ACCOUNT_SUSPENDED') {
          setShowPendingModal(false);
          toast({
            title: "Account Suspended",
            description: data.message || "Your account has been suspended.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        throw new Error(data.message || "Login failed");
      }

      // Handle PRO plan trial users (pending status is OK for PRO trial)
      const isProPlan = data.user?.hotelPlan === 'pro' || data.user?.plan === 'pro';
      const isPendingStatus = data.user?.status === 'pending';

      // If it's a PRO plan user with pending status, that's OK (trial period)
      if (isProPlan && isPendingStatus) {
        console.log("✅ PRO trial user - allowing login even with pending status");
        console.log("📅 Trial days left:", data.user?.trialInfo?.daysLeft);
        // Continue with login - don't show pending modal
      }
      // If it's NOT PRO plan and status is pending, show modal
      else if (!isProPlan && isPendingStatus) {
        console.warn("⚠️ Account is pending approval.");
        setShowPendingModal(true);
        setIsLoading(false);
        return;
      }
      // Handle suspended status for non-PRO users
      else if (!isProPlan && data.user?.status === 'suspended') {
        toast({
          title: "Account Suspended",
          description: "Your account has been suspended. Please contact support.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      console.log("✅ Database Login successful");

      const userData = {
        ...data.user,
        hotelName: data.user.hotelName || data.user.hotel_name || 'Pro Hotel',
        source: 'database',
        plan: isProPlan ? 'pro' : 'basic',
        token: data.token,
        permissions: data.user.permissions || [],
        role: data.user.role,
        trialInfo: data.user.trialInfo || null,
        status: data.user.status
      };

      localStorage.setItem("currentUser", JSON.stringify(userData));
      localStorage.setItem("authToken", data.token);

      // Show welcome message based on trial status
      if (isProPlan && isPendingStatus) {
        const daysLeft = data.user.trialInfo?.daysLeft || 30;
        toast({
          title: "PRO Trial Active! 🎉",
          description: `Welcome to PRO plan! You have ${daysLeft} days left in your trial.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Login Successful",
          description: `Welcome back to ${userData.hotelName}!`,
        });
      }

      // Always navigate to dashboard
      navigate("/roombooking", { replace: true });

    } catch (err: any) {
      console.error("Database login error:", err);
      toast({
        title: "Login Failed",
        description: err.message || "Invalid username or password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4 md:space-y-5">
      <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
        <Label className="text-white/80 text-[10px] sm:text-xs font-bold uppercase tracking-wider ml-1">
          Username / Email
        </Label>
        <div className="relative group">
          <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-white transition-colors">
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <Input
            type="text"
            placeholder="Enter username or email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            className="pl-9 sm:pl-12 h-9 sm:h-10 md:h-12 bg-black/40 border-transparent focus:border-white/30 text-white placeholder:text-white/30 rounded-lg sm:rounded-xl text-xs sm:text-sm transition-all focus:ring-0 focus:bg-black/50"
          />
        </div>
      </div>

      <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
        <Label className="text-white/80 text-[10px] sm:text-xs font-bold uppercase tracking-wider ml-1">
          Password
        </Label>
        <div className="relative group">
          <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-white transition-colors">
            <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="pl-9 sm:pl-12 pr-9 sm:pr-12 h-9 sm:h-10 md:h-12 bg-black/40 border-transparent focus:border-white/30 text-white placeholder:text-white/30 rounded-lg sm:rounded-xl text-xs sm:text-sm transition-all focus:ring-0 focus:bg-black/50"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>

      {/* ========== FORGOT PASSWORD LINK ADDED HERE ========== */}
      <div className="flex justify-end">
        <Link
          to="/forgot-password"
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
        >
          <HelpCircle className="w-3 h-3" />
          Forgot password?
        </Link>
      </div>
      {/* ================================================== */}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-9 sm:h-10 md:h-12 mt-2 sm:mt-3 md:mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg sm:rounded-xl text-xs sm:text-sm shadow-lg transition-all transform active:scale-[0.98]"
      >
        {isLoading ? (
          <div className="flex items-center gap-1 sm:gap-2">
            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 animate-spin text-white" />
            <span className="text-white text-xs sm:text-sm">Authenticating...</span>
          </div>
        ) : (
          "Sign In to Pro Account"
        )}
      </Button>

      {/* Pending Modal - Only show for non-PRO pending users */}
      {showPendingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 p-4">
          <div className="relative w-full max-w-[280px] sm:max-w-sm mx-4 bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 transform transition-all animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3 md:space-y-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-1 sm:mb-2">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-yellow-600" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                Registration Pending
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Your account is pending administrator approval.
              </p>
              <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">
                This usually takes 24-48 hours.
              </p>
              <Button
                onClick={() => setShowPendingModal(false)}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold h-8 sm:h-9 md:h-11 rounded-lg sm:rounded-xl text-xs sm:text-sm mt-2 sm:mt-3 md:mt-4"
              >
                Okay, I understand
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

// ==================== GOOGLE SHEETS LOGIN FORM ====================
const GoogleSheetsLoginForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHotels, setIsLoadingHotels] = useState(false);
  const [hotels, setHotels] = useState<any[]>([]);

  // JSONP helper
  const loadScript = (src: string): Promise<any> =>
    new Promise<any>((resolve, reject) => {
      const callbackName = "cb_" + Date.now();
      (window as any)[callbackName] = (data: any) => {
        resolve(data);
        delete (window as any)[callbackName];
      };
      const script = document.createElement("script");
      script.src = src + (src.includes("?") ? "&" : "?") + "callback=" + callbackName;
      script.onerror = () => reject(new Error("Network error"));
      document.head.appendChild(script);
    });

  // Get hotels on component mount (for finding user's hotel)
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setIsLoadingHotels(true);
        const data = await loadScript(`${APPS_SCRIPT_URL}?action=getHotels`);

        console.log("🏨 Hotels API response:", data);

        if (data && data.hotels && Array.isArray(data.hotels)) {
          // Process hotels to ensure they have the correct structure
          const processedHotels = data.hotels.map((hotel: any) => ({
            // Use the 'name' field from registry sheet
            name: hotel.name || hotel.Name || hotel.hotelName || 'Unnamed Hotel',
            // Use spreadsheetId for identification
            spreadsheetId: hotel.spreadsheetId || hotel.spreadsheetid || '',
            // Add other relevant fields
            url: hotel.url || '',
            address: hotel.address || '',
            phone: hotel.phone || '',
            email: hotel.email || '',
            username: hotel.username || '',
            plan: hotel.plan || 'basic'
          })).filter((hotel: any) => hotel.spreadsheetId); // Only keep hotels with spreadsheetId

          console.log("✅ Processed hotels:", processedHotels);
          setHotels(processedHotels);
        } else {
          console.error("❌ Invalid hotels data format:", data);
          toast({
            title: "No Hotels Found",
            description: "Could not load hotel list from system",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("❌ Failed to fetch hotels:", error);
        toast({
          title: "Connection Error",
          description: "Cannot connect to Google Sheets. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingHotels(false);
      }
    };
    fetchHotels();
  }, [toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast({
        title: "Missing Details",
        description: "Please enter username and password.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log("🔐 Starting Google Sheets login...");
      console.log("👥 Total hotels to check:", hotels.length);

      // We need to check each hotel's login sheet
      let foundUser: any = null;
      let userHotel: any = null;

      // Loop through all hotels to find the user
      for (const hotel of hotels) {
        if (!hotel.spreadsheetId) continue;

        try {
          console.log(`🔍 Checking hotel: ${hotel.name} (ID: ${hotel.spreadsheetId})`);

          const loginData = await loadScript(
            `${APPS_SCRIPT_URL}?action=getLoginDetails&spreadsheetid=${encodeURIComponent(hotel.spreadsheetId)}`
          );

          console.log(`📊 Login data for ${hotel.name}:`, loginData);

          const users = loginData.loginDetails || loginData.data || [];
          const user = users.find(
            (u: any) =>
              u &&
              u.username &&
              u.password &&
              String(u.username).trim().toLowerCase() === username.trim().toLowerCase() &&
              String(u.password).trim() === password.trim()
          );

          if (user) {
            foundUser = user;
            userHotel = hotel;
            console.log(`✅ User found in hotel: ${hotel.name}`);
            console.log("👤 User data:", user);
            break;
          }
        } catch (error) {
          console.error(`Error checking hotel ${hotel.name}:`, error);
          continue;
        }
      }

      if (!foundUser) {
        throw new Error("Invalid username or password");
      }

      // Check user status
      if (foundUser.status && foundUser.status !== 'active') {
        toast({
          title: "Account Pending",
          description: "Your account is pending approval.",
          variant: "default",
        });
        setIsLoading(false);
        return;
      }

      console.log("✅ Google Sheets Login successful");

      // IMPORTANT: Use the hotel name from registry sheet
      const userData = {
        ...foundUser,
        hotelName: userHotel?.name || 'Hotel', // This is the hotel name from registry sheet
        spreadsheetId: userHotel?.spreadsheetId,
        source: 'google_sheets',
        plan: userHotel?.plan || 'basic',
        permissions: foundUser.permissions || [],
        hotelAddress: userHotel?.address || '',
        hotelPhone: userHotel?.phone || '',
        hotelEmail: userHotel?.email || ''
      };

      console.log("💾 Saving user data:", userData);

      localStorage.setItem("currentUser", JSON.stringify(userData));

      toast({
        title: "Login Successful",
        description: `Welcome to ${userData.hotelName}!`,
      });

      navigate("/roombooking", { replace: true });

    } catch (err: any) {
      console.error("❌ Google Sheets login error:", err);
      toast({
        title: "Login Failed",
        description: err.message || "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4 md:space-y-5">
      <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
        <Label className="text-white/80 text-[10px] sm:text-xs font-bold uppercase tracking-wider ml-1">
          Username
        </Label>
        <div className="relative group">
          <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-white transition-colors">
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <Input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading || isLoadingHotels}
            className="pl-9 sm:pl-12 h-9 sm:h-10 md:h-12 bg-black/40 border-transparent focus:border-white/30 text-white placeholder:text-white/30 rounded-lg sm:rounded-xl text-xs sm:text-sm transition-all focus:ring-0 focus:bg-black/50"
          />
        </div>
      </div>

      <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
        <Label className="text-white/80 text-[10px] sm:text-xs font-bold uppercase tracking-wider ml-1">
          Password
        </Label>
        <div className="relative group">
          <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-white transition-colors">
            <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading || isLoadingHotels}
            className="pl-9 sm:pl-12 pr-9 sm:pr-12 h-9 sm:h-10 md:h-12 bg-black/40 border-transparent focus:border-white/30 text-white placeholder:text-white/30 rounded-lg sm:rounded-xl text-xs sm:text-sm transition-all focus:ring-0 focus:bg-black/50"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            disabled={isLoading}
          >
            {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>

      {/* Debug info (optional - remove in production) */}
      {hotels.length > 0 && (
        <div className="text-[10px] sm:text-xs text-white/50 pt-1 sm:pt-2">
          <p>Searching in {hotels.length} hotels...</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading || isLoadingHotels}
        className="w-full h-9 sm:h-10 md:h-12 mt-2 sm:mt-3 md:mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg sm:rounded-xl text-xs sm:text-sm shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-50"
      >
        {isLoading || isLoadingHotels ? (
          <div className="flex items-center gap-1 sm:gap-2">
            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 animate-spin text-white" />
            <span className="text-white text-xs sm:text-sm">
              {isLoadingHotels ? "Loading hotels..." : "Verifying..."}
            </span>
          </div>
        ) : (
          "Sign In to Basic Account"
        )}
      </Button>
    </form>
  );
};

export default Login;