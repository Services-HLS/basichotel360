import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Upload, X, AlertCircle, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';

const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface FormErrors {
    name?: string;
    phone?: string;
    email?: string;
    id_number?: string;
    pincode?: string;
    customer_gst_no?: string;
    other_expenses?: string;
    payment_reference?: string;
    transaction_id?: string;
}

interface AddCustomerDialogProps {
    onCustomerAdded: () => void;
}

// Validation functions
const validateName = (name: string): string | undefined => {
    if (!name.trim()) return 'Name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    if (name.trim().length > 100) return 'Name must be less than 100 characters';
    if (!/^[a-zA-Z\s\.\-]+$/.test(name)) return 'Name can only contain letters, spaces, dots and hyphens';
    return undefined;
};

const validatePhone = (phone: string): string | undefined => {
    if (!phone.trim()) return 'Phone number is required';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) return 'Phone number must be exactly 10 digits';
    if (!/^[6-9]/.test(cleaned)) return 'Phone number must start with 6,7,8, or 9';
    return undefined;
};

const validateEmail = (email: string): string | undefined => {
    if (!email) return undefined; // Email is optional
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address';
    if (email.length > 255) return 'Email must be less than 255 characters';
    return undefined;
};

const validatePincode = (pincode: string): string | undefined => {
    if (!pincode) return undefined; // Optional
    if (!/^\d{6}$/.test(pincode)) return 'Pincode must be exactly 6 digits';
    return undefined;
};

const validateGST = (gst: string): string | undefined => {
    if (!gst) return undefined; // Optional
    // GST format: 2 digits, 5 letters, 4 digits, 1 letter, 1 digit, 1 letter
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/.test(gst.toUpperCase())) {
        return 'Please enter a valid GST number';
    }
    return undefined;
};

const validateExpenses = (expenses: string): string | undefined => {
    if (!expenses) return undefined; // Optional
    const num = parseFloat(expenses);
    if (isNaN(num) || num < 0) return 'Expenses must be a positive number';
    if (num > 999999.99) return 'Expenses cannot exceed ₹9,99,999.99';
    return undefined;
};

const AddCustomerDialog = ({ onCustomerAdded }: AddCustomerDialogProps) => {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [currentStep, setCurrentStep] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    // Check if mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        id_number: '',
        id_type: 'aadhaar',
        address: '',
        city: '',
        state: '',
        pincode: '',
        customer_gst_no: '',
        purpose_of_visit: '',
        other_expenses: '',
        expense_description: '',
        payment_method: 'cash',
        payment_status: 'pending',
        payment_reference: '',
        transaction_id: ''
    });

    const [idImage, setIdImage] = useState<string | null>(null);
    const [idImage2, setIdImage2] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [imageErrors, setImageErrors] = useState<{ id_image?: string; id_image2?: string }>({});

    // Define form steps for mobile view
    const formSteps = [
        { title: 'Personal Info', fields: ['name', 'phone', 'email', 'id_type', 'id_number'] },
        { title: 'Address', fields: ['address', 'city', 'state', 'pincode'] },
        { title: 'Additional', fields: ['customer_gst_no', 'purpose_of_visit', 'other_expenses', 'expense_description'] },
        { title: 'ID Images', fields: ['id_image', 'id_image2'] },
        { title: 'Payment', fields: ['payment_method', 'payment_status', 'payment_reference', 'transaction_id'] }
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Mark field as touched
        if (!touched[name]) {
            setTouched(prev => ({ ...prev, [name]: true }));
        }

        // Clear error for this field
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (!touched[name]) {
            setTouched(prev => ({ ...prev, [name]: true }));
        }
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        validateField(field);
    };

    const validateField = (field: string) => {
        let error: string | undefined;

        switch (field) {
            case 'name':
                error = validateName(formData.name);
                break;
            case 'phone':
                error = validatePhone(formData.phone);
                break;
            case 'email':
                error = validateEmail(formData.email);
                break;
            case 'pincode':
                error = validatePincode(formData.pincode);
                break;
            case 'customer_gst_no':
                error = validateGST(formData.customer_gst_no);
                break;
            case 'other_expenses':
                error = validateExpenses(formData.other_expenses);
                break;
        }

        setErrors(prev => ({ ...prev, [field]: error }));
        return !error;
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        // Required fields
        const nameError = validateName(formData.name);
        if (nameError) newErrors.name = nameError;

        const phoneError = validatePhone(formData.phone);
        if (phoneError) newErrors.phone = phoneError;

        // Optional fields
        if (formData.email) {
            const emailError = validateEmail(formData.email);
            if (emailError) newErrors.email = emailError;
        }

        if (formData.pincode) {
            const pincodeError = validatePincode(formData.pincode);
            if (pincodeError) newErrors.pincode = pincodeError;
        }

        if (formData.customer_gst_no) {
            const gstError = validateGST(formData.customer_gst_no);
            if (gstError) newErrors.customer_gst_no = gstError;
        }

        if (formData.other_expenses) {
            const expensesError = validateExpenses(formData.other_expenses);
            if (expensesError) newErrors.other_expenses = expensesError;
        }

        // Payment reference validation based on payment method
        if (formData.payment_method === 'online' && formData.payment_status === 'completed') {
            if (!formData.payment_reference) {
                newErrors.payment_reference = 'Payment reference is required for online payments';
            }
            if (!formData.transaction_id) {
                newErrors.transaction_id = 'Transaction ID is required for online payments';
            }
        }

        setErrors(newErrors);
        setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

        return Object.keys(newErrors).length === 0;
    };

    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const validateImage = (file: File): string | undefined => {
        if (!file.type.startsWith('image/')) {
            return 'Please upload an image file';
        }
        if (file.size > 5 * 1024 * 1024) {
            return 'Image size should be less than 5MB';
        }
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            return 'Only JPG, JPEG and PNG files are allowed';
        }
        return undefined;
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageType: 'id_image' | 'id_image2') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        const error = validateImage(file);
        if (error) {
            setImageErrors(prev => ({ ...prev, [imageType]: error }));
            toast({
                title: "Error",
                description: error,
                variant: "destructive"
            });
            return;
        }

        try {
            setUploading(true);
            const base64 = await convertToBase64(file);

            if (imageType === 'id_image') {
                setIdImage(base64);
            } else {
                setIdImage2(base64);
            }

            // Clear error for this image
            setImageErrors(prev => ({ ...prev, [imageType]: undefined }));

            toast({
                title: "Success",
                description: "Image uploaded successfully"
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to upload image",
                variant: "destructive"
            });
        } finally {
            setUploading(false);
            // Clear the input
            e.target.value = '';
        }
    };

    const removeImage = (imageType: 'id_image' | 'id_image2') => {
        if (imageType === 'id_image') {
            setIdImage(null);
        } else {
            setIdImage2(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            // Scroll to first error on desktop
            if (!isMobile) {
                const firstError = Object.keys(errors)[0];
                const element = document.getElementById(firstError);
                element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            toast({
                title: "Validation Error",
                description: "Please fix the errors in the form",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('authToken');

            // Prepare data for API
            const customerData = {
                ...formData,
                other_expenses: formData.other_expenses ? parseFloat(formData.other_expenses) : 0,
                id_image: idImage,
                id_image2: idImage2
            };

            const response = await fetch(`${NODE_BACKEND_URL}/customers`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(customerData)
            });

            const result = await response.json();

            if (!response.ok) {
                if (result.error === 'CUSTOMER_EXISTS') {
                    toast({
                        title: "Customer Already Exists",
                        description: (
                            <div className="mt-2 text-sm">
                                <p>A customer with this phone number already exists:</p>
                                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                                    <p><strong>Name:</strong> {result.data.name}</p>
                                    <p><strong>Phone:</strong> {result.data.phone}</p>
                                </div>
                            </div>
                        ),
                        variant: "destructive",
                    });
                    return;
                }
                throw new Error(result.message || 'Failed to create customer');
            }

            toast({
                title: "Success",
                description: "Customer created successfully"
            });

            // Reset form
            setFormData({
                name: '',
                phone: '',
                email: '',
                id_number: '',
                id_type: 'aadhaar',
                address: '',
                city: '',
                state: '',
                pincode: '',
                customer_gst_no: '',
                purpose_of_visit: '',
                other_expenses: '',
                expense_description: '',
                payment_method: 'cash',
                payment_status: 'pending',
                payment_reference: '',
                transaction_id: ''
            });
            setIdImage(null);
            setIdImage2(null);
            setErrors({});
            setTouched({});
            setCurrentStep(0);

            setOpen(false);
            onCustomerAdded();

        } catch (error: any) {
            console.error('Error creating customer:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to create customer",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        // Validate current step fields before proceeding
        const currentFields = formSteps[currentStep].fields;
        let isValid = true;

        currentFields.forEach(field => {
            if (field === 'id_image' || field === 'id_image2') return;
            if (!validateField(field)) {
                isValid = false;
            }
        });

        if (isValid && currentStep < formSteps.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    // Render mobile step indicator
    const renderMobileStepIndicator = () => (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                    Step {currentStep + 1} of {formSteps.length}
                </span>
                <span className="text-sm text-muted-foreground">
                    {formSteps[currentStep].title}
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / formSteps.length) * 100}%` }}
                />
            </div>
        </div>
    );

    // Render desktop accordion
    const renderDesktopForm = () => (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="personal">
                <AccordionTrigger>Personal Information</AccordionTrigger>
                <AccordionContent>{renderPersonalInfo()}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="address">
                <AccordionTrigger>Address Information</AccordionTrigger>
                <AccordionContent>{renderAddressInfo()}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="additional">
                <AccordionTrigger>Additional Information</AccordionTrigger>
                <AccordionContent>{renderAdditionalInfo()}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="images">
                <AccordionTrigger>ID Proof Images</AccordionTrigger>
                <AccordionContent>{renderIDImages()}</AccordionContent>
            </AccordionItem>
            {/* <AccordionItem value="payment">
                <AccordionTrigger>Payment Information</AccordionTrigger>
                <AccordionContent>{renderPaymentInfo()}</AccordionContent>
            </AccordionItem> */}
        </Accordion>
    );

    // Render mobile step form
    const renderMobileForm = () => (
        <div className="space-y-4">
            {renderMobileStepIndicator()}

            {currentStep === 0 && renderPersonalInfo()}
            {currentStep === 1 && renderAddressInfo()}
            {currentStep === 2 && renderAdditionalInfo()}
            {currentStep === 3 && renderIDImages()}
            {/* {currentStep === 4 && renderPaymentInfo()} */}

            <div className="flex justify-between gap-3 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="flex-1"
                >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                </Button>

                {currentStep < formSteps.length - 1 ? (
                    <Button
                        type="button"
                        onClick={nextStep}
                        className="flex-1"
                    >
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                ) : (
                    <Button
                        type="submit"
                        disabled={loading || uploading}
                        className="flex-1"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Creating...
                            </>
                        ) : (
                            'Create Customer'
                        )}
                    </Button>
                )}
            </div>
        </div>
    );

    // Form sections
    const renderPersonalInfo = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-1">
                        Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('name')}
                        placeholder="Enter full name"
                        className={cn(
                            errors.name && touched.name && "border-red-500 focus-visible:ring-red-500"
                        )}
                        aria-invalid={!!errors.name && touched.name}
                    />
                    {errors.name && touched.name && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.name}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-1">
                        Phone <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('phone')}
                        placeholder="Enter 10-digit phone number"
                        maxLength={10}
                        className={cn(
                            errors.phone && touched.phone && "border-red-500 focus-visible:ring-red-500"
                        )}
                        aria-invalid={!!errors.phone && touched.phone}
                    />
                    {errors.phone && touched.phone && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.phone}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('email')}
                        placeholder="Enter email address"
                        className={cn(
                            errors.email && touched.email && "border-red-500 focus-visible:ring-red-500"
                        )}
                        aria-invalid={!!errors.email && touched.email}
                    />
                    {errors.email && touched.email && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.email}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="id_type">ID Type</Label>
                    <Select
                        value={formData.id_type}
                        onValueChange={(value) => handleSelectChange('id_type', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select ID type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
                            <SelectItem value="pan">PAN Card</SelectItem>
                            <SelectItem value="passort">Passport</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="id_number">ID Number</Label>
                    <Input
                        id="id_number"
                        name="id_number"
                        value={formData.id_number}
                        onChange={handleInputChange}
                        placeholder="Enter ID number"
                    />
                </div>
            </div>
        </div>
    );

    const renderAddressInfo = () => (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter full address"
                    rows={3}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Enter city"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="Enter state"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                        id="pincode"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('pincode')}
                        placeholder="Enter 6-digit pincode"
                        maxLength={6}
                        className={cn(
                            errors.pincode && touched.pincode && "border-red-500 focus-visible:ring-red-500"
                        )}
                        aria-invalid={!!errors.pincode && touched.pincode}
                    />
                    {errors.pincode && touched.pincode && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.pincode}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );

    const renderAdditionalInfo = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="customer_gst_no">GST Number</Label>
                    <Input
                        id="customer_gst_no"
                        name="customer_gst_no"
                        value={formData.customer_gst_no}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('customer_gst_no')}
                        placeholder="e.g., 22AAAAA0000A1Z5"
                        className={cn(
                            "uppercase", // Add uppercase as a separate className or merge it
                            errors.customer_gst_no && touched.customer_gst_no && "border-red-500 focus-visible:ring-red-500"
                        )}
                        maxLength={15}
                        aria-invalid={!!errors.customer_gst_no && touched.customer_gst_no}
                    />
                    {errors.customer_gst_no && touched.customer_gst_no && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.customer_gst_no}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="purpose_of_visit">Purpose of Visit</Label>
                    <Input
                        id="purpose_of_visit"
                        name="purpose_of_visit"
                        value={formData.purpose_of_visit}
                        onChange={handleInputChange}
                        placeholder="e.g., Business, Leisure, etc."
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="other_expenses">Other Expenses (₹)</Label>
                    <Input
                        id="other_expenses"
                        name="other_expenses"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.other_expenses}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('other_expenses')}
                        placeholder="Enter amount"
                        className={cn(
                            errors.other_expenses && touched.other_expenses && "border-red-500 focus-visible:ring-red-500"
                        )}
                        aria-invalid={!!errors.other_expenses && touched.other_expenses}
                    />
                    {errors.other_expenses && touched.other_expenses && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.other_expenses}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="expense_description">Expense Description</Label>
                    <Input
                        id="expense_description"
                        name="expense_description"
                        value={formData.expense_description}
                        onChange={handleInputChange}
                        placeholder="Describe the expenses"
                    />
                </div>
            </div>
        </div>
    );

    const renderIDImages = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Front Side of ID</Label>
                    <div className={cn(
                        "border-2 border-dashed rounded-lg p-4 text-center transition-colors",
                        imageErrors.id_image ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-primary"
                    )}>
                        {idImage ? (
                            <div className="space-y-3">
                                <div className="relative">
                                    <img
                                        src={idImage}
                                        alt="ID Front"
                                        className="max-h-40 mx-auto rounded object-contain"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                        onClick={() => removeImage('id_image')}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                                <p className="text-xs text-green-600 flex items-center justify-center gap-1">
                                    <Check className="h-3 w-3" />
                                    Uploaded successfully
                                </p>
                            </div>
                        ) : (
                            <div>
                                <input
                                    type="file"
                                    id="id_image"
                                    accept="image/jpeg,image/png,image/jpg"
                                    className="hidden"
                                    onChange={(e) => handleImageUpload(e, 'id_image')}
                                    disabled={uploading}
                                />
                                <Label
                                    htmlFor="id_image"
                                    className="cursor-pointer flex flex-col items-center gap-2 p-4"
                                >
                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                    <span className="text-sm font-medium">
                                        Click to upload front side
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        JPG, PNG up to 5MB
                                    </span>
                                </Label>
                            </div>
                        )}
                    </div>
                    {imageErrors.id_image && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {imageErrors.id_image}
                        </p>
                    )}
                </div>

                {/* <div className="space-y-2">
                    <Label>Back Side of ID (Optional)</Label>
                    <div className={cn(
                        "border-2 border-dashed rounded-lg p-4 text-center transition-colors",
                        imageErrors.id_image2 ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-primary"
                    )}>
                        {idImage2 ? (
                            <div className="space-y-3">
                                <div className="relative">
                                    <img
                                        src={idImage2}
                                        alt="ID Back"
                                        className="max-h-40 mx-auto rounded object-contain"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                        onClick={() => removeImage('id_image2')}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                                <p className="text-xs text-green-600 flex items-center justify-center gap-1">
                                    <Check className="h-3 w-3" />
                                    Uploaded successfully
                                </p>
                            </div>
                        ) : (
                            <div>
                                <input
                                    type="file"
                                    id="id_image2"
                                    accept="image/jpeg,image/png,image/jpg"
                                    className="hidden"
                                    onChange={(e) => handleImageUpload(e, 'id_image2')}
                                    disabled={uploading}
                                />
                                <Label
                                    htmlFor="id_image2"
                                    className="cursor-pointer flex flex-col items-center gap-2 p-4"
                                >
                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                    <span className="text-sm font-medium">
                                        Click to upload back side
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        JPG, PNG up to 5MB (Optional)
                                    </span>
                                </Label>
                            </div>
                        )}
                    </div>
                    {imageErrors.id_image2 && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {imageErrors.id_image2}
                        </p>
                    )}
                </div> */}
            </div>

            {uploading && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading image...
                </div>
            )}
        </div>
    );

    // const renderPaymentInfo = () => (
    //     <div className="space-y-4">
    //         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    //             <div className="space-y-2">
    //                 <Label htmlFor="payment_method">Payment Method</Label>
    //                 <Select
    //                     value={formData.payment_method}
    //                     onValueChange={(value) => handleSelectChange('payment_method', value)}
    //                 >
    //                     <SelectTrigger>
    //                         <SelectValue />
    //                     </SelectTrigger>
    //                     <SelectContent>
    //                         <SelectItem value="cash">Cash</SelectItem>
    //                         <SelectItem value="online">Online</SelectItem>
    //                     </SelectContent>
    //                 </Select>
    //             </div>

    //             <div className="space-y-2">
    //                 <Label htmlFor="payment_status">Payment Status</Label>
    //                 <Select
    //                     value={formData.payment_status}
    //                     onValueChange={(value) => handleSelectChange('payment_status', value)}
    //                 >
    //                     <SelectTrigger>
    //                         <SelectValue />
    //                     </SelectTrigger>
    //                     <SelectContent>
    //                         <SelectItem value="pending">Pending</SelectItem>
    //                         <SelectItem value="completed">Completed</SelectItem>
    //                         <SelectItem value="failed">Failed</SelectItem>
    //                     </SelectContent>
    //                 </Select>
    //             </div>

    //             <div className="space-y-2">
    //                 <Label htmlFor="payment_reference">Payment Reference</Label>
    //                 <Input
    //                     id="payment_reference"
    //                     name="payment_reference"
    //                     value={formData.payment_reference}
    //                     onChange={handleInputChange}
    //                     onBlur={() => handleBlur('payment_reference')}
    //                     placeholder="Enter payment reference"
    //                     className={cn(
    //                         errors.payment_reference && touched.payment_reference && "border-red-500 focus-visible:ring-red-500"
    //                     )}
    //                     aria-invalid={!!errors.payment_reference && touched.payment_reference}
    //                 />
    //                 {errors.payment_reference && touched.payment_reference && (
    //                     <p className="text-sm text-red-500 flex items-center gap-1">
    //                         <AlertCircle className="h-3 w-3" />
    //                         {errors.payment_reference}
    //                     </p>
    //                 )}
    //             </div>

    //             <div className="space-y-2">
    //                 <Label htmlFor="transaction_id">Transaction ID</Label>
    //                 <Input
    //                     id="transaction_id"
    //                     name="transaction_id"
    //                     value={formData.transaction_id}
    //                     onChange={handleInputChange}
    //                     onBlur={() => handleBlur('transaction_id')}
    //                     placeholder="Enter transaction ID"
    //                     className={cn(
    //                         errors.transaction_id && touched.transaction_id && "border-red-500 focus-visible:ring-red-500"
    //                     )}
    //                     aria-invalid={!!errors.transaction_id && touched.transaction_id}
    //                 />
    //                 {errors.transaction_id && touched.transaction_id && (
    //                     <p className="text-sm text-red-500 flex items-center gap-1">
    //                         <AlertCircle className="h-3 w-3" />
    //                         {errors.transaction_id}
    //                     </p>
    //                 )}
    //             </div>
    //         </div>

    //         {formData.payment_method === 'online' && formData.payment_status === 'completed' && (
    //             <Alert>
    //                 <AlertDescription>
    //                     Please ensure both Payment Reference and Transaction ID are provided for online payments.
    //                 </AlertDescription>
    //             </Alert>
    //         )}
    //     </div>
    // );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="flex items-center gap-2 w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Customer</span>
                    <span className="sm:hidden">Add</span>
                </Button>
            </DialogTrigger>

            <DialogContent className={cn(
                "p-4 sm:p-6",
                isMobile ? "max-w-full h-[100dvh] rounded-none" : "max-w-4xl max-h-[90vh]"
            )}>
                <DialogHeader className={cn(isMobile && "px-2")}>
                    <DialogTitle>Add New Customer</DialogTitle>
                </DialogHeader>

                <ScrollArea className={cn(
                    "pr-4",
                    isMobile ? "h-[calc(100dvh-8rem)]" : "max-h-[calc(90vh-8rem)]"
                )}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {isMobile ? renderMobileForm() : renderDesktopForm()}

                        {/* Desktop form actions */}
                        {!isMobile && (
                            <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-background">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading || uploading}
                                    className="min-w-[120px]"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Customer'
                                    )}
                                </Button>
                            </div>
                        )}
                    </form>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

export default AddCustomerDialog;