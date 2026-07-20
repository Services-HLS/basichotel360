


// import { useState, useEffect } from "react";
// import Layout from "@/components/Layout";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { useToast } from "@/hooks/use-toast";
// import { Loader2, Save, RefreshCw, QrCode, Lock, Key, Eye, EyeOff, AlertCircle } from "lucide-react";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import QRCodeUpload from "@/components/QRCodeUpload";
// import LogoUpload from "@/components/LogoUpload";

// const API_URL = import.meta.env.VITE_BACKEND_URL;
// const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwz9609W86UMSUezmt3ST_dUBsZN8JGYOFTS8kpD5SWXlYetozZqwVe3cUD5GIHHQOi/exec";



// // ========== ADD THESE GST VALIDATION FUNCTIONS HERE ==========
// // GST Number validation functions
// const validateGSTNumber = (gstNumber: string): { isValid: boolean; message: string } => {
//   if (!gstNumber || gstNumber.trim() === "") {
//     return { isValid: true, message: "" }; // Optional field
//   }

//   // Remove any spaces and convert to uppercase
//   const cleanGST = gstNumber.trim().toUpperCase();

//   // Check length (should be exactly 15 characters)
//   if (cleanGST.length !== 15) {
//     return { isValid: false, message: "GST number must be exactly 15 characters long" };
//   }

//   // GSTIN format: 2 digits, 5 letters, 4 digits, 1 letter, 1 alphanumeric, Z, 1 alphanumeric
//   const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;

//   if (!gstPattern.test(cleanGST)) {
//     return { isValid: false, message: "Invalid GST number format" };
//   }

//   // Additional validation: Check state code (first 2 digits should be between 01-36)
//   const stateCode = parseInt(cleanGST.substring(0, 2));
//   if (stateCode < 1 || stateCode > 36) {
//     return { isValid: false, message: "Invalid state code in GST number" };
//   }

//   // Check PAN format (positions 3-12 should follow PAN pattern)
//   const panPart = cleanGST.substring(2, 12);
//   const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
//   if (!panPattern.test(panPart)) {
//     return { isValid: false, message: "Invalid PAN format in GST number" };
//   }

//   return { isValid: true, message: "Valid GST number format" };
// };

// // Auto-format GST number as user types
// const formatGSTNumber = (value: string): string => {
//   // Remove all non-alphanumeric characters
//   let cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

//   // Limit to 15 characters
//   if (cleaned.length > 15) {
//     cleaned = cleaned.substring(0, 15);
//   }

//   return cleaned;
// };
// // ========== END OF GST VALIDATION FUNCTIONS ==========
// const Settings = () => {
//   const { toast } = useToast();
//   const [isLoading, setIsLoading] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const [activeTab, setActiveTab] = useState("general");
//   const [hotelId, setHotelId] = useState<string>("");
//   const [userSource, setUserSource] = useState<"database" | "google_sheets">("database");

//   const [showCurrentPassword, setShowCurrentPassword] = useState(false);
//   const [showNewPassword, setShowNewPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [isChangingPassword, setIsChangingPassword] = useState(false);

//   // ADD THIS - GST Validation state at top level
//   const [gstValidation, setGstValidation] = useState<{ isValid: boolean; message: string }>({
//     isValid: true,
//     message: ""
//   });

//   // Password form data
//   const [passwordData, setPasswordData] = useState({
//     currentPassword: "",
//     newPassword: "",
//     confirmPassword: "",
//   });

//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     address: "",
//     gstNumber: "",
//     gstPercentage: 12,
//     cgstPercentage: 6,        // ADD THIS
//     sgstPercentage: 6,        // ADD THIS
//     igstPercentage: 12,
//     serviceChargePercentage: 10,
//     qrcode_image: null as string | null,
//     logo_image: null as string | null,
//   });

//   // ✅ Fetch hotel settings - CORRECTED VERSION
//   useEffect(() => {
//     fetchHotelSettings();
//   }, []);

//   const fetchHotelSettings = async () => {
//     try {
//       setIsLoading(true);

//       // Get current user from localStorage
//       const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
//       const userSource = currentUser?.source || "database";
//       setUserSource(userSource);

//       console.log("👤 User Source:", userSource);
//       console.log("👤 Current User:", currentUser);

//       if (userSource === "database") {
//         // Database user - use backend API
//         const token = localStorage.getItem("authToken");

//         if (!token) {
//           console.error("No authentication token found for database user");
//           toast({
//             title: "Authentication Required",
//             description: "Please log in again",
//             variant: "destructive",
//           });
//           return;
//         }

//         console.log("🔍 Fetching hotel settings from database backend...");

//         // 1. First, fetch hotel general settings
//         const settingsResponse = await fetch(`${API_URL}/hotels/settings`, {
//           method: "GET",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         });

//         if (!settingsResponse.ok) {
//           if (settingsResponse.status === 401) {
//             toast({
//               title: "Session Expired",
//               description: "Please log in again",
//               variant: "destructive",
//             });
//             return;
//           }
//           throw new Error(`HTTP error! status: ${settingsResponse.status}`);
//         }

//         const settingsData = await settingsResponse.json();
//         console.log("📊 Hotel settings response:", settingsData);

//         // 2. Then, fetch tax settings separately
//         let taxSettings = {
//           gst_percentage: 12,
//           service_charge_percentage: 10
//         };

//         try {
//           const taxResponse = await fetch(`${API_URL}/hotels/tax-settings`, {
//             method: "GET",
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           });

//           if (taxResponse.ok) {
//             const taxData = await taxResponse.json();
//             console.log("📊 Tax settings response:", taxData);

//             if (taxData.success && taxData.data) {
//               taxSettings = taxData.data;
//             }
//           }
//         } catch (taxError) {
//           console.warn("⚠️ Could not fetch tax settings separately:", taxError);
//           // Continue with defaults
//         }

//         if (settingsData.success && settingsData.data) {
//           const hotelData = settingsData.data;

//           console.log("📋 Available fields in hotel data:", Object.keys(hotelData));
//           console.log("📋 gst_percentage field exists:", 'gst_percentage' in hotelData, "Value:", hotelData.gst_percentage);
//           console.log("📋 service_charge_percentage field exists:", 'service_charge_percentage' in hotelData, "Value:", hotelData.service_charge_percentage);

//           // Extract GST and Service Charge percentages
//           // Try multiple possible field names
//           const gstPercentage =
//             hotelData.gst_percentage !== undefined ? parseFloat(hotelData.gst_percentage) :
//               hotelData.gstPercentage !== undefined ? parseFloat(hotelData.gstPercentage) :
//                 taxSettings.gst_percentage;

//           const cgstPercentage =
//             hotelData.cgst_percentage !== undefined ? parseFloat(hotelData.cgst_percentage) :
//               hotelData.cgstPercentage !== undefined ? parseFloat(hotelData.cgstPercentage) :
//                 gstPercentage / 2;

//           const sgstPercentage =
//             hotelData.sgst_percentage !== undefined ? parseFloat(hotelData.sgst_percentage) :
//               hotelData.sgstPercentage !== undefined ? parseFloat(hotelData.sgstPercentage) :
//                 gstPercentage / 2;

//           const igstPercentage =
//             hotelData.igst_percentage !== undefined ? parseFloat(hotelData.igst_percentage) :
//               hotelData.igstPercentage !== undefined ? parseFloat(hotelData.igstPercentage) :
//                 gstPercentage;

//           const serviceChargePercentage =
//             hotelData.service_charge_percentage !== undefined ? parseFloat(hotelData.service_charge_percentage) :
//               hotelData.serviceChargePercentage !== undefined ? parseFloat(hotelData.serviceChargePercentage) :
//                 taxSettings.service_charge_percentage;

//           setFormData({
//             name: hotelData.name || "",
//             email: hotelData.email || hotelData.hotel_email || "",
//             phone: hotelData.phone || hotelData.hotel_phone || "",
//             address: hotelData.address || "",
//             gstNumber: hotelData.gst_number || hotelData.gstNumber || "",
//             gstPercentage: gstPercentage,
//             cgstPercentage: cgstPercentage,           // ADD THIS
//             sgstPercentage: sgstPercentage,           // ADD THIS
//             igstPercentage: igstPercentage,           // ADD THIS
//             serviceChargePercentage: serviceChargePercentage,
//             qrcode_image: hotelData.qrcode_image || null,
//             logo_image: hotelData.logo_image || null,
//           });

//           // Get hotel ID from current user
//           if (currentUser.hotel_id) {
//             setHotelId(currentUser.hotel_id);
//           }

//           console.log("✅ Database settings loaded successfully:", {
//             name: hotelData.name,
//             gstPercentage: gstPercentage,
//             serviceChargePercentage: serviceChargePercentage,
//             source: "database"
//           });
//         } else {
//           throw new Error(settingsData.message || "Failed to load settings");
//         }
//       } else {
//         // Google Sheets user - load from localStorage and Google Sheets
//         console.log("📊 Loading Google Sheets user settings");

//         // First, load basic info from localStorage
//         if (currentUser && currentUser.name) {
//           setFormData({
//             name: currentUser.name || "",
//             email: currentUser.email || "",
//             phone: currentUser.phone || "",
//             address: currentUser.address || "",
//             gstNumber: currentUser.gst_number || currentUser.gstNumber || "",
//             gstPercentage: currentUser.gstPercentage || 12,
//             cgstPercentage: currentUser.cgstPercentage || (currentUser.gstPercentage ? currentUser.gstPercentage / 2 : 6),
//             sgstPercentage: currentUser.sgstPercentage || (currentUser.gstPercentage ? currentUser.gstPercentage / 2 : 6),
//             igstPercentage: currentUser.igstPercentage || currentUser.gstPercentage || 12,
//             serviceChargePercentage: currentUser.serviceChargePercentage || 10,
//             qrcode_image: null,
//             logo_image: null,
//           });

//           if (currentUser.hotel_id) {
//             setHotelId(currentUser.hotel_id);
//           }
//         }

//         // Try to fetch additional details from Google Sheets if spreadsheetId exists
//         if (currentUser?.spreadsheetId) {
//           try {
//             // Fetch hotel details from Google Sheets
//             const hotelDetailsUrl = `${APPS_SCRIPT_URL}?action=getHotelDetails&spreadsheetid=${encodeURIComponent(currentUser.spreadsheetId)}`;

//             // Use JSONP for cross-origin requests
//             await new Promise((resolve, reject) => {
//               const callbackName = 'hotelDetailsCallback_' + Date.now();

//               window[callbackName] = (data: any) => {
//                 console.log("✅ Hotel details from Google Sheets:", data);

//                 if (data && data.hotelDetails) {
//                   // Update form data with Google Sheets details
//                   const hotelData = data.hotelDetails;
//                   setFormData(prev => ({
//                     ...prev,
//                     name: hotelData.name || prev.name,
//                     email: hotelData.email || prev.email,
//                     phone: hotelData.phone || prev.phone,
//                     address: hotelData.address || prev.address,
//                     gstPercentage: hotelData.gstPercentage || prev.gstPercentage,
//                     serviceChargePercentage: hotelData.serviceChargePercentage || prev.serviceChargePercentage,
//                   }));
//                 }

//                 delete window[callbackName];
//                 resolve(data);
//               };

//               const script = document.createElement('script');
//               script.src = hotelDetailsUrl + '&callback=' + callbackName;
//               script.onerror = reject;
//               document.head.appendChild(script);
//             });

//           } catch (error) {
//             console.error("❌ Error fetching hotel details from Google Sheets:", error);
//             // Silently fail - we already have data from localStorage
//           }
//         }

//         console.log("✅ Google Sheets settings loaded from localStorage");
//       }

//     } catch (error: any) {
//       console.error("❌ Error fetching hotel settings:", error);

//       // Fallback to localStorage for both user types
//       const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
//       if (currentUser && currentUser.name) {
//         console.log("Using localStorage fallback for settings");
//         setFormData({
//           name: currentUser.name || "",
//           email: currentUser.email || "",
//           phone: currentUser.phone || "",
//           address: currentUser.address || "",
//           gstNumber: currentUser.gst_number || currentUser.gstNumber || "",
//           gstPercentage: currentUser.gstPercentage || 12,
//           cgstPercentage: currentUser.cgstPercentage || (currentUser.gstPercentage ? currentUser.gstPercentage / 2 : 6),
//           sgstPercentage: currentUser.sgstPercentage || (currentUser.gstPercentage ? currentUser.gstPercentage / 2 : 6),
//           igstPercentage: currentUser.igstPercentage || currentUser.gstPercentage || 12,
//           serviceChargePercentage: currentUser.serviceChargePercentage || 10,
//           qrcode_image: null,
//           logo_image: null,
//         });
//         if (currentUser.hotel_id) {
//           setHotelId(currentUser.hotel_id);
//         }
//       } else {
//         toast({
//           title: "Error",
//           description: error.message || "Failed to load settings. Please try again.",
//           variant: "destructive",
//         });
//       }
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // ADD THESE HANDLER FUNCTIONS AFTER STATE DECLARATIONS
//   // Handle GST number change with validation
//   const handleGSTChange = (value: string) => {
//     const formattedValue = formatGSTNumber(value);
//     setFormData(prev => ({ ...prev, gstNumber: formattedValue }));

//     // Validate on change
//     if (formattedValue && formattedValue.length === 15) {
//       const validation = validateGSTNumber(formattedValue);
//       setGstValidation(validation);
//     } else if (formattedValue && formattedValue.length > 0) {
//       setGstValidation({
//         isValid: false,
//         message: `GST number must be 15 characters (currently ${formattedValue.length})`
//       });
//     } else {
//       setGstValidation({ isValid: true, message: "" });
//     }
//   };

//   // Optional: Update all rooms with new tax settings
//   const updateAllRoomsTax = async () => {
//     try {
//       setIsSaving(true);
//       const token = localStorage.getItem("authToken");

//       if (!token) {
//         toast({
//           title: "Authentication Error",
//           description: "Please log in again",
//           variant: "destructive",
//         });
//         return;
//       }

//       const response = await fetch(`${API_URL}/rooms/batch-update-tax`, {
//         method: "PUT",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           gstPercentage: formData.gstPercentage,
//           cgstPercentage: formData.cgstPercentage,
//           sgstPercentage: formData.sgstPercentage,
//           igstPercentage: formData.igstPercentage,
//           serviceChargePercentage: formData.serviceChargePercentage,
//         }),
//       });

//       const result = await response.json();

//       if (result.success) {
//         toast({
//           title: "Rooms Updated",
//           description: "All rooms have been updated with new tax settings.",
//         });
//       }
//     } catch (error) {
//       console.error("Error updating rooms:", error);
//       toast({
//         title: "Update Failed",
//         description: "Failed to update rooms with new tax settings.",
//         variant: "destructive",
//       });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   // ✅ Debug function to check backend response
//   const debugBackendResponse = async () => {
//     try {
//       const token = localStorage.getItem("authToken");
//       if (!token) {
//         toast({
//           title: "No Token",
//           description: "Please log in first",
//           variant: "destructive",
//         });
//         return;
//       }

//       console.log("🔍 Debug: Testing backend API endpoints...");

//       // Test /hotels/settings endpoint
//       const settingsResponse = await fetch(`${API_URL}/hotels/settings`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       const settingsData = await settingsResponse.json();
//       console.log("🔍 /hotels/settings response:", settingsData);

//       if (settingsData.success && settingsData.data) {
//         console.log("🔍 Available fields:", Object.keys(settingsData.data));
//         console.log("🔍 Complete data:", settingsData.data);

//         // Show in toast
//         toast({
//           title: "Backend Debug",
//           description: `Found ${Object.keys(settingsData.data).length} fields. Check console for details.`,
//           duration: 5000,
//         });
//       }

//       // Test /hotels/tax-settings endpoint
//       try {
//         const taxResponse = await fetch(`${API_URL}/hotels/tax-settings`, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         if (taxResponse.ok) {
//           const taxData = await taxResponse.json();
//           console.log("🔍 /hotels/tax-settings response:", taxData);
//         } else {
//           console.log("🔍 /hotels/tax-settings not available or error:", taxResponse.status);
//         }
//       } catch (taxError) {
//         console.log("🔍 /hotels/tax-settings endpoint not available");
//       }

//     } catch (error) {
//       console.error("🔍 Debug error:", error);
//       toast({
//         title: "Debug Failed",
//         description: error.message,
//         variant: "destructive",
//       });
//     }
//   };

//   const handlePasswordChange = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // Validate passwords
//     if (!passwordData.currentPassword) {
//       toast({
//         title: "Current Password Required",
//         description: "Please enter your current password",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!passwordData.newPassword) {
//       toast({
//         title: "New Password Required",
//         description: "Please enter a new password",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (passwordData.newPassword.length < 6) {
//       toast({
//         title: "Password Too Short",
//         description: "New password must be at least 6 characters long",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (passwordData.newPassword !== passwordData.confirmPassword) {
//       toast({
//         title: "Passwords Don't Match",
//         description: "New password and confirmation password must match",
//         variant: "destructive",
//       });
//       return;
//     }

//     try {
//       setIsChangingPassword(true);
//       const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
//       const userSource = currentUser?.source || "database";

//       console.log("🔐 Starting password change for:", {
//         userSource,
//         currentUser,
//         hasUsername: !!currentUser.username
//       });

//       if (userSource === "database") {
//         // Database user - change password via backend API
//         const token = localStorage.getItem("authToken");

//         if (!token) {
//           toast({
//             title: "Authentication Error",
//             description: "Please log in again",
//             variant: "destructive",
//           });
//           return;
//         }

//         const response = await fetch(`${API_URL}/auth/change-password`, {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             currentPassword: passwordData.currentPassword,
//             newPassword: passwordData.newPassword,
//           }),
//         });

//         const result = await response.json();

//         if (!response.ok) {
//           throw new Error(result.message || "Failed to change password");
//         }

//         if (result.success) {
//           toast({
//             title: "Password Changed",
//             description: "Your password has been updated successfully",
//           });

//           // Clear password form
//           setPasswordData({
//             currentPassword: "",
//             newPassword: "",
//             confirmPassword: "",
//           });

//           // Log out user after password change for security
//           setTimeout(() => {
//             toast({
//               title: "Please Login Again",
//               description: "You will be logged out for security reasons",
//             });
//             localStorage.removeItem("authToken");
//             localStorage.removeItem("currentUser");
//             window.location.href = "/login";
//           }, 2000);
//         } else {
//           throw new Error(result.message || "Failed to change password");
//         }
//       } else {
//         // Google Sheets user - change password in Google Sheets
//         const spreadsheetId = currentUser?.spreadsheetId;
//         const username = currentUser?.username || currentUser?.email?.split('@')[0] || "admin";

//         console.log("🔐 Google Sheets user details:", {
//           spreadsheetId,
//           username,
//           currentUser
//         });

//         if (!spreadsheetId) {
//           throw new Error("No spreadsheet ID found. Please contact support.");
//         }

//         // First, verify current password
//         console.log("🔐 Verifying current password...");
//         const verifyUrl = `${APPS_SCRIPT_URL}?action=verifyPassword&spreadsheetid=${encodeURIComponent(spreadsheetId)}&username=${encodeURIComponent(username)}&password=${encodeURIComponent(passwordData.currentPassword)}&_=${Date.now()}`;

//         console.log("🔗 Verification URL:", verifyUrl);

//         // Use fetch instead of JSONP for better error handling
//         try {
//           const verifyResponse = await fetch(verifyUrl, {
//             method: 'GET',
//             mode: 'cors',
//             headers: {
//               'Accept': 'application/json',
//             }
//           });

//           if (!verifyResponse.ok) {
//             throw new Error(`Verification failed: ${verifyResponse.status}`);
//           }

//           const verificationResult = await verifyResponse.json();
//           console.log("🔐 Verification result:", verificationResult);

//           if (verificationResult.error || !verificationResult.valid) {
//             throw new Error(verificationResult.message || "Current password is incorrect");
//           }

//           // Update password in Google Sheets
//           console.log("🔐 Updating password...");
//           const updateUrl = `${APPS_SCRIPT_URL}?action=updatePassword&spreadsheetid=${encodeURIComponent(spreadsheetId)}&username=${encodeURIComponent(username)}&newPassword=${encodeURIComponent(passwordData.newPassword)}&_=${Date.now()}`;

//           console.log("🔗 Update URL:", updateUrl);

//           const updateResponse = await fetch(updateUrl, {
//             method: 'GET',
//             mode: 'cors',
//             headers: {
//               'Accept': 'application/json',
//             }
//           });

//           if (!updateResponse.ok) {
//             throw new Error(`Update failed: ${updateResponse.status}`);
//           }

//           const updateResult = await updateResponse.json();
//           console.log("🔐 Update result:", updateResult);

//           if (updateResult.error || !updateResult.success) {
//             throw new Error(updateResult.message || updateResult.error || "Failed to update password");
//           }

//           toast({
//             title: "Password Changed",
//             description: "Your password has been updated successfully",
//           });

//           // Clear password form
//           setPasswordData({
//             currentPassword: "",
//             newPassword: "",
//             confirmPassword: "",
//           });

//           // Log out user after password change for security
//           setTimeout(() => {
//             toast({
//               title: "Please Login Again",
//               description: "You will be logged out for security reasons",
//             });
//             localStorage.removeItem("currentUser");
//             window.location.href = "/login";
//           }, 2000);

//         } catch (fetchError: any) {
//           console.error("🔐 Fetch error details:", fetchError);

//           // Try JSONP as fallback
//           console.log("🔄 Trying JSONP fallback...");
//           await new Promise<void>((resolve, reject) => {
//             const callbackName = 'passwordUpdateCallback_' + Date.now();

//             window[callbackName] = (data: any) => {
//               delete window[callbackName];
//               console.log("🔐 JSONP callback result:", data);

//               if (data.error || !data.success) {
//                 reject(new Error(data.message || data.error || "Failed to update password"));
//               } else {
//                 resolve();
//               }
//             };

//             const updateUrl = `${APPS_SCRIPT_URL}?action=updatePassword&spreadsheetid=${encodeURIComponent(spreadsheetId)}&username=${encodeURIComponent(username)}&newPassword=${encodeURIComponent(passwordData.newPassword)}&callback=${callbackName}&_=${Date.now()}`;

//             const script = document.createElement('script');
//             script.src = updateUrl;
//             script.onerror = () => reject(new Error("Script load failed"));
//             document.head.appendChild(script);
//           });

//           // If JSONP succeeded
//           toast({
//             title: "Password Changed",
//             description: "Your password has been updated successfully",
//           });

//           // Clear password form
//           setPasswordData({
//             currentPassword: "",
//             newPassword: "",
//             confirmPassword: "",
//           });

//           // Log out user after password change for security
//           setTimeout(() => {
//             toast({
//               title: "Please Login Again",
//               description: "You will be logged out for security reasons",
//             });
//             localStorage.removeItem("currentUser");
//             window.location.href = "/login";
//           }, 2000);
//         }
//       }
//     } catch (error: any) {
//       console.error("❌ Error changing password:", error);

//       // Provide more specific error messages
//       let errorMessage = error.message || "Failed to change password. Please try again.";

//       if (errorMessage.includes("Current password is incorrect")) {
//         errorMessage = "Current password is incorrect. Please check and try again.";
//       } else if (errorMessage.includes("User not found")) {
//         errorMessage = "User account not found. Please contact support.";
//       } else if (errorMessage.includes("spreadsheet")) {
//         errorMessage = "Cannot access your hotel data. Please refresh and try again.";
//       }

//       toast({
//         title: "Password Change Failed",
//         description: errorMessage,
//         variant: "destructive",
//       });
//     } finally {
//       setIsChangingPassword(false);
//     }
//   };

//   // ✅ Save general settings
//   const handleSaveAllSettings = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // Validate form
//     if (!formData.name || !formData.email || !formData.phone || !formData.address) {
//       toast({
//         title: "Missing Information",
//         description: "Please fill in all required fields",
//         variant: "destructive",
//       });
//       return;
//     }
//     // ✅ Validate GST number if provided (database users only)
//     const currentUserForValidation = JSON.parse(localStorage.getItem("currentUser") || "{}");
//     const userSourceForValidation = currentUserForValidation?.source || "database";

//     if (userSourceForValidation === "database" && formData.gstNumber) {
//       const validation = validateGSTNumber(formData.gstNumber);
//       if (!validation.isValid) {
//         toast({
//           title: "Invalid GST Number",
//           description: validation.message,
//           variant: "destructive",
//         });
//         return;
//       }
//     }


//     try {
//       setIsSaving(true);
//       const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
//       const userSource = currentUser?.source || "database";

//       if (userSource === "database") {
//         // Database user - save via backend API
//         const token = localStorage.getItem("authToken");

//         if (!token) {
//           toast({
//             title: "Authentication Error",
//             description: "Please log in again",
//             variant: "destructive",
//           });
//           return;
//         }

//         const response = await fetch(`${API_URL}/hotels/settings`, {
//           method: "PUT",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             name: formData.name,
//             email: formData.email,
//             phone: formData.phone,
//             address: formData.address,
//             gstNumber: formData.gstNumber || null,
//             gstPercentage: parseFloat(formData.gstPercentage.toString()),
//             cgstPercentage: parseFloat(formData.cgstPercentage.toString()),
//             sgstPercentage: parseFloat(formData.sgstPercentage.toString()),
//             igstPercentage: parseFloat(formData.igstPercentage.toString()),
//             serviceChargePercentage: parseFloat(formData.serviceChargePercentage.toString()),
//             qrcode_image: formData.qrcode_image,
//           }),
//         });

//         const result = await response.json();

//         if (!response.ok) {
//           throw new Error(result.message || "Failed to update settings");
//         }

//         if (result.success) {
//           // Update local storage user data
//           const updatedUser = {
//             ...currentUser,
//             name: formData.name,
//             email: formData.email,
//             phone: formData.phone,
//             address: formData.address,
//             gstNumber: formData.gstNumber,
//             gstPercentage: formData.gstPercentage,
//             cgstPercentage: formData.cgstPercentage,      // ADD THIS
//             sgstPercentage: formData.sgstPercentage,      // ADD THIS
//             igstPercentage: formData.igstPercentage,      // ADD THIS
//             serviceChargePercentage: formData.serviceChargePercentage,
//           };
//           localStorage.setItem("currentUser", JSON.stringify(updatedUser));

//           toast({
//             title: "Settings Updated",
//             description: "Your hotel settings have been saved successfully.",
//           });

//           // Refresh settings from backend
//           fetchHotelSettings();
//         } else {
//           throw new Error(result.message || "Failed to update settings");
//         }
//       } else {
//         // Google Sheets user - save to localStorage only
//         const updatedUser = {
//           ...currentUser,
//           name: formData.name,
//           email: formData.email,
//           phone: formData.phone,
//           address: formData.address,
//           gstPercentage: formData.gstPercentage,
//           serviceChargePercentage: formData.serviceChargePercentage,
//         };
//         localStorage.setItem("currentUser", JSON.stringify(updatedUser));

//         // Try to save to Google Sheets if spreadsheetId exists
//         if (currentUser?.spreadsheetId) {
//           try {
//             const saveUrl = `${APPS_SCRIPT_URL}?action=updateHotelDetails&spreadsheetid=${encodeURIComponent(currentUser.spreadsheetId)}`;

//             // Create a form with all data
//             const formDataToSend = new FormData();
//             formDataToSend.append('name', formData.name);
//             formDataToSend.append('email', formData.email);
//             formDataToSend.append('phone', formData.phone);
//             formDataToSend.append('address', formData.address);
//             formDataToSend.append('gstPercentage', formData.gstPercentage.toString());
//             formDataToSend.append('serviceChargePercentage', formData.serviceChargePercentage.toString());

//             // Use fetch with POST
//             const response = await fetch(saveUrl, {
//               method: 'POST',
//               body: formDataToSend,
//               mode: 'no-cors' // Use no-cors for Google Apps Script
//             });

//             console.log("✅ Settings saved to Google Sheets");
//           } catch (error) {
//             console.error("❌ Error saving to Google Sheets:", error);
//             // Continue even if Google Sheets save fails
//           }
//         }

//         toast({
//           title: "Settings Updated",
//           description: "Your hotel settings have been saved to local storage and Google Sheets.",
//         });

//         // Refresh settings
//         fetchHotelSettings();
//       }
//     } catch (error: any) {
//       console.error("Error updating settings:", error);
//       toast({
//         title: "Update Failed",
//         description: error.message || "Failed to save settings. Please try again.",
//         variant: "destructive",
//       });
//     } finally {
//       setIsSaving(false);
//     }
//   };


//   // ✅ Update only tax settings - CORRECTED VERSION
//   // const handleUpdateTaxOnly = async () => {
//   //   if (formData.gstPercentage < 0 || formData.gstPercentage > 100) {
//   //     toast({
//   //       title: "Invalid GST",
//   //       description: "GST percentage must be between 0 and 100",
//   //       variant: "destructive",
//   //     });
//   //     return;
//   //   }

//   //   if (formData.serviceChargePercentage < 0 || formData.serviceChargePercentage > 100) {
//   //     toast({
//   //       title: "Invalid Service Charge",
//   //       description: "Service charge percentage must be between 0 and 100",
//   //       variant: "destructive",
//   //     });
//   //     return;
//   //   }

//   //   try {
//   //     setIsSaving(true);
//   //     const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
//   //     const userSource = currentUser?.source || "database";

//   //     if (userSource === "database") {
//   //       // Database user
//   //       const token = localStorage.getItem("authToken");

//   //       if (!token) {
//   //         toast({
//   //           title: "Authentication Error",
//   //           description: "Please log in again",
//   //           variant: "destructive",
//   //         });
//   //         return;
//   //       }

//   //       console.log("📤 Sending tax update to backend:", {
//   //         gst_percentage: formData.gstPercentage,
//   //         service_charge_percentage: formData.serviceChargePercentage
//   //       });

//   //       // First try /hotels/tax-settings with correct field names
//   //       try {
//   //         const response = await fetch(`${API_URL}/hotels/tax-settings`, {
//   //           method: "PUT",
//   //           headers: {
//   //             Authorization: `Bearer ${token}`,
//   //             "Content-Type": "application/json",
//   //           },
//   //           body: JSON.stringify({
//   //             gstPercentage: parseFloat(formData.gstPercentage.toString()), // Changed from gst_percentage
//   //             serviceChargePercentage: parseFloat(formData.serviceChargePercentage.toString()), // Changed from service_charge_percentage
//   //           }),
//   //         });

//   //         const result = await response.json();
//   //         console.log("📊 Tax settings update response:", result);

//   //         if (!response.ok) {
//   //           throw new Error(result.message || "Failed to update tax settings");
//   //         }
//   //       } catch (taxError) {
//   //         console.log("⚠️ /hotels/tax-settings failed, trying /hotels/settings");

//   //         // Fallback to /hotels/settings - also needs consistent field names
//   //         const response = await fetch(`${API_URL}/hotels/settings`, {
//   //           method: "PUT",
//   //           headers: {
//   //             Authorization: `Bearer ${token}`,
//   //             "Content-Type": "application/json",
//   //           },
//   //           body: JSON.stringify({
//   //             gstPercentage: parseFloat(formData.gstPercentage.toString()), // Use gstPercentage instead of gst_percentage
//   //             serviceChargePercentage: parseFloat(formData.serviceChargePercentage.toString()), // Use serviceChargePercentage
//   //           }),
//   //         });

//   //         const result = await response.json();
//   //         console.log("📊 General settings update response:", result);

//   //         if (!response.ok) {
//   //           throw new Error(result.message || "Failed to update settings");
//   //         }
//   //       }

//   //       // Update local storage
//   //       const updatedUser = {
//   //         ...currentUser,
//   //         gstPercentage: formData.gstPercentage,
//   //         serviceChargePercentage: formData.serviceChargePercentage,
//   //       };
//   //       localStorage.setItem("currentUser", JSON.stringify(updatedUser));

//   //       toast({
//   //         title: "Tax Settings Updated",
//   //         description: "GST and Service Charge percentages have been updated successfully.",
//   //       });

//   //       // Refresh settings
//   //       fetchHotelSettings();
//   //     } else {
//   //       // Google Sheets user - save to localStorage
//   //       const updatedUser = {
//   //         ...currentUser,
//   //         gstPercentage: formData.gstPercentage,
//   //         serviceChargePercentage: formData.serviceChargePercentage,
//   //       };
//   //       localStorage.setItem("currentUser", JSON.stringify(updatedUser));

//   //       toast({
//   //         title: "Tax Settings Updated",
//   //         description: "GST and Service Charge percentages have been updated in local storage.",
//   //       });

//   //       // Refresh settings
//   //       fetchHotelSettings();
//   //     }
//   //   } catch (error: any) {
//   //     console.error("Error updating tax settings:", error);
//   //     toast({
//   //       title: "Update Failed",
//   //       description: error.message || "Failed to update tax settings. Please try again.",
//   //       variant: "destructive",
//   //     });
//   //   } finally {
//   //     setIsSaving(false);
//   //   }
//   // };


//   // ✅ Update only tax settings - WITH FIXED VALIDATION
//   const handleUpdateTaxOnly = async () => {
//     // Validate GST
//     if (formData.gstPercentage < 0 || formData.gstPercentage > 100) {
//       toast({
//         title: "Invalid GST",
//         description: "GST percentage must be between 0 and 100",
//         variant: "destructive",
//       });
//       return;
//     }

//     // Validate CGST
//     if (formData.cgstPercentage < 0 || formData.cgstPercentage > 100) {
//       toast({
//         title: "Invalid CGST",
//         description: "CGST percentage must be between 0 and 100",
//         variant: "destructive",
//       });
//       return;
//     }

//     // Validate SGST
//     if (formData.sgstPercentage < 0 || formData.sgstPercentage > 100) {
//       toast({
//         title: "Invalid SGST",
//         description: "SGST percentage must be between 0 and 100",
//         variant: "destructive",
//       });
//       return;
//     }

//     // Validate IGST
//     if (formData.igstPercentage < 0 || formData.igstPercentage > 100) {
//       toast({
//         title: "Invalid IGST",
//         description: "IGST percentage must be between 0 and 100",
//         variant: "destructive",
//       });
//       return;
//     }

//     // FIXED: Allow small floating point differences (0.01 tolerance)
//     const cgstPlusSgst = (formData.cgstPercentage + formData.sgstPercentage).toFixed(2);
//     const totalGst = formData.gstPercentage.toFixed(2);

//     if (Math.abs(parseFloat(cgstPlusSgst) - parseFloat(totalGst)) > 0.01) {
//       toast({
//         title: "Tax Mismatch",
//         description: `CGST (${formData.cgstPercentage}%) + SGST (${formData.sgstPercentage}%) = ${cgstPlusSgst}% should equal total GST ${totalGst}%`,
//         variant: "destructive",
//       });
//       return;
//     }

//     if (formData.serviceChargePercentage < 0 || formData.serviceChargePercentage > 100) {
//       toast({
//         title: "Invalid Service Charge",
//         description: "Service charge percentage must be between 0 and 100",
//         variant: "destructive",
//       });
//       return;
//     }

//     try {
//       setIsSaving(true);
//       const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
//       const userSource = currentUser?.source || "database";

//       if (userSource === "database") {
//         const token = localStorage.getItem("authToken");

//         if (!token) {
//           toast({
//             title: "Authentication Error",
//             description: "Please log in again",
//             variant: "destructive",
//           });
//           return;
//         }

//         console.log("📤 Sending tax update to backend:", {
//           gstPercentage: formData.gstPercentage,
//           cgstPercentage: formData.cgstPercentage,
//           sgstPercentage: formData.sgstPercentage,
//           igstPercentage: formData.igstPercentage,
//           serviceChargePercentage: formData.serviceChargePercentage
//         });

//         // Try to update tax settings
//         try {
//           const response = await fetch(`${API_URL}/hotels/tax-settings`, {
//             method: "PUT",
//             headers: {
//               Authorization: `Bearer ${token}`,
//               "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//               gstPercentage: parseFloat(formData.gstPercentage.toString()),
//               cgstPercentage: parseFloat(formData.cgstPercentage.toString()),
//               sgstPercentage: parseFloat(formData.sgstPercentage.toString()),
//               igstPercentage: parseFloat(formData.igstPercentage.toString()),
//               serviceChargePercentage: parseFloat(formData.serviceChargePercentage.toString()),
//             }),
//           });

//           const result = await response.json();
//           console.log("📊 Tax settings update response:", result);

//           if (!response.ok) {
//             throw new Error(result.message || "Failed to update tax settings");
//           }
//         } catch (taxError) {
//           console.log("⚠️ /hotels/tax-settings failed, trying /hotels/settings");

//           // Fallback to /hotels/settings
//           const response = await fetch(`${API_URL}/hotels/settings`, {
//             method: "PUT",
//             headers: {
//               Authorization: `Bearer ${token}`,
//               "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//               gstPercentage: parseFloat(formData.gstPercentage.toString()),
//               cgstPercentage: parseFloat(formData.cgstPercentage.toString()),
//               sgstPercentage: parseFloat(formData.sgstPercentage.toString()),
//               igstPercentage: parseFloat(formData.igstPercentage.toString()),
//               serviceChargePercentage: parseFloat(formData.serviceChargePercentage.toString()),
//             }),
//           });

//           const result = await response.json();
//           console.log("📊 General settings update response:", result);

//           if (!response.ok) {
//             throw new Error(result.message || "Failed to update settings");
//           }
//         }

//         // Update local storage
//         const updatedUser = {
//           ...currentUser,
//           gstPercentage: formData.gstPercentage,
//           cgstPercentage: formData.cgstPercentage,
//           sgstPercentage: formData.sgstPercentage,
//           igstPercentage: formData.igstPercentage,
//           serviceChargePercentage: formData.serviceChargePercentage,
//         };
//         localStorage.setItem("currentUser", JSON.stringify(updatedUser));

//         toast({
//           title: "Tax Settings Updated",
//           description: "GST, CGST, SGST, IGST, and Service Charge percentages have been updated successfully.",
//         });

//         // Refresh settings
//         fetchHotelSettings();
//       } else {
//         // Google Sheets user - save to localStorage
//         const updatedUser = {
//           ...currentUser,
//           gstPercentage: formData.gstPercentage,
//           serviceChargePercentage: formData.serviceChargePercentage,
//         };
//         localStorage.setItem("currentUser", JSON.stringify(updatedUser));

//         toast({
//           title: "Tax Settings Updated",
//           description: "Tax settings have been updated in local storage.",
//         });

//         // Refresh settings
//         fetchHotelSettings();
//       }
//     } catch (error: any) {
//       console.error("Error updating tax settings:", error);
//       toast({
//         title: "Update Failed",
//         description: error.message || "Failed to update tax settings. Please try again.",
//         variant: "destructive",
//       });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   // ✅ Handle QR code upload success - Only for database users
//   const handleQRCodeSuccess = () => {
//     if (userSource === "database") {
//       fetchHotelSettings();
//       toast({
//         title: "QR Code Updated",
//         description: "Hotel QR code has been updated successfully.",
//       });
//     } else {
//       toast({
//         title: "Feature Not Available",
//         description: "QR code upload is only available for Pro plan users.",
//         variant: "destructive",
//       });
//     }
//   };

//   // ✅ Handle Logo upload success - Only for database users
//   const handleLogoSuccess = () => {
//     if (userSource === "database") {
//       fetchHotelSettings();
//       toast({
//         title: "Logo Updated",
//         description: "Hotel logo has been updated successfully.",
//       });
//     } else {
//       toast({
//         title: "Feature Not Available",
//         description: "Logo upload is only available for Pro plan users.",
//         variant: "destructive",
//       });
//     }
//   };

//   // ✅ Conditionally render tabs based on user source
//   const renderTabs = () => {
//     if (userSource === "google_sheets") {
//       // Google Sheets users only see General Settings
//       return (
//         <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
//           <TabsList className="grid w-full max-w-md grid-cols-2">
//             <TabsTrigger value="general">General Settings</TabsTrigger>
//             <TabsTrigger value="password">Change Password</TabsTrigger>
//           </TabsList>
//           <TabsContent value="general" className="space-y-6">
//             {renderGeneralSettings()}
//           </TabsContent>
//           <TabsContent value="password" className="space-y-6">
//             {renderPasswordChange()}
//           </TabsContent>
//         </Tabs>
//       );
//     } else {
//       // Database users see all tabs

//       return (
//         <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
//           {/* Responsive TabsList - horizontal scroll on mobile, grid on desktop */}
//           <div className="relative">
//             <TabsList className="w-full flex flex-nowrap overflow-x-auto overflow-y-hidden pb-1 hide-scrollbar md:grid md:grid-cols-5 md:overflow-visible gap-1 h-auto p-1">
//               <TabsTrigger value="general" className="flex-shrink-0 md:flex-shrink whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm">
//                 Settings
//               </TabsTrigger>
//               <TabsTrigger value="tax" className="flex-shrink-0 md:flex-shrink whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm">
//                 Tax & Pricing
//               </TabsTrigger>
//               <TabsTrigger value="payment" className="flex-shrink-0 md:flex-shrink whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm">
//                 QR Code
//               </TabsTrigger>
//               <TabsTrigger value="logo" className="flex-shrink-0 md:flex-shrink whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm">
//                 Logo
//               </TabsTrigger>
//               <TabsTrigger value="password" className="flex-shrink-0 md:flex-shrink whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm">
//                 Password
//               </TabsTrigger>
//             </TabsList>
//             {/* Optional gradient fade on right to indicate scrollability */}
//             <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden"></div>
//           </div>

//           {/* Tabs Content - unchanged */}
//           <TabsContent value="general" className="space-y-6">
//             {renderGeneralSettings()}
//           </TabsContent>
//           <TabsContent value="tax" className="space-y-6">
//             {renderTaxSettings()}
//           </TabsContent>
//           <TabsContent value="payment" className="space-y-6">
//             {renderPaymentSettings()}
//           </TabsContent>
//           <TabsContent value="logo" className="space-y-6">
//             {renderLogoSettings()}
//           </TabsContent>
//           <TabsContent value="password" className="space-y-6">
//             {renderPasswordChange()}
//           </TabsContent>
//         </Tabs>
//       );
//     }
//   };

//   // ✅ Render General Settings (common for both)
//   // const renderGeneralSettings = () => (
//   //   <form onSubmit={handleSaveAllSettings} className="space-y-6">
//   //     <Card>
//   //       <CardHeader>
//   //         <CardTitle>Hotel Information</CardTitle>
//   //         <CardDescription>
//   //           Update your hotel's basic information and contact details
//   //           {userSource === "google_sheets" && (
//   //             <span className="block text-sm text-yellow-600 mt-1">
//   //               Note: Changes are saved locally and synced to Google Sheets
//   //             </span>
//   //           )}
//   //         </CardDescription>
//   //       </CardHeader>
//   //       <CardContent className="space-y-4">
//   //         <div className="space-y-2">
//   //           <Label htmlFor="name">
//   //             Hotel Name <span className="text-red-500">*</span>
//   //           </Label>
//   //           <Input
//   //             id="name"
//   //             value={formData.name}
//   //             onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
//   //             placeholder="Enter hotel name"
//   //             required
//   //           />
//   //         </div>

//   //         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//   //           <div className="space-y-2">
//   //             <Label htmlFor="email">
//   //               Contact Email <span className="text-red-500">*</span>
//   //             </Label>
//   //             <Input
//   //               id="email"
//   //               type="email"
//   //               value={formData.email}
//   //               onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
//   //               placeholder="hotel@example.com"
//   //               required
//   //             />
//   //           </div>

//   //           <div className="space-y-2">
//   //             <Label htmlFor="phone">
//   //               Contact Phone <span className="text-red-500">*</span>
//   //             </Label>
//   //             <Input
//   //               id="phone"
//   //               type="tel"
//   //               value={formData.phone}
//   //               onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
//   //               placeholder="+91 9876543210"
//   //               required
//   //             />
//   //           </div>
//   //         </div>

//   //         <div className="space-y-2">
//   //           <Label htmlFor="address">
//   //             Hotel Address <span className="text-red-500">*</span>
//   //           </Label>
//   //           <Input
//   //             id="address"
//   //             value={formData.address}
//   //             onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
//   //             placeholder="Enter complete address"
//   //             required
//   //           />
//   //         </div>
//   //       </CardContent>
//   //     </Card>

//   //     <div className="flex justify-end gap-4">
//   //       <Button
//   //         type="button"
//   //         variant="outline"
//   //         onClick={() => {
//   //           fetchHotelSettings();
//   //           toast({
//   //             title: "Form Reset",
//   //             description: "All changes have been discarded.",
//   //           });
//   //         }}
//   //         disabled={isSaving}
//   //       >
//   //         Discard Changes
//   //       </Button>
//   //       <Button type="submit" disabled={isSaving}>
//   //         {isSaving ? (
//   //           <>
//   //             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//   //             Saving...
//   //           </>
//   //         ) : (
//   //           <>
//   //             <Save className="mr-2 h-4 w-4" />
//   //             Save All Changes
//   //           </>
//   //         )}
//   //       </Button>
//   //     </div>
//   //   </form>
//   // );


//   const renderGeneralSettings = () => {
//     return (
//       <form onSubmit={handleSaveAllSettings} className="space-y-6">
//         <Card>
//           <CardHeader>
//             <CardTitle>Hotel Information</CardTitle>
//             <CardDescription>
//               Update your hotel's basic information and contact details
//               {userSource === "google_sheets" && (
//                 <span className="block text-sm text-yellow-600 mt-1">
//                   Note: Changes are saved locally and synced to Google Sheets
//                 </span>
//               )}
//             </CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="name">
//                 Hotel Name <span className="text-red-500">*</span>
//               </Label>
//               <Input
//                 id="name"
//                 value={formData.name}
//                 onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
//                 placeholder="Enter hotel name"
//                 required
//               />
//             </div>

//             {/* GST Number - Only show for database users */}
//             {userSource === "database" && (
//               <div className="space-y-2">
//                 <Label htmlFor="gstNumber">
//                   GST Number
//                   <span className="text-xs text-muted-foreground ml-2">(Optional)</span>
//                 </Label>
//                 <div className="relative">
//                   <Input
//                     id="gstNumber"
//                     value={formData.gstNumber}
//                     onChange={(e) => handleGSTChange(e.target.value)}
//                     placeholder="e.g., 22AAAAA0000A1Z"
//                     className={`font-mono text-sm uppercase ${formData.gstNumber && !gstValidation.isValid && formData.gstNumber.length === 15
//                         ? 'border-red-500 focus-visible:ring-red-500'
//                         : formData.gstNumber && gstValidation.isValid && formData.gstNumber.length === 15
//                           ? 'border-green-500 focus-visible:ring-green-500'
//                           : ''
//                       }`}
//                   />
//                   {formData.gstNumber && formData.gstNumber.length === 15 && gstValidation.isValid && (
//                     <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                       <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
//                         <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
//                         </svg>
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 {/* Validation Messages */}
//                 {formData.gstNumber && (
//                   <div className="space-y-1">
//                     {formData.gstNumber.length !== 15 && formData.gstNumber.length > 0 && (
//                       <p className="text-xs text-yellow-600 flex items-center gap-1">
//                         <AlertCircle className="h-3 w-3" />
//                         {gstValidation.message || `GST number should be 15 characters (currently ${formData.gstNumber.length})`}
//                       </p>
//                     )}

//                     {formData.gstNumber.length === 15 && !gstValidation.isValid && (
//                       <p className="text-xs text-red-600 flex items-center gap-1">
//                         <AlertCircle className="h-3 w-3" />
//                         {gstValidation.message}
//                       </p>
//                     )}

//                     {formData.gstNumber.length === 15 && gstValidation.isValid && (
//                       <p className="text-xs text-green-600 flex items-center gap-1">
//                         <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
//                         </svg>
//                         ✓ {gstValidation.message}
//                       </p>
//                     )}
//                   </div>
//                 )}

//                 <p className="text-xs text-muted-foreground">
//                   Enter your 15-character GSTIN (Goods and Services Tax Identification Number)
//                 </p>

//                 {/* GST Format Helper */}
//                 <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
//                   <p className="text-xs font-medium text-gray-700 mb-1">GST Number Format:</p>
//                   <code className="text-xs text-gray-600">22 AAAAA 0000 A 1 Z 5</code>
//                   <div className="grid grid-cols-5 gap-1 mt-2 text-xs">
//                     <div className="text-center">
//                       <span className="font-mono">22</span>
//                       <p className="text-gray-500">State Code</p>
//                     </div>
//                     <div className="text-center">
//                       <span className="font-mono">AAAAA</span>
//                       <p className="text-gray-500">PAN (5 letters)</p>
//                     </div>
//                     <div className="text-center">
//                       <span className="font-mono">0000</span>
//                       <p className="text-gray-500">Entity No.</p>
//                     </div>
//                     <div className="text-center">
//                       <span className="font-mono">A</span>
//                       <p className="text-gray-500">Check Digit</p>
//                     </div>
//                     <div className="text-center">
//                       <span className="font-mono">Z</span>
//                       <p className="text-gray-500">Z - Default</p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="email">
//                   Contact Email <span className="text-red-500">*</span>
//                 </Label>
//                 <Input
//                   id="email"
//                   type="email"
//                   value={formData.email}
//                   onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
//                   placeholder="hotel@example.com"
//                   required
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="phone">
//                   Contact Phone <span className="text-red-500">*</span>
//                 </Label>
//                 <Input
//                   id="phone"
//                   type="tel"
//                   value={formData.phone}
//                   onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
//                   placeholder="+91 9876543210"
//                   required
//                 />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="address">
//                 Hotel Address <span className="text-red-500">*</span>
//               </Label>
//               <Input
//                 id="address"
//                 value={formData.address}
//                 onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
//                 placeholder="Enter complete address"
//                 required
//               />
//             </div>

//             {/* GST Information Display Card (if GST number exists and is valid) */}
//             {userSource === "database" && formData.gstNumber && gstValidation.isValid && formData.gstNumber.length === 15 && (
//               <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg mt-2">
//                 <div className="flex items-start gap-3">
//                   <div className="flex-shrink-0">
//                     <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
//                       <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
//                       </svg>
//                     </div>
//                   </div>
//                   <div className="flex-1">
//                     <p className="font-semibold text-green-800">GST Information Verified</p>
//                     <div className="mt-1 space-y-1">
//                       <p className="text-sm text-green-700">
//                         GST Number: <span className="font-mono font-medium">{formData.gstNumber}</span>
//                       </p>
//                       <p className="text-xs text-green-600">
//                         State Code: {formData.gstNumber.substring(0, 2)} |
//                         PAN: {formData.gstNumber.substring(2, 12)}
//                       </p>
//                     </div>
//                     <p className="text-xs text-green-600 mt-2">
//                       This number will appear on all invoices and bills generated by the system
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </CardContent>
//         </Card>

//         <div className="flex justify-end gap-4">
//           <Button
//             type="button"
//             variant="outline"
//             onClick={() => {
//               fetchHotelSettings();
//               setGstValidation({ isValid: true, message: "" });
//               toast({
//                 title: "Form Reset",
//                 description: "All changes have been discarded.",
//               });
//             }}
//             disabled={isSaving}
//           >
//             Discard Changes
//           </Button>
//           <Button
//             type="submit"
//             disabled={isSaving || (formData.gstNumber?.length === 15 && !gstValidation.isValid)}
//           >
//             {isSaving ? (
//               <>
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 Saving...
//               </>
//             ) : (
//               <>
//                 <Save className="mr-2 h-4 w-4" />
//                 Save All Changes
//               </>
//             )}
//           </Button>
//         </div>
//       </form>
//     );
//   };

//   // ✅ Render Tax Settings (Database only)
//   // const renderTaxSettings = () => (
//   //   <>
//   //     <Card>
//   //       <CardHeader>
//   //         <CardTitle>Tax Configuration</CardTitle>
//   //         <CardDescription>
//   //           Set default GST and Service Charge percentages for all rooms
//   //         </CardDescription>
//   //       </CardHeader>
//   //       <CardContent className="space-y-6">


//   //         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//   //           <div className="space-y-4">
//   //             <div className="space-y-2">
//   //               <Label htmlFor="serviceChargePercentage">
//   //                 Service Charge Percentage
//   //               </Label>
//   //               <div className="relative">
//   //                 <Input
//   //                   id="serviceChargePercentage"
//   //                   type="number"
//   //                   min="0"
//   //                   max="100"
//   //                   step="0.1"
//   //                   value={formData.serviceChargePercentage}
//   //                   onChange={(e) =>
//   //                     setFormData(prev => ({ ...prev, serviceChargePercentage: Number(e.target.value) }))
//   //                   }
//   //                   className="pr-12"
//   //                 />
//   //                 <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
//   //                   <span className="text-muted-foreground">%</span>
//   //                 </div>
//   //               </div>
//   //               <p className="text-xs text-muted-foreground">
//   //                 Applied on room tariff before GST
//   //               </p>
//   //             </div>
//   //           </div>

//   //           <div className="space-y-4">
//   //             <div className="space-y-2">
//   //               <Label htmlFor="gstPercentage">
//   //                 GST Percentage
//   //               </Label>
//   //               <div className="relative">
//   //                 <Input
//   //                   id="gstPercentage"
//   //                   type="number"
//   //                   min="0"
//   //                   max="100"
//   //                   step="0.1"
//   //                   value={formData.gstPercentage}
//   //                   onChange={(e) =>
//   //                     setFormData(prev => ({ ...prev, gstPercentage: Number(e.target.value) }))
//   //                   }
//   //                   className="pr-12"
//   //                 />
//   //                 <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
//   //                   <span className="text-muted-foreground">%</span>
//   //                 </div>
//   //               </div>
//   //               <p className="text-xs text-muted-foreground">
//   //                 Applied on room tariff + service charge
//   //               </p>
//   //             </div>
//   //           </div>
//   //         </div>

//   //         {/* Calculation Example */}
//   //         <div className="mt-6 p-4 border rounded-lg bg-muted/50">
//   //           <h4 className="font-semibold mb-3">Calculation Example</h4>
//   //           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
//   //             <div className="space-y-1">
//   //               <div className="flex justify-between">
//   //                 <span className="text-muted-foreground">Room Rate:</span>
//   //                 <span>₹1,000</span>
//   //               </div>
//   //               <div className="flex justify-between">
//   //                 <span className="text-muted-foreground">Service Charge ({formData.serviceChargePercentage}%):</span>
//   //                 <span>₹{(1000 * formData.serviceChargePercentage / 100).toFixed(2)}</span>
//   //               </div>
//   //               <div className="flex justify-between">
//   //                 <span className="text-muted-foreground">Subtotal:</span>
//   //                 <span>₹{(1000 + (1000 * formData.serviceChargePercentage / 100)).toFixed(2)}</span>
//   //               </div>
//   //             </div>

//   //             <div className="space-y-1">
//   //               <div className="flex justify-between">
//   //                 <span className="text-muted-foreground">GST ({formData.gstPercentage}%):</span>
//   //                 <span>₹{((1000 + (1000 * formData.serviceChargePercentage / 100)) * formData.gstPercentage / 100).toFixed(2)}</span>
//   //               </div>
//   //             </div>

//   //             <div className="space-y-1">
//   //               <div className="flex justify-between font-semibold">
//   //                 <span>Total Amount:</span>
//   //                 <span className="text-primary">
//   //                   ₹{(
//   //                     1000 +
//   //                     (1000 * formData.serviceChargePercentage / 100) +
//   //                     ((1000 + (1000 * formData.serviceChargePercentage / 100)) * formData.gstPercentage / 100)
//   //                   ).toFixed(2)}
//   //                 </span>
//   //               </div>
//   //             </div>
//   //           </div>
//   //         </div>
//   //       </CardContent>
//   //     </Card>

//   //     <div className="flex justify-end gap-4">
//   //       <Button
//   //         type="button"
//   //         variant="outline"
//   //         onClick={() => {
//   //           setFormData(prev => ({
//   //             ...prev,
//   //             gstPercentage: 12,
//   //             serviceChargePercentage: 10,
//   //           }));
//   //         }}
//   //         disabled={isSaving}
//   //       >
//   //         Reset to Default
//   //       </Button>
//   //       <Button
//   //         onClick={handleUpdateTaxOnly}
//   //         disabled={isSaving}
//   //       >
//   //         {isSaving ? (
//   //           <>
//   //             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//   //             Updating...
//   //           </>
//   //         ) : (
//   //           <>
//   //             <Save className="mr-2 h-4 w-4" />
//   //             Update Tax Settings Only
//   //           </>
//   //         )}
//   //       </Button>
//   //     </div>
//   //   </>
//   // );

//   // ✅ Render Tax Settings (Database only) - UPDATED
//   const renderTaxSettings = () => (
//     <>
//       <Card>
//         <CardHeader>
//           <CardTitle>Tax Configuration</CardTitle>
//           <CardDescription>
//             Set default GST, CGST, SGST, IGST and Service Charge percentages for all rooms
//           </CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-6">
//           {/* Service Charge */}
//           <div className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="serviceChargePercentage">
//                 Service Charge Percentage
//               </Label>
//               <div className="relative">
//                 <Input
//                   id="serviceChargePercentage"
//                   type="number"
//                   min="0"
//                   max="100"
//                   step="0.1"
//                   value={formData.serviceChargePercentage}
//                   onChange={(e) =>
//                     setFormData(prev => ({ ...prev, serviceChargePercentage: Number(e.target.value) }))
//                   }
//                   className="pr-12"
//                 />
//                 <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
//                   <span className="text-muted-foreground">%</span>
//                 </div>
//               </div>
//               <p className="text-xs text-muted-foreground">
//                 Applied on room tariff before GST
//               </p>
//             </div>
//           </div>

//           {/* Tax Type Selection Info */}
//           <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
//             <h4 className="font-semibold text-blue-800 mb-2">Tax Types Supported:</h4>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//               <div className="space-y-1">
//                 <p className="font-medium">CGST + SGST (Local)</p>
//                 <p className="text-xs text-blue-600">CGST + SGST = Total GST</p>
//               </div>
//               <div className="space-y-1">
//                 <p className="font-medium">IGST (Inter-state)</p>
//                 <p className="text-xs text-blue-600">IGST = Total GST</p>
//               </div>
//             </div>
//           </div>


//           {/* GST Fields */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="space-y-2">
//               <Label htmlFor="gstPercentage">
//                 Total GST Percentage
//               </Label>
//               <div className="relative">
//                 <Input
//                   id="gstPercentage"
//                   type="number"
//                   min="0"
//                   max="100"
//                   step="0.1"
//                   value={formData.gstPercentage}
//                   onChange={(e) => {
//                     const newGst = Number(e.target.value);
//                     // FIXED: Use toFixed(1) to avoid floating point issues
//                     const halfGst = Math.round((newGst / 2) * 10) / 10; // Round to 1 decimal
//                     setFormData(prev => ({
//                       ...prev,
//                       gstPercentage: newGst,
//                       cgstPercentage: halfGst,
//                       sgstPercentage: halfGst,
//                       igstPercentage: newGst
//                     }));
//                   }}
//                   className="pr-12"
//                 />
//                 <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
//                   <span className="text-muted-foreground">%</span>
//                 </div>
//               </div>
//               <p className="text-xs text-muted-foreground">
//                 Total GST (CGST + SGST or IGST)
//               </p>
//             </div>

//             {/* CGST Input */}
//             <div className="space-y-2">
//               <Label htmlFor="cgstPercentage">
//                 CGST Percentage
//               </Label>
//               <div className="relative">
//                 <Input
//                   id="cgstPercentage"
//                   type="number"
//                   min="0"
//                   max="100"
//                   step="0.1"
//                   value={formData.cgstPercentage}
//                   onChange={(e) => {
//                     const newCgst = Number(e.target.value);
//                     // FIXED: Auto-update total GST when CGST changes
//                     setFormData(prev => ({
//                       ...prev,
//                       cgstPercentage: newCgst,
//                       // Optional: Auto-update total GST to CGST + SGST
//                       // gstPercentage: Math.round((newCgst + prev.sgstPercentage) * 10) / 10,
//                     }));
//                   }}
//                   className="pr-12"
//                 />
//                 <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
//                   <span className="text-muted-foreground">%</span>
//                 </div>
//               </div>
//               <p className="text-xs text-muted-foreground">
//                 Central GST (usually half of total GST)
//               </p>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="sgstPercentage">
//                 SGST Percentage
//               </Label>
//               <div className="relative">
//                 <Input
//                   id="sgstPercentage"
//                   type="number"
//                   min="0"
//                   max="100"
//                   step="0.1"
//                   value={formData.sgstPercentage}
//                   onChange={(e) => {
//                     const newSgst = Number(e.target.value);
//                     setFormData(prev => ({
//                       ...prev,
//                       sgstPercentage: newSgst,
//                       // Optional: Auto-update total GST to CGST + SGST
//                       // gstPercentage: Math.round((prev.cgstPercentage + newSgst) * 10) / 10,
//                     }));
//                   }}
//                   className="pr-12"
//                 />
//                 <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
//                   <span className="text-muted-foreground">%</span>
//                 </div>
//               </div>
//               <p className="text-xs text-muted-foreground">
//                 State GST (usually half of total GST)
//               </p>
//             </div>
//           </div>

//           {/* Calculation Example */}
//           <div className="mt-6 p-4 border rounded-lg bg-muted/50">
//             <h4 className="font-semibold mb-3">Calculation Example (Room Rate: ₹1,000)</h4>

//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
//               {/* Service Charge */}
//               <div className="space-y-1">
//                 <div className="flex justify-between">
//                   <span className="text-muted-foreground">Room Rate:</span>
//                   <span>₹1,000</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-muted-foreground">Service Charge ({formData.serviceChargePercentage}%):</span>
//                   <span>₹{(1000 * formData.serviceChargePercentage / 100).toFixed(2)}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-muted-foreground">Subtotal:</span>
//                   <span>₹{(1000 + (1000 * formData.serviceChargePercentage / 100)).toFixed(2)}</span>
//                 </div>
//               </div>

//               {/* CGST + SGST */}
//               <div className="space-y-1">
//                 <div className="flex justify-between font-medium">
//                   <span>CGST ({formData.cgstPercentage}%):</span>
//                   <span>₹{(((1000 + (1000 * formData.serviceChargePercentage / 100)) * formData.cgstPercentage / 100)).toFixed(2)}</span>
//                 </div>
//                 <div className="flex justify-between font-medium">
//                   <span>SGST ({formData.sgstPercentage}%):</span>
//                   <span>₹{(((1000 + (1000 * formData.serviceChargePercentage / 100)) * formData.sgstPercentage / 100)).toFixed(2)}</span>
//                 </div>
//                 <div className="flex justify-between text-green-600">
//                   <span>Total GST:</span>
//                   <span>₹{(
//                     ((1000 + (1000 * formData.serviceChargePercentage / 100)) * (formData.cgstPercentage + formData.sgstPercentage) / 100)
//                   ).toFixed(2)}</span>
//                 </div>
//               </div>

//               {/* OR IGST */}
//               <div className="space-y-1">
//                 <div className="flex justify-between font-medium">
//                   <span>IGST ({formData.igstPercentage}%):</span>
//                   <span>₹{(((1000 + (1000 * formData.serviceChargePercentage / 100)) * formData.igstPercentage / 100)).toFixed(2)}</span>
//                 </div>
//                 <div className="flex justify-between font-semibold border-t pt-1 mt-1">
//                   <span>Total Amount:</span>
//                   <span className="text-primary">
//                     ₹{(
//                       1000 +
//                       (1000 * formData.serviceChargePercentage / 100) +
//                       ((1000 + (1000 * formData.serviceChargePercentage / 100)) * (formData.cgstPercentage + formData.sgstPercentage) / 100)
//                     ).toFixed(2)}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             <div className="mt-4 text-xs text-muted-foreground border-t pt-3">
//               <p>Note: For local customers, use CGST + SGST. For inter-state customers, use IGST.</p>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       <div className="flex justify-end gap-4">
//         <Button
//           type="button"
//           variant="outline"
//           onClick={() => {
//             setFormData(prev => ({
//               ...prev,
//               gstPercentage: 12,
//               cgstPercentage: 6,
//               sgstPercentage: 6,
//               igstPercentage: 12,
//               serviceChargePercentage: 10,
//             }));
//           }}
//           disabled={isSaving}
//         >
//           Reset to Default
//         </Button>
//         <Button
//           onClick={handleUpdateTaxOnly}
//           disabled={isSaving}
//         >
//           {isSaving ? (
//             <>
//               <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//               Updating...
//             </>
//           ) : (
//             <>
//               <Save className="mr-2 h-4 w-4" />
//               Update Tax Settings Only
//             </>
//           )}
//         </Button>
//       </div>
//     </>
//   );

//   // ✅ Render Payment Settings (Database only)
//   const renderPaymentSettings = () => (
//     <>
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <QrCode className="h-5 w-5" />
//             Hotel Payment QR Code
//           </CardTitle>
//           <CardDescription>
//             Upload your hotel's UPI QR code for customer payments
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           {hotelId ? (
//             <QRCodeUpload
//               hotelId={hotelId}
//               currentQRCode={formData.qrcode_image || undefined}
//               onSuccess={handleQRCodeSuccess}
//             />
//           ) : (
//             <div className="text-center py-8">
//               <p className="text-muted-foreground">
//                 Unable to load hotel information. Please refresh the page.
//               </p>
//               <Button
//                 variant="outline"
//                 className="mt-4"
//                 onClick={fetchHotelSettings}
//               >
//                 <RefreshCw className="h-4 w-4 mr-2" />
//                 Reload Settings
//               </Button>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Current QR Code Preview */}
//       {formData.qrcode_image && (
//         <Card>
//           <CardHeader>
//             <CardTitle>Current QR Code Preview</CardTitle>
//             <CardDescription>
//               This is how your QR code will appear to customers
//             </CardDescription>
//           </CardHeader>
//           <CardContent className="flex flex-col items-center">
//             <div className="border rounded-lg p-6 bg-white shadow-sm">
//               <img
//                 src={formData.qrcode_image}
//                 alt="Hotel UPI QR Code"
//                 className="w-64 h-64 object-contain"
//                 onError={(e) => {
//                   console.error('Image load error:', e);
//                   e.currentTarget.style.display = 'none';
//                   toast({
//                     title: "Image Error",
//                     description: "QR code image failed to load. Please re-upload.",
//                     variant: "destructive",
//                   });
//                 }}
//               />
//             </div>
//             <div className="mt-4 text-center">
//               <p className="text-sm font-medium">Hotel: {formData.name}</p>
//               <p className="text-xs text-muted-foreground mt-1">
//                 Customers will scan this QR code to make online payments
//               </p>
//             </div>
//           </CardContent>
//         </Card>
//       )}
//     </>
//   );

//   // ✅ Render Logo Settings (Database only)
//   const renderLogoSettings = () => (
//     <>
//       {hotelId ? (
//         <LogoUpload
//           hotelId={hotelId}
//           currentLogo={formData.logo_image || undefined}
//           onSuccess={handleLogoSuccess}
//           disabled={userSource === "google_sheets"}
//         />
//       ) : (
//         <div className="text-center py-8">
//           <p className="text-muted-foreground">
//             Unable to load hotel information. Please refresh the page.
//           </p>
//           <Button
//             variant="outline"
//             className="mt-4"
//             onClick={fetchHotelSettings}
//           >
//             <RefreshCw className="h-4 w-4 mr-2" />
//             Reload Settings
//           </Button>
//         </div>
//       )}
//     </>
//   );

//   // Render Password Change Form (for both user types)
//   const renderPasswordChange = () => (
//     <Card>
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2">
//           <Lock className="h-5 w-5" />
//           Change Password
//         </CardTitle>
//         <CardDescription>
//           Update your account password. After changing password, you'll be logged out for security reasons.
//         </CardDescription>
//       </CardHeader>
//       <CardContent>
//         <form onSubmit={handlePasswordChange} className="space-y-6">
//           {/* Current Password */}
//           <div className="space-y-2">
//             <Label htmlFor="currentPassword">Current Password</Label>
//             <div className="relative">
//               <Input
//                 id="currentPassword"
//                 type={showCurrentPassword ? "text" : "password"}
//                 value={passwordData.currentPassword}
//                 onChange={(e) => setPasswordData(prev => ({
//                   ...prev,
//                   currentPassword: e.target.value
//                 }))}
//                 placeholder="Enter current password"
//                 required
//                 className="pr-10"
//               />
//               <Button
//                 type="button"
//                 variant="ghost"
//                 size="sm"
//                 className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
//                 onClick={() => setShowCurrentPassword(!showCurrentPassword)}
//               >
//                 {showCurrentPassword ? (
//                   <EyeOff className="h-4 w-4 text-muted-foreground" />
//                 ) : (
//                   <Eye className="h-4 w-4 text-muted-foreground" />
//                 )}
//               </Button>
//             </div>
//           </div>

//           {/* New Password */}
//           <div className="space-y-2">
//             <Label htmlFor="newPassword">New Password</Label>
//             <div className="relative">
//               <Input
//                 id="newPassword"
//                 type={showNewPassword ? "text" : "password"}
//                 value={passwordData.newPassword}
//                 onChange={(e) => setPasswordData(prev => ({
//                   ...prev,
//                   newPassword: e.target.value
//                 }))}
//                 placeholder="Enter new password (min. 6 characters)"
//                 required
//                 minLength={6}
//                 className="pr-10"
//               />
//               <Button
//                 type="button"
//                 variant="ghost"
//                 size="sm"
//                 className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
//                 onClick={() => setShowNewPassword(!showNewPassword)}
//               >
//                 {showNewPassword ? (
//                   <EyeOff className="h-4 w-4 text-muted-foreground" />
//                 ) : (
//                   <Eye className="h-4 w-4 text-muted-foreground" />
//                 )}
//               </Button>
//             </div>
//             <p className="text-xs text-muted-foreground">
//               Password must be at least 6 characters long
//             </p>
//           </div>

//           {/* Confirm Password */}
//           <div className="space-y-2">
//             <Label htmlFor="confirmPassword">Confirm New Password</Label>
//             <div className="relative">
//               <Input
//                 id="confirmPassword"
//                 type={showConfirmPassword ? "text" : "password"}
//                 value={passwordData.confirmPassword}
//                 onChange={(e) => setPasswordData(prev => ({
//                   ...prev,
//                   confirmPassword: e.target.value
//                 }))}
//                 placeholder="Confirm new password"
//                 required
//                 className="pr-10"
//               />
//               <Button
//                 type="button"
//                 variant="ghost"
//                 size="sm"
//                 className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
//                 onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//               >
//                 {showConfirmPassword ? (
//                   <EyeOff className="h-4 w-4 text-muted-foreground" />
//                 ) : (
//                   <Eye className="h-4 w-4 text-muted-foreground" />
//                 )}
//               </Button>
//             </div>
//           </div>

//           {/* Password Strength Indicator */}
//           {passwordData.newPassword && (
//             <div className="space-y-2">
//               <div className="flex justify-between text-sm">
//                 <span className="text-muted-foreground">Password Strength:</span>
//                 <span className={`
//                   font-medium
//                   ${passwordData.newPassword.length >= 8 ? 'text-green-600' :
//                     passwordData.newPassword.length >= 6 ? 'text-yellow-600' :
//                       'text-red-600'}
//                 `}>
//                   {passwordData.newPassword.length >= 8 ? 'Strong' :
//                     passwordData.newPassword.length >= 6 ? 'Medium' :
//                       'Weak'}
//                 </span>
//               </div>
//               <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
//                 <div
//                   className={`
//                     h-full rounded-full
//                     ${passwordData.newPassword.length >= 8 ? 'bg-green-500 w-full' :
//                       passwordData.newPassword.length >= 6 ? 'bg-yellow-500 w-2/3' :
//                         'bg-red-500 w-1/3'}
//                   `}
//                 ></div>
//               </div>
//             </div>
//           )}

//           {/* Password Match Indicator */}
//           {passwordData.newPassword && passwordData.confirmPassword && (
//             <div className={`flex items-center gap-2 text-sm ${passwordData.newPassword === passwordData.confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
//               {passwordData.newPassword === passwordData.confirmPassword ? (
//                 <>
//                   <div className="w-2 h-2 rounded-full bg-green-500"></div>
//                   <span>Passwords match</span>
//                 </>
//               ) : (
//                 <>
//                   <div className="w-2 h-2 rounded-full bg-red-500"></div>
//                   <span>Passwords don't match</span>
//                 </>
//               )}
//             </div>
//           )}

//           {/* Security Notice */}
//           <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
//             <h4 className="font-semibold text-yellow-800 flex items-center gap-2">
//               <Key className="h-4 w-4" />
//               Security Notice
//             </h4>
//             <ul className="mt-2 space-y-1 text-sm text-yellow-700">
//               <li>• After changing password, you will be automatically logged out</li>
//               <li>• You will need to log in again with your new password</li>
//               <li>• Choose a strong, unique password that you don't use elsewhere</li>
//               {userSource === "google_sheets" && (
//                 <li>• Your password will be updated in your Google Sheets</li>
//               )}
//             </ul>
//           </div>

//           {/* Action Buttons */}
//           <div className="flex justify-end gap-4 pt-4">
//             <Button
//               type="button"
//               variant="outline"
//               onClick={() => {
//                 setPasswordData({
//                   currentPassword: "",
//                   newPassword: "",
//                   confirmPassword: "",
//                 });
//                 setShowCurrentPassword(false);
//                 setShowNewPassword(false);
//                 setShowConfirmPassword(false);
//                 toast({
//                   title: "Form Cleared",
//                   description: "Password form has been reset",
//                 });
//               }}
//               disabled={isChangingPassword}
//             >
//               Clear Form
//             </Button>
//             <Button type="submit" disabled={isChangingPassword}>
//               {isChangingPassword ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Changing Password...
//                 </>
//               ) : (
//                 <>
//                   <Lock className="mr-2 h-4 w-4" />
//                   Change Password
//                 </>
//               )}
//             </Button>
//           </div>
//         </form>
//       </CardContent>
//     </Card>
//   );

//   if (isLoading) {
//     return (
//       <Layout>
//         <div className="flex items-center justify-center min-h-[60vh]">
//           <div className="flex flex-col items-center gap-4">
//             <Loader2 className="h-8 w-8 animate-spin text-primary" />
//             <p className="text-muted-foreground">Loading settings...</p>
//           </div>
//         </div>
//       </Layout>
//     );
//   }

//   return (
//     <Layout>
//       <div className="space-y-6 max-w-4xl mx-auto">
//         <div className="flex justify-between items-center">
//           <div>
//             <h1 className="text-3xl font-bold">Hotel Settings</h1>
//             <p className="text-muted-foreground mt-1">
//               Manage your hotel configuration, contact details, and payment settings

//             </p>
//           </div>
//           <div className="flex gap-2">
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={fetchHotelSettings}
//               disabled={isLoading}
//             >
//               <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
//               Refresh
//             </Button>
//             {/* {process.env.NODE_ENV === 'development' && (
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={debugBackendResponse}
//               >
//                 Debug API
//               </Button>
//             )} */}
//           </div>
//         </div>



//         {/* Conditionally render tabs */}
//         {renderTabs()}
//       </div>
//     </Layout>
//   );
// };

// export default Settings;



import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, RefreshCw, QrCode, Lock, Key, Eye, EyeOff, AlertCircle, Plus, Trash2, Percent } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QRCodeUpload from "@/components/QRCodeUpload";
import LogoUpload from "@/components/LogoUpload";
import { cn } from "@/lib/utils";
import NotificationDiagnostics from "@/components/NotificationDiagnostics";

const API_URL = import.meta.env.VITE_BACKEND_URL;
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwz9609W86UMSUezmt3ST_dUBsZN8JGYOFTS8kpD5SWXlYetozZqwVe3cUD5GIHHQOi/exec";

// GST Number validation functions
const validateGSTNumber = (gstNumber: string): { isValid: boolean; message: string } => {
  if (!gstNumber || gstNumber.trim() === "") {
    return { isValid: true, message: "" };
  }

  const cleanGST = gstNumber.trim().toUpperCase();

  if (cleanGST.length !== 15) {
    return { isValid: false, message: "GST number must be exactly 15 characters long" };
  }

  const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;

  if (!gstPattern.test(cleanGST)) {
    return { isValid: false, message: "Invalid GST number format" };
  }

  const stateCode = parseInt(cleanGST.substring(0, 2), 10);
  const validStateCodes = new Set([
    ...Array.from({ length: 38 }, (_, i) => i + 1), // 01-38 (includes Telangana 36, Andhra Pradesh 37, Ladakh 38)
    97, // Other Territory
    99, // Centre Jurisdiction
  ]);

  if (!validStateCodes.has(stateCode)) {
    return { isValid: false, message: "Invalid state code in GST number" };
  }

  const panPart = cleanGST.substring(2, 12);
  const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panPattern.test(panPart)) {
    return { isValid: false, message: "Invalid PAN format in GST number" };
  }

  return { isValid: true, message: "Valid GST number format" };
};

const formatGSTNumber = (value: string): string => {
  let cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (cleaned.length > 15) {
    cleaned = cleaned.substring(0, 15);
  }
  return cleaned;
};

// Interface for GST Slab
interface GSTSlab {
  minPrice: number;
  maxPrice: number;
  gstPercentage: number;
  cgstPercentage: number;
  sgstPercentage: number;
  igstPercentage: number;
}

const Settings = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [hotelId, setHotelId] = useState<string>("");
  const [userSource, setUserSource] = useState<"database" | "google_sheets">("database");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [gstValidation, setGstValidation] = useState<{ isValid: boolean; message: string }>({
    isValid: true,
    message: ""
  });

  // GST Type and Slabs State
  const [gstType, setGstType] = useState<'flat' | 'slab'>('flat');
  const [gstSlabs, setGstSlabs] = useState<GSTSlab[]>([
    { minPrice: 0, maxPrice: 999, gstPercentage: 5, cgstPercentage: 2.5, sgstPercentage: 2.5, igstPercentage: 5 },
    { minPrice: 1000, maxPrice: 1999, gstPercentage: 10, cgstPercentage: 5, sgstPercentage: 5, igstPercentage: 10 },
    { minPrice: 2000, maxPrice: Infinity, gstPercentage: 18, cgstPercentage: 9, sgstPercentage: 9, igstPercentage: 18 }
  ]);
  const [editingSlabIndex, setEditingSlabIndex] = useState<number | null>(null);

  // Password form data
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    gstNumber: "",
    hotelcode: "",
    gstPercentage: 12,
    cgstPercentage: 6,
    sgstPercentage: 6,
    igstPercentage: 12,
    serviceChargePercentage: 10,
    qrcode_image: null as string | null,
    logo_image: null as string | null,
  });

  // Fetch hotel settings
  useEffect(() => {
    fetchHotelSettings();
  }, []);

  // Helper function to calculate GST based on room price
  const calculateGSTByPrice = (price: number) => {
    if (gstType === 'flat') {
      return {
        gstPercentage: formData.gstPercentage,
        cgstPercentage: formData.cgstPercentage,
        sgstPercentage: formData.sgstPercentage,
        igstPercentage: formData.igstPercentage
      };
    } else {
      const slab = gstSlabs.find(slab => price >= slab.minPrice && price <= slab.maxPrice);
      if (slab) {
        return {
          gstPercentage: slab.gstPercentage,
          cgstPercentage: slab.cgstPercentage,
          sgstPercentage: slab.sgstPercentage,
          igstPercentage: slab.igstPercentage
        };
      }
      const lastSlab = gstSlabs[gstSlabs.length - 1];
      return {
        gstPercentage: lastSlab.gstPercentage,
        cgstPercentage: lastSlab.cgstPercentage,
        sgstPercentage: lastSlab.sgstPercentage,
        igstPercentage: lastSlab.igstPercentage
      };
    }
  };

  // Slab management functions
  const addGstSlab = () => {
    const lastSlab = gstSlabs[gstSlabs.length - 1];
    const newMinPrice = lastSlab.maxPrice === Infinity ? lastSlab.minPrice + 1000 : lastSlab.maxPrice + 1;

    const newSlab: GSTSlab = {
      minPrice: newMinPrice,
      maxPrice: Infinity,
      gstPercentage: 18,
      cgstPercentage: 9,
      sgstPercentage: 9,
      igstPercentage: 18
    };

    // Update previous slab's maxPrice
    const updatedSlabs = [...gstSlabs];
    if (updatedSlabs.length > 0) {
      updatedSlabs[updatedSlabs.length - 1].maxPrice = newMinPrice - 1;
    }
    updatedSlabs.push(newSlab);
    setGstSlabs(updatedSlabs);
  };

  const updateGstSlab = (index: number, field: string, value: number) => {
    const updatedSlabs = [...gstSlabs];
    updatedSlabs[index] = { ...updatedSlabs[index], [field]: value };

    // Validate min/max consistency
    if (field === 'minPrice' && index > 0) {
      updatedSlabs[index - 1].maxPrice = value - 1;
    }
    if (field === 'maxPrice' && index < gstSlabs.length - 1) {
      updatedSlabs[index + 1].minPrice = value + 1;
    }

    // Auto-calculate CGST/SGST if GST percentage changes
    if (field === 'gstPercentage') {
      updatedSlabs[index].cgstPercentage = value / 2;
      updatedSlabs[index].sgstPercentage = value / 2;
      updatedSlabs[index].igstPercentage = value;
    }

    setGstSlabs(updatedSlabs);
  };

  const deleteGstSlab = (index: number) => {
    if (gstSlabs.length <= 1) {
      toast({
        title: "Cannot Delete",
        description: "At least one GST slab is required",
        variant: "destructive"
      });
      return;
    }

    const updatedSlabs = gstSlabs.filter((_, i) => i !== index);
    // Adjust maxPrice of previous slab
    if (index > 0 && index < updatedSlabs.length) {
      updatedSlabs[index - 1].maxPrice = updatedSlabs[index].minPrice - 1;
    }
    setGstSlabs(updatedSlabs);
  };

  const fetchHotelSettings = async () => {
    try {
      setIsLoading(true);

      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const userSource = currentUser?.source || "database";
      setUserSource(userSource);

      console.log("👤 User Source:", userSource);

      if (userSource === "database") {
        const token = localStorage.getItem("authToken");

        if (!token) {
          console.error("No authentication token found");
          toast({
            title: "Authentication Required",
            description: "Please log in again",
            variant: "destructive",
          });
          return;
        }

        // Fetch hotel settings
        const settingsResponse = await fetch(`${API_URL}/hotels/settings`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!settingsResponse.ok) {
          throw new Error(`HTTP error! status: ${settingsResponse.status}`);
        }

        const settingsData = await settingsResponse.json();
        console.log("📊 Hotel settings response:", settingsData);

        // Fetch tax settings (including GST type and slabs)
        const taxResponse = await fetch(`${API_URL}/hotels/tax-settings`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (taxResponse.ok) {
          const taxData = await taxResponse.json();
          console.log("📊 Tax settings response:", taxData);

          if (taxData.success && taxData.data) {
            if (taxData.data.gstType) {
              setGstType(taxData.data.gstType);
            }
            if (taxData.data.gstSlabs && taxData.data.gstSlabs.length > 0) {
              setGstSlabs(taxData.data.gstSlabs);
            }
            if (taxData.data.serviceChargePercentage) {
              setFormData(prev => ({
                ...prev,
                serviceChargePercentage: taxData.data.serviceChargePercentage
              }));
            }
          }
        }

        if (settingsData.success && settingsData.data) {
          const hotelData = settingsData.data;

          const loadedGstNumber = hotelData.gstNumber || "";

          setFormData({
            name: hotelData.name || "",
            email: hotelData.email || "",
            phone: hotelData.phone || "",
            address: hotelData.address || "",
            gstNumber: loadedGstNumber,
            hotelcode: hotelData.hotelcode || "",
            gstPercentage: hotelData.gstPercentage || 12,
            cgstPercentage: hotelData.cgstPercentage || 6,
            sgstPercentage: hotelData.sgstPercentage || 6,
            igstPercentage: hotelData.igstPercentage || 12,
            serviceChargePercentage: hotelData.serviceChargePercentage || 10,
            qrcode_image: hotelData.qrcode_image || null,
            logo_image: hotelData.logo_image || null,
          });

          if (loadedGstNumber) {
            setGstValidation(validateGSTNumber(loadedGstNumber));
          }

          if (currentUser.hotel_id) {
            setHotelId(currentUser.hotel_id);
          }
        } else {
          throw new Error(settingsData.message || "Failed to load settings");
        }
      } else {
        // Google Sheets user
        if (currentUser && currentUser.name) {
          setFormData({
            name: currentUser.name || "",
            email: currentUser.email || "",
            phone: currentUser.phone || "",
            address: currentUser.address || "",
            gstNumber: currentUser.gst_number || currentUser.gstNumber || "",
            hotelcode: "",
            gstPercentage: currentUser.gstPercentage || 12,
            cgstPercentage: currentUser.cgstPercentage || (currentUser.gstPercentage ? currentUser.gstPercentage / 2 : 6),
            sgstPercentage: currentUser.sgstPercentage || (currentUser.gstPercentage ? currentUser.gstPercentage / 2 : 6),
            igstPercentage: currentUser.igstPercentage || currentUser.gstPercentage || 12,
            serviceChargePercentage: currentUser.serviceChargePercentage || 10,
            qrcode_image: null,
            logo_image: null,
          });

          if (currentUser.hotel_id) {
            setHotelId(currentUser.hotel_id);
          }
        }
      }
    } catch (error: any) {
      console.error("❌ Error fetching hotel settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGSTChange = (value: string) => {
    const formattedValue = formatGSTNumber(value);
    setFormData(prev => ({ ...prev, gstNumber: formattedValue }));

    if (formattedValue && formattedValue.length === 15) {
      const validation = validateGSTNumber(formattedValue);
      setGstValidation(validation);
    } else if (formattedValue && formattedValue.length > 0) {
      setGstValidation({
        isValid: false,
        message: `GST number must be 15 characters (currently ${formattedValue.length})`
      });
    } else {
      setGstValidation({ isValid: true, message: "" });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.currentPassword) {
      toast({
        title: "Current Password Required",
        description: "Please enter your current password",
        variant: "destructive",
      });
      return;
    }

    if (!passwordData.newPassword) {
      toast({
        title: "New Password Required",
        description: "Please enter a new password",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "New password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "New password and confirmation password must match",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsChangingPassword(true);
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const userSource = currentUser?.source || "database";

      if (userSource === "database") {
        const token = localStorage.getItem("authToken");

        if (!token) {
          toast({
            title: "Authentication Error",
            description: "Please log in again",
            variant: "destructive",
          });
          return;
        }

        const response = await fetch(`${API_URL}/auth/change-password`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to change password");
        }

        if (result.success) {
          toast({
            title: "Password Changed",
            description: "Your password has been updated successfully",
          });

          setPasswordData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });

          setTimeout(() => {
            toast({
              title: "Please Login Again",
              description: "You will be logged out for security reasons",
            });
            localStorage.removeItem("authToken");
            localStorage.removeItem("currentUser");
            window.location.href = "/login";
          }, 2000);
        }
      }
    } catch (error: any) {
      console.error("❌ Error changing password:", error);
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveAllSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const currentUserForValidation = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const userSourceForValidation = currentUserForValidation?.source || "database";

    if (userSourceForValidation === "database" && formData.gstNumber) {
      const validation = validateGSTNumber(formData.gstNumber);
      if (!validation.isValid) {
        toast({
          title: "Invalid GST Number",
          description: validation.message,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setIsSaving(true);
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const userSource = currentUser?.source || "database";

      if (userSource === "database") {
        const token = localStorage.getItem("authToken");

        if (!token) {
          toast({
            title: "Authentication Error",
            description: "Please log in again",
            variant: "destructive",
          });
          return;
        }

        const response = await fetch(`${API_URL}/hotels/settings`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            gstNumber: formData.gstNumber || null,
            hotelcode: formData.hotelcode?.trim() || null,
            gstPercentage: parseFloat(formData.gstPercentage.toString()),
            cgstPercentage: parseFloat(formData.cgstPercentage.toString()),
            sgstPercentage: parseFloat(formData.sgstPercentage.toString()),
            igstPercentage: parseFloat(formData.igstPercentage.toString()),
            serviceChargePercentage: parseFloat(formData.serviceChargePercentage.toString()),
            qrcode_image: formData.qrcode_image,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to update settings");
        }

        if (result.success) {
          const updatedUser = {
            ...currentUser,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            gstNumber: formData.gstNumber,
            gstPercentage: formData.gstPercentage,
            cgstPercentage: formData.cgstPercentage,
            sgstPercentage: formData.sgstPercentage,
            igstPercentage: formData.igstPercentage,
            serviceChargePercentage: formData.serviceChargePercentage,
          };
          localStorage.setItem("currentUser", JSON.stringify(updatedUser));

          toast({
            title: "Settings Updated",
            description: "Your hotel settings have been saved successfully.",
          });

          fetchHotelSettings();
        }
      }
    } catch (error: any) {
      console.error("Error updating settings:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateTaxOnly = async () => {
    // Validate based on GST type
    if (gstType === 'flat') {
      if (formData.gstPercentage < 0 || formData.gstPercentage > 100) {
        toast({
          title: "Invalid GST",
          description: "GST percentage must be between 0 and 100",
          variant: "destructive",
        });
        return;
      }

      if (formData.cgstPercentage < 0 || formData.cgstPercentage > 100) {
        toast({
          title: "Invalid CGST",
          description: "CGST percentage must be between 0 and 100",
          variant: "destructive",
        });
        return;
      }

      if (formData.sgstPercentage < 0 || formData.sgstPercentage > 100) {
        toast({
          title: "Invalid SGST",
          description: "SGST percentage must be between 0 and 100",
          variant: "destructive",
        });
        return;
      }

      const cgstPlusSgst = (formData.cgstPercentage + formData.sgstPercentage).toFixed(2);
      const totalGst = formData.gstPercentage.toFixed(2);

      if (Math.abs(parseFloat(cgstPlusSgst) - parseFloat(totalGst)) > 0.01) {
        toast({
          title: "Tax Mismatch",
          description: `CGST (${formData.cgstPercentage}%) + SGST (${formData.sgstPercentage}%) = ${cgstPlusSgst}% should equal total GST ${totalGst}%`,
          variant: "destructive",
        });
        return;
      }
    } else {
      // Validate slabs
      for (let i = 0; i < gstSlabs.length; i++) {
        const slab = gstSlabs[i];
        if (slab.gstPercentage < 0 || slab.gstPercentage > 100) {
          toast({
            title: `Invalid GST in Slab ${i + 1}`,
            description: "GST percentage must be between 0 and 100",
            variant: "destructive",
          });
          return;
        }

        const cgstPlusSgst = (slab.cgstPercentage + slab.sgstPercentage).toFixed(2);
        const totalGst = slab.gstPercentage.toFixed(2);

        if (Math.abs(parseFloat(cgstPlusSgst) - parseFloat(totalGst)) > 0.01) {
          toast({
            title: `Tax Mismatch in Slab ${i + 1}`,
            description: `CGST (${slab.cgstPercentage}%) + SGST (${slab.sgstPercentage}%) = ${cgstPlusSgst}% should equal total GST ${totalGst}%`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    if (formData.serviceChargePercentage < 0 || formData.serviceChargePercentage > 100) {
      toast({
        title: "Invalid Service Charge",
        description: "Service charge percentage must be between 0 and 100",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const userSource = currentUser?.source || "database";

      if (userSource === "database") {
        const token = localStorage.getItem("authToken");

        if (!token) {
          toast({
            title: "Authentication Error",
            description: "Please log in again",
            variant: "destructive",
          });
          return;
        }

        const payload: any = {
          gstType: gstType,
          serviceChargePercentage: formData.serviceChargePercentage
        };

        if (gstType === 'flat') {
          payload.flatGst = {
            gstPercentage: formData.gstPercentage,
            cgstPercentage: formData.cgstPercentage,
            sgstPercentage: formData.sgstPercentage,
            igstPercentage: formData.igstPercentage
          };
        } else {
          payload.gstSlabs = gstSlabs;
        }

        console.log("📤 Sending tax update:", payload);

        const response = await fetch(`${API_URL}/hotels/tax-settings`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to update tax settings");
        }

        if (result.success) {
          toast({
            title: "Tax Settings Updated",
            description: gstType === 'flat'
              ? "Flat GST settings updated successfully"
              : "Slab-wise GST settings updated successfully",
          });

          fetchHotelSettings();
        }
      }
    } catch (error: any) {
      console.error("Error updating tax settings:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update tax settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleQRCodeSuccess = () => {
    if (userSource === "database") {
      fetchHotelSettings();
      toast({
        title: "QR Code Updated",
        description: "Hotel QR code has been updated successfully.",
      });
    }
  };

  const handleLogoSuccess = () => {
    if (userSource === "database") {
      fetchHotelSettings();
      toast({
        title: "Logo Updated",
        description: "Hotel logo has been updated successfully.",
      });
    }
  };

  // Render General Settings
  const renderGeneralSettings = () => {
    return (
      <form onSubmit={handleSaveAllSettings} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Hotel Information</CardTitle>
            <CardDescription>
              Update your hotel's basic information and contact details
              {userSource === "google_sheets" && (
                <span className="block text-sm text-yellow-600 mt-1">
                  Note: Changes are saved locally and synced to Google Sheets
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Hotel Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter hotel name"
                required
              />
            </div>

            {userSource === "database" && (
              <div className="space-y-2">
                <Label htmlFor="hotelcode">
                  AIOSELL Hotel Code
                  <span className="text-xs text-muted-foreground ml-2">(From AIOSELL CM)</span>
                </Label>
                <Input
                  id="hotelcode"
                  value={formData.hotelcode}
                  onChange={(e) => setFormData(prev => ({ ...prev, hotelcode: e.target.value.trim() }))}
                  placeholder="e.g., 5cafb00333"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Used for OTA inventory, rates, and reservation mapping with AIOSELL.
                </p>
              </div>
            )}

            {userSource === "database" && (
              <div className="space-y-2">
                <Label htmlFor="gstNumber">
                  GST Number
                  <span className="text-xs text-muted-foreground ml-2">(Optional)</span>
                </Label>
                <div className="relative">
                  <Input
                    id="gstNumber"
                    value={formData.gstNumber}
                    onChange={(e) => handleGSTChange(e.target.value)}
                    placeholder="e.g., 22AAAAA0000A1Z"
                    className={`font-mono text-sm uppercase ${formData.gstNumber && !gstValidation.isValid && formData.gstNumber.length === 15
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : formData.gstNumber && gstValidation.isValid && formData.gstNumber.length === 15
                        ? 'border-green-500 focus-visible:ring-green-500'
                        : ''
                      }`}
                  />
                  {formData.gstNumber && formData.gstNumber.length === 15 && gstValidation.isValid && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>

                {formData.gstNumber && (
                  <div className="space-y-1">
                    {formData.gstNumber.length !== 15 && formData.gstNumber.length > 0 && (
                      <p className="text-xs text-yellow-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {gstValidation.message || `GST number should be 15 characters (currently ${formData.gstNumber.length})`}
                      </p>
                    )}

                    {formData.gstNumber.length === 15 && !gstValidation.isValid && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {gstValidation.message}
                      </p>
                    )}

                    {formData.gstNumber.length === 15 && gstValidation.isValid && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        ✓ {gstValidation.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Contact Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="hotel@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Contact Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+91 9876543210"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">
                Hotel Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter complete address"
                required
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              fetchHotelSettings();
              setGstValidation({ isValid: true, message: "" });
              toast({
                title: "Form Reset",
                description: "All changes have been discarded.",
              });
            }}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            Discard Changes
          </Button>
          <Button
            type="submit"
            disabled={isSaving || (formData.gstNumber?.length === 15 && !gstValidation.isValid)}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save All Changes
              </>
            )}
          </Button>
        </div>
      </form>
    );
  };

  // Render Tax Settings with Slab support
  const renderTaxSettings = () => (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl">Tax Configuration</CardTitle>
          <CardDescription className="text-sm">
            Choose between flat GST rate or slab-based GST based on room price
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          {/* GST Type Selection */}
          <div className="space-y-3 sm:space-y-4">
            <Label className="text-sm">GST Calculation Method</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
              <Button
                type="button"
                variant={gstType === 'flat' ? 'default' : 'outline'}
                onClick={() => setGstType('flat')}
                className="h-auto min-h-11 w-full justify-start gap-2 px-3 py-3 text-left sm:justify-center sm:text-center"
              >
                <Percent className="h-4 w-4 shrink-0" />
                <span className="text-xs sm:text-sm leading-snug">
                  Flat GST
                  <span className="block text-[10px] font-normal opacity-80 sm:inline sm:ml-1">
                    (same for all rooms)
                  </span>
                </span>
              </Button>
              <Button
                type="button"
                variant={gstType === 'slab' ? 'default' : 'outline'}
                onClick={() => setGstType('slab')}
                className="h-auto min-h-11 w-full justify-start gap-2 px-3 py-3 text-left sm:justify-center sm:text-center"
              >
                <span className="shrink-0">📊</span>
                <span className="text-xs sm:text-sm leading-snug">
                  Slab-wise GST
                  <span className="block text-[10px] font-normal opacity-80 sm:inline sm:ml-1">
                    (based on room price)
                  </span>
                </span>
              </Button>
            </div>
          </div>

          {/* Service Charge (Common for both types) */}
          <div className="space-y-2">
            <Label htmlFor="serviceChargePercentage">
              Service Charge Percentage
            </Label>
            <div className="relative">
              <Input
                id="serviceChargePercentage"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.serviceChargePercentage}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, serviceChargePercentage: Number(e.target.value) }))
                }
                className="pr-12"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-muted-foreground">%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Applied on room tariff before GST
            </p>
          </div>

          {/* Flat GST Settings */}
          {gstType === 'flat' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Same GST percentage will be applied to all rooms regardless of price
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="gstPercentage" className="text-sm">Total GST Percentage</Label>
                  <div className="relative">
                    <Input
                      id="gstPercentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.gstPercentage}
                      onChange={(e) => {
                        const newGst = Number(e.target.value);
                        const halfGst = Math.round((newGst / 2) * 10) / 10;
                        setFormData(prev => ({
                          ...prev,
                          gstPercentage: newGst,
                          cgstPercentage: halfGst,
                          sgstPercentage: halfGst,
                          igstPercentage: newGst
                        }));
                      }}
                      className="pr-12"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">CGST Percentage</Label>
                  <Input
                    value={formData.cgstPercentage}
                    onChange={(e) => {
                      const newCgst = Number(e.target.value);
                      setFormData(prev => ({
                        ...prev,
                        cgstPercentage: newCgst,
                        gstPercentage: newCgst + prev.sgstPercentage
                      }));
                    }}
                    className="pr-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">SGST Percentage</Label>
                  <Input
                    value={formData.sgstPercentage}
                    onChange={(e) => {
                      const newSgst = Number(e.target.value);
                      setFormData(prev => ({
                        ...prev,
                        sgstPercentage: newSgst,
                        gstPercentage: prev.cgstPercentage + newSgst
                      }));
                    }}
                    className="pr-12"
                  />
                </div>
              </div>

              {/* Calculation Example for Flat GST */}
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 border rounded-lg bg-muted/50 overflow-hidden">
                <h4 className="font-semibold text-sm sm:text-base mb-3">Calculation Example (Room Rate: ₹1,000)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-muted-foreground shrink min-w-0">Room Rate</span>
                      <span className="shrink-0 tabular-nums">₹1,000</span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-muted-foreground shrink min-w-0">Service ({formData.serviceChargePercentage}%)</span>
                      <span className="shrink-0 tabular-nums">₹{(1000 * formData.serviceChargePercentage / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-muted-foreground shrink min-w-0">Subtotal</span>
                      <span className="shrink-0 tabular-nums">₹{(1000 + (1000 * formData.serviceChargePercentage / 100)).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-muted-foreground shrink min-w-0">CGST ({formData.cgstPercentage}%)</span>
                      <span className="shrink-0 tabular-nums">₹{(((1000 + (1000 * formData.serviceChargePercentage / 100)) * formData.cgstPercentage / 100)).toFixed(2)}</span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-muted-foreground shrink min-w-0">SGST ({formData.sgstPercentage}%)</span>
                      <span className="shrink-0 tabular-nums">₹{(((1000 + (1000 * formData.serviceChargePercentage / 100)) * formData.sgstPercentage / 100)).toFixed(2)}</span>
                    </div>
                    <div className="flex items-start justify-between gap-3 font-semibold border-t pt-2 mt-1">
                      <span className="shrink min-w-0">Total</span>
                      <span className="text-primary shrink-0 tabular-nums">
                        ₹{(
                          1000 +
                          (1000 * formData.serviceChargePercentage / 100) +
                          ((1000 + (1000 * formData.serviceChargePercentage / 100)) * formData.gstPercentage / 100)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Slab-wise GST Settings */}
          {gstType === 'slab' && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  GST will be calculated automatically based on room price slabs
                </p>
              </div>

              {/* GST Slabs */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                  <Label className="text-sm sm:text-base font-semibold">GST Slabs</Label>
                  <Button type="button" size="sm" onClick={addGstSlab} variant="outline" className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Slab
                  </Button>
                </div>

                {gstSlabs.map((slab, index) => (
                  <div key={index} className="border rounded-lg p-3 sm:p-4 space-y-3 overflow-hidden">
                    <div className="flex justify-between items-center gap-2">
                      <h4 className="font-medium text-sm sm:text-base">Slab {index + 1}</h4>
                      {gstSlabs.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteGstSlab(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Minimum Price (₹)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={slab.minPrice}
                          onChange={(e) => updateGstSlab(index, 'minPrice', Number(e.target.value))}
                          disabled={index === 0 && slab.minPrice === 0}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Maximum Price (₹)</Label>
                        <Input
                          type="number"
                          min={slab.minPrice}
                          value={slab.maxPrice === Infinity ? '' : slab.maxPrice}
                          onChange={(e) => {
                            const value = e.target.value === '' ? Infinity : Number(e.target.value);
                            updateGstSlab(index, 'maxPrice', value);
                          }}
                          placeholder="Any"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">GST %</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={slab.gstPercentage}
                          onChange={(e) => {
                            const newGst = Number(e.target.value);
                            updateGstSlab(index, 'gstPercentage', newGst);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">CGST %</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={slab.cgstPercentage}
                          onChange={(e) => updateGstSlab(index, 'cgstPercentage', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">SGST %</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={slab.sgstPercentage}
                          onChange={(e) => updateGstSlab(index, 'sgstPercentage', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">IGST %</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={slab.igstPercentage}
                          onChange={(e) => updateGstSlab(index, 'igstPercentage', Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Slab Preview with Examples */}
              {/* Slab Preview with Examples */}
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg overflow-hidden">
                <h4 className="font-semibold text-sm sm:text-base mb-3">Slab Preview & Examples</h4>
                <div className="space-y-3">
                  {gstSlabs.map((slab, index) => (
                    <div key={index} className="border-b pb-3 last:border-0 min-w-0">
                      <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-start text-xs sm:text-sm mb-2">
                        <span className="font-medium break-words min-w-0">
                          ₹
                          {slab.minPrice !== null && slab.minPrice !== undefined
                            ? slab.minPrice.toLocaleString()
                            : '0'}
                          {' – '}
                          {slab.maxPrice === Infinity
                            ? 'Any'
                            : slab.maxPrice !== null && slab.maxPrice !== undefined
                              ? `₹${slab.maxPrice.toLocaleString()}`
                              : 'Any'}
                        </span>
                        <span className="font-bold text-green-600 shrink-0">GST {slab.gstPercentage}%</span>
                      </div>
                      <div className="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
                        <span>CGST {slab.cgstPercentage}%</span>
                        <span>SGST {slab.sgstPercentage}%</span>
                        <span>IGST {slab.igstPercentage}%</span>
                      </div>
                      {/* Example calculation */}
                      <div className="text-xs text-gray-600 mt-2 break-words leading-relaxed">
                        Example for ₹
                        {(() => {
                          const examplePrice = slab.minPrice === 0 || slab.minPrice === null || slab.minPrice === undefined
                            ? 500
                            : slab.minPrice;
                          const serviceChargeAmount = examplePrice * (formData.serviceChargePercentage / 100);
                          const subtotal = examplePrice + serviceChargeAmount;
                          const gstAmount = subtotal * (slab.gstPercentage / 100);
                          const total = subtotal + gstAmount;

                          return `Room ₹${examplePrice} + Service ${formData.serviceChargePercentage}% = ₹${subtotal.toFixed(2)} + GST ${slab.gstPercentage}% = ₹${total.toFixed(2)}`;
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setFormData(prev => ({
              ...prev,
              gstPercentage: 12,
              cgstPercentage: 6,
              sgstPercentage: 6,
              igstPercentage: 12,
              serviceChargePercentage: 10,
            }));
            setGstType('flat');
            setGstSlabs([
              { minPrice: 0, maxPrice: 999, gstPercentage: 5, cgstPercentage: 2.5, sgstPercentage: 2.5, igstPercentage: 5 },
              { minPrice: 1000, maxPrice: 1999, gstPercentage: 10, cgstPercentage: 5, sgstPercentage: 5, igstPercentage: 10 },
              { minPrice: 2000, maxPrice: Infinity, gstPercentage: 18, cgstPercentage: 9, sgstPercentage: 9, igstPercentage: 18 }
            ]);
          }}
          disabled={isSaving}
          className="w-full sm:w-auto"
        >
          Reset to Default
        </Button>
        <Button
          onClick={handleUpdateTaxOnly}
          disabled={isSaving}
          className="w-full sm:w-auto"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Update Tax Settings
            </>
          )}
        </Button>
      </div>
    </>
  );

  const renderPaymentSettings = () => (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Hotel Payment QR Code
          </CardTitle>
          <CardDescription>
            Upload your hotel's UPI QR code for customer payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hotelId ? (
            <QRCodeUpload
              hotelId={hotelId}
              currentQRCode={formData.qrcode_image || undefined}
              onSuccess={handleQRCodeSuccess}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Unable to load hotel information. Please refresh the page.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={fetchHotelSettings}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Settings
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {formData.qrcode_image && (
        <Card>
          <CardHeader>
            <CardTitle>Current QR Code Preview</CardTitle>
            <CardDescription>
              This is how your QR code will appear to customers
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="border rounded-lg p-6 bg-white shadow-sm">
              <img
                src={formData.qrcode_image}
                alt="Hotel UPI QR Code"
                className="w-64 h-64 object-contain"
                onError={(e) => {
                  console.error('Image load error:', e);
                  e.currentTarget.style.display = 'none';
                  toast({
                    title: "Image Error",
                    description: "QR code image failed to load. Please re-upload.",
                    variant: "destructive",
                  });
                }}
              />
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm font-medium">Hotel: {formData.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Customers will scan this QR code to make online payments
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );

  const renderLogoSettings = () => (
    <>
      {hotelId ? (
        <LogoUpload
          hotelId={hotelId}
          currentLogo={formData.logo_image || undefined}
          onSuccess={handleLogoSuccess}
          disabled={userSource === "google_sheets"}
        />
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Unable to load hotel information. Please refresh the page.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={fetchHotelSettings}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload Settings
          </Button>
        </div>
      )}
    </>
  );

  const renderPasswordChange = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Change Password
        </CardTitle>
        <CardDescription>
          Update your account password. After changing password, you'll be logged out for security reasons.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordChange} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({
                  ...prev,
                  currentPassword: e.target.value
                }))}
                placeholder="Enter current password"
                required
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({
                  ...prev,
                  newPassword: e.target.value
                }))}
                placeholder="Enter new password (min. 6 characters)"
                required
                minLength={6}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Password must be at least 6 characters long
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({
                  ...prev,
                  confirmPassword: e.target.value
                }))}
                placeholder="Confirm new password"
                required
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          {passwordData.newPassword && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Password Strength:</span>
                <span className={`
                  font-medium
                  ${passwordData.newPassword.length >= 8 ? 'text-green-600' :
                    passwordData.newPassword.length >= 6 ? 'text-yellow-600' :
                      'text-red-600'}
                `}>
                  {passwordData.newPassword.length >= 8 ? 'Strong' :
                    passwordData.newPassword.length >= 6 ? 'Medium' :
                      'Weak'}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`
                    h-full rounded-full
                    ${passwordData.newPassword.length >= 8 ? 'bg-green-500 w-full' :
                      passwordData.newPassword.length >= 6 ? 'bg-yellow-500 w-2/3' :
                        'bg-red-500 w-1/3'}
                  `}
                ></div>
              </div>
            </div>
          )}

          {passwordData.newPassword && passwordData.confirmPassword && (
            <div className={`flex items-center gap-2 text-sm ${passwordData.newPassword === passwordData.confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
              {passwordData.newPassword === passwordData.confirmPassword ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Passwords match</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span>Passwords don't match</span>
                </>
              )}
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPasswordData({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: "",
                });
                setShowCurrentPassword(false);
                setShowNewPassword(false);
                setShowConfirmPassword(false);
                toast({
                  title: "Form Cleared",
                  description: "Password form has been reset",
                });
              }}
              disabled={isChangingPassword}
            >
              Clear Form
            </Button>
            <Button type="submit" disabled={isChangingPassword}>
              {isChangingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing Password...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const renderTabs = () => {
    if (userSource === "google_sheets") {
      return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="password">Change Password</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="space-y-6">
            {renderGeneralSettings()}
          </TabsContent>
          <TabsContent value="password" className="space-y-6">
            {renderPasswordChange()}
          </TabsContent>
        </Tabs>
      );
    } else {
      return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="relative -mx-1 px-1 sm:mx-0 sm:px-0">
            <TabsList className="w-full flex flex-nowrap overflow-x-auto overflow-y-hidden pb-1 hide-scrollbar md:grid md:grid-cols-6 md:overflow-visible gap-1 h-auto min-h-10 p-1">
              <TabsTrigger value="general" className="flex-shrink-0 md:flex-shrink whitespace-nowrap px-2.5 py-2 text-xs sm:px-3 sm:text-sm">
                Settings
              </TabsTrigger>
              <TabsTrigger value="tax" className="flex-shrink-0 md:flex-shrink whitespace-nowrap px-2.5 py-2 text-xs sm:px-3 sm:text-sm">
                Tax & Pricing
              </TabsTrigger>
              <TabsTrigger value="payment" className="flex-shrink-0 md:flex-shrink whitespace-nowrap px-2.5 py-2 text-xs sm:px-3 sm:text-sm">
                QR Code
              </TabsTrigger>
              <TabsTrigger value="logo" className="flex-shrink-0 md:flex-shrink whitespace-nowrap px-2.5 py-2 text-xs sm:px-3 sm:text-sm">
                Logo
              </TabsTrigger>
              <TabsTrigger value="password" className="flex-shrink-0 md:flex-shrink whitespace-nowrap px-2.5 py-2 text-xs sm:px-3 sm:text-sm">
                Password
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex-shrink-0 md:flex-shrink whitespace-nowrap px-2.5 py-2 text-xs sm:px-3 sm:text-sm">
                Notifications
              </TabsTrigger>
            </TabsList>
            <div className="pointer-events-none absolute right-0 top-0 bottom-1 w-6 bg-gradient-to-l from-background to-transparent md:hidden" />
          </div>

          <TabsContent value="general" className="space-y-6">
            {renderGeneralSettings()}
          </TabsContent>
          <TabsContent value="tax" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6 focus-visible:outline-none">
            {renderTaxSettings()}
          </TabsContent>
          <TabsContent value="payment" className="space-y-6">
            {renderPaymentSettings()}
          </TabsContent>
          <TabsContent value="logo" className="space-y-6">
            {renderLogoSettings()}
          </TabsContent>
          <TabsContent value="password" className="space-y-6">
            {renderPasswordChange()}
          </TabsContent>
          <TabsContent value="notifications" className="space-y-6">
            <NotificationDiagnostics />
          </TabsContent>
        </Tabs>
      );
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto min-w-0 px-1 sm:px-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold">Hotel Settings</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Manage your hotel configuration, contact details, and payment settings
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHotelSettings}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>

        {renderTabs()}
      </div>
    </Layout>
  );
};

export default Settings;