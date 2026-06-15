// components/QRCodeUpload.tsx - Updated
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, QrCode, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge'; // Add this import

interface QRCodeUploadProps {
  hotelId: string;
  currentQRCode?: string;
  onSuccess: () => void;
}

export default function QRCodeUpload({ hotelId, currentQRCode, onSuccess }: QRCodeUploadProps) {
  const { toast } = useToast();
  const [qrCode, setQRCode] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  // Clean Base64 string function
  const cleanBase64String = (base64String: string): string => {
    // Remove data:image/...;base64, prefix if it exists
    if (base64String.includes(';base64,')) {
      return base64String.split(';base64,')[1];
    }
    // Remove data:image/... prefix
    if (base64String.startsWith('data:image/')) {
      const parts = base64String.split(',');
      return parts.length > 1 ? parts[1] : base64String;
    }
    return base64String;
  };

  // Format Base64 string for database storage
  const formatBase64ForStorage = (base64String: string, mimeType: string = 'image/png'): string => {
    const cleanBase64 = cleanBase64String(base64String);
    return `data:${mimeType};base64,${cleanBase64}`;
  };

  // Validate Base64 string
  const isValidBase64 = (base64String: string): boolean => {
    try {
      // Clean the string first
      const cleanBase64 = cleanBase64String(base64String);
      
      // Check if it's a valid Base64
      const decoded = atob(cleanBase64);
      
      // Simple validation - decoded string should not be empty
      return decoded.length > 0;
    } catch (error) {
      return false;
    }
  };

  // Get MIME type from Base64 string
  const getMimeType = (base64String: string): string => {
    if (base64String.startsWith('data:image/jpeg') || base64String.includes('image/jpeg')) {
      return 'image/jpeg';
    } else if (base64String.startsWith('data:image/png') || base64String.includes('image/png')) {
      return 'image/png';
    } else if (base64String.startsWith('data:image/jpg') || base64String.includes('image/jpg')) {
      return 'image/jpeg';
    } else if (base64String.startsWith('data:image/webp') || base64String.includes('image/webp')) {
      return 'image/webp';
    } else {
      return 'image/png'; // default
    }
  };

  // Initialize preview from currentQRCode
  useState(() => {
    if (currentQRCode && currentQRCode.startsWith('data:image/')) {
      setPreview(currentQRCode);
    }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload JPG, PNG, or WebP images only",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 2MB for QR code)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive"
      });
      return;
    }

    // Store file name
    setFileName(file.name);

    // Convert to base64 using FileReader
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Result = event.target?.result as string;
      
      if (isValidBase64(base64Result)) {
        // Format for storage
        const formattedBase64 = formatBase64ForStorage(base64Result, file.type);
        setQRCode(formattedBase64);
        setPreview(formattedBase64);
        
        toast({
          title: "Image loaded",
          description: "QR code image ready for upload",
          variant: "default"
        });
      } else {
        toast({
          title: "Invalid image",
          description: "The image file appears to be corrupted",
          variant: "destructive"
        });
      }
    };
    
    reader.onerror = () => {
      toast({
        title: "Error reading file",
        description: "Failed to read the image file",
        variant: "destructive"
      });
    };
    
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!qrCode) {
      toast({
        title: "No QR code selected",
        description: "Please select a QR code image to upload",
        variant: "destructive"
      });
      return;
    }

    if (!isValidBase64(qrCode)) {
      toast({
        title: "Invalid QR code",
        description: "The QR code image is not valid",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/hotels/${hotelId}/qrcode`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          qrcode_image: qrCode,
          file_name: fileName || 'qr_code.png'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: "✅ QR Code Updated",
          description: "Hotel QR code has been updated successfully",
          variant: "default",
          duration: 3000,
        });
        onSuccess();
      } else {
        throw new Error(data.message || "Failed to update QR code");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload QR code. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveQRCode = async () => {
    try {
      setIsUploading(true);
      const token = localStorage.getItem("authToken");
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/hotels/${hotelId}/qrcode`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setQRCode('');
        setPreview(null);
        setFileName('');
        toast({
          title: "QR Code Removed",
          description: "QR code has been removed successfully",
        });
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove QR code",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Hotel Payment QR Code</h3>
        </div>
        {preview && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Check className="h-3 w-3" />
            Ready
          </Badge>
        )}
      </div>

      {/* Preview Section */}
      <div className="border rounded-lg p-6 bg-gray-50">
        <div className="text-center">
          <Label className="mb-4 block text-sm font-medium">Preview</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center min-h-[200px]">
            {preview ? (
              <>
                <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                  <img
                    src={preview}
                    alt="QR Code Preview"
                    className="w-48 h-48 object-contain mx-auto"
                    onError={(e) => {
                      console.error("Image load error:", e);
                      toast({
                        title: "Image Error",
                        description: "Failed to load QR code image",
                        variant: "destructive",
                      });
                    }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {fileName || "QR Code"} - Preview
                </p>
              </>
            ) : (
              <div className="text-center">
                <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No QR code uploaded yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Upload a QR code to preview it here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="space-y-4">
        <Label htmlFor="qrCodeUpload">Upload QR Code Image</Label>
        
        <div className="border-2 border-dashed border-primary/30 rounded-lg p-6 text-center hover:border-primary/50 transition-colors bg-primary/5">
          <input
            type="file"
            id="qrCodeUpload"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
          
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              {isUploading ? (
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              ) : (
                <Upload className="h-8 w-8 text-primary" />
              )}
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">
                {fileName ? fileName : "Click to select QR code"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supported: JPG, PNG, WebP • Max 2MB
              </p>
            </div>
            
            <div className="flex justify-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('qrCodeUpload')?.click()}
                disabled={isUploading}
              >
                {preview ? "Change Image" : "Select Image"}
              </Button>
              
              {preview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setQRCode('');
                    setPreview(null);
                    setFileName('');
                  }}
                  disabled={isUploading}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* File Info */}
        {fileName && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">{fileName}</span>
            </div>
            <span className="text-xs text-blue-600">
              {preview ? "Ready to upload" : "Processing..."}
            </span>
          </div>
        )}

        {/* Upload Button */}
        <div className="flex gap-4 pt-4">
          <Button
            onClick={handleUpload}
            disabled={!preview || isUploading}
            className="flex-1"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload QR Code
              </>
            )}
          </Button>
          
          {currentQRCode && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleRemoveQRCode}
              disabled={isUploading}
            >
              Remove QR Code
            </Button>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
        <h4 className="font-medium text-sm">📋 QR Code Requirements:</h4>
        <ul className="text-xs space-y-2">
          <li className="flex items-start gap-2">
            <Check className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>Format:</strong> Clear PNG or JPG with white background</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>Size:</strong> Minimum 500×500 pixels for good quality</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>File size:</strong> Maximum 2MB</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>Testing:</strong> Always test with UPI apps before uploading</span>
          </li>
        </ul>
      </div>
    </div>
  );
}