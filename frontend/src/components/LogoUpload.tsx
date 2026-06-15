import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image as ImageIcon, Loader2, Eye, EyeOff } from 'lucide-react';

interface LogoUploadProps {
  hotelId: string;
  currentLogo?: string;
  onSuccess: () => void;
  disabled?: boolean;
}

const API_URL = import.meta.env.VITE_BACKEND_URL;

const LogoUpload: React.FC<LogoUploadProps> = ({ hotelId, currentLogo, onSuccess, disabled }) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentLogo || null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  const maxSizeMB = 1;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) return;

    // Validate file type
    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload PNG, JPG, or WebP image files only.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: `Logo must be less than ${maxSizeMB}MB.`,
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !hotelId) {
      toast({
        title: "No File Selected",
        description: "Please select a logo file to upload.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      // Convert file to Base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });

      // Upload to server
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/hotels/${hotelId}/logo`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logo_image: base64,
          file_name: file.name
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to upload logo');
      }

      toast({
        title: "Success",
        description: "Hotel logo uploaded successfully",
      });

      onSuccess();

    } catch (error: any) {
      console.error('❌ Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setIsUploading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${API_URL}/hotels/${hotelId}/logo`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to remove logo');
      }

      setPreview(null);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast({
        title: "Success",
        description: "Logo removed successfully",
      });

      onSuccess();

    } catch (error: any) {
      console.error('❌ Remove error:', error);
      toast({
        title: "Remove Failed",
        description: error.message || "Failed to remove logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setPreview(currentLogo || null);
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Hotel Logo
        </CardTitle>
        <CardDescription>
          Upload your hotel's logo to replace the default HMS logo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Logo Preview */}
        {preview && (
          <div className="space-y-4">
            <Label>Current Logo Preview</Label>
            <div className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-48 h-48 flex items-center justify-center border rounded-lg overflow-hidden">
                  <img
                    src={preview}
                    alt="Hotel Logo"
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      console.error('Logo load error');
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Hotel Logo Preview</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This logo will appear in the sidebar and app header
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="space-y-4">
          <Label htmlFor="logo-upload">
            Upload New Logo
            <span className="text-xs text-muted-foreground ml-2">
              (PNG, JPG, WebP up to {maxSizeMB}MB)
            </span>
          </Label>
          
          <div className="flex items-center gap-4">
            <Input
              id="logo-upload"
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              onChange={handleFileChange}
              disabled={isUploading || disabled}
              className="cursor-pointer"
            />
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || disabled}
            >
              <Upload className="h-4 w-4 mr-2" />
              Browse
            </Button>
          </div>

          {/* File Info */}
          {file && (
            <div className="p-3 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setPreview(currentLogo || null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4">
          {file && (
            <>
              <Button
                onClick={handleUpload}
                disabled={isUploading || disabled}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Logo
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isUploading}
              >
                Cancel
              </Button>
            </>
          )}
          
          {preview && !file && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleRemove}
              disabled={isUploading || disabled}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Remove Logo
                </>
              )}
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="p-4 border rounded-lg bg-blue-50">
          <h4 className="font-semibold text-blue-800 mb-2">Logo Guidelines</h4>
          <ul className="space-y-1 text-sm text-blue-700">
            <li>• Logo will replace the default HMS logo in the sidebar</li>
            <li>• Recommended size: 200x200 pixels (square)</li>
            <li>• Transparent background (PNG) recommended</li>
            <li>• Maximum file size: {maxSizeMB}MB</li>
            <li>• Supported formats: PNG, JPG, WebP</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default LogoUpload;