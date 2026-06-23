






import { useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; 
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  Loader2, 
  Globe, 
  Building2,
  ExternalLink,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import WhatsAppFloatingButton, { WhatsAppIcon, WHATSAPP_URL } from '@/components/WhatsAppFloatingButton';

export default function Contact() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Form Submitted:', formData);
      
      toast({
        title: "Message Sent Successfully",
        description: "Thank you for reaching out. Our representative will contact you shortly.",
        duration: 5000,
      });

      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "We couldn't send your message. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="page-shell mx-auto max-w-7xl pb-8">
        
        {/* Page Header */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">Contact Support</h1>
          
          {/* Highlighted Box */}
          <div className="flex w-full items-center justify-center rounded-lg border border-blue-200 bg-blue-50 p-3 shadow-sm dark:border-blue-800 dark:bg-blue-900/20 md:p-4">
             <div className="flex min-w-0 items-start gap-2 text-blue-800 dark:text-blue-200 sm:items-center">
                <Info className="w-5 h-5 shrink-0 hidden md:block" />
                <p className="font-medium text-sm md:text-base text-center whitespace-normal md:whitespace-nowrap leading-relaxed md:leading-none">
                  We are here to help. Reach out to the Hithlaksh Solutions team for inquiries, technical support, or feedback.
                </p>
             </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Contact Information (Sticky) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-4 lg:sticky lg:top-8 space-y-6"
          >
            <Card className="shadow-md border-border/60">
              <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Contact Details
                </CardTitle>
                <CardDescription>
                  Direct channels to reach our team.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                
                {/* Email */}
                <div className="group flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="mt-1 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm text-foreground">Email Address</h4>
                    <a href="mailto:services@hithlakshsolutions.com" className="text-sm text-muted-foreground hover:text-primary transition-colors block break-all">
                      services@hithlakshsolutions.com
                    </a>
                  </div>
                </div>

                <Separator />

                {/* Website */}
                <div className="group flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="mt-1 p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm text-foreground">Official Website</h4>
                    <a 
                      href="https://hithlakshsolutions.com" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group-hover:underline"
                    >
                      hithlakshsolutions.com
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </div>
                </div>

                <Separator />

                {/* WhatsApp */}
                <div className="group flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="mt-1 p-2 bg-[#25D366]/15 rounded-full text-[#25D366]">
                    <WhatsAppIcon className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm text-foreground">WhatsApp</h4>
                    <a
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-[#128C7E] transition-colors flex items-center gap-1 group-hover:underline"
                    >
                      Chat with us on WhatsApp
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    <p className="text-xs text-muted-foreground">+(91) 77957 91587</p>
                  </div>
                </div>

                <Separator />

                {/* Phone */}
                <div className="group flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="mt-1 p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm text-foreground">Phone Number</h4>
                    <p className="text-sm text-muted-foreground">+(91) 77957 91587</p>
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* Locations Card */}
            <Card className="shadow-md border-border/60">
              <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="w-5 h-5 text-primary" />
                  Our Locations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                
                {/* India Location */}
                <div className="relative pl-4 border-l-2 border-orange-500">
                  <h5 className="font-semibold text-sm mb-1 text-foreground">India Office</h5>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    19-12-1/121, Kesavayanagunta,<br />
                    Tirupati, Andhra Pradesh - 517501
                  </p>
                </div>

                {/* Canada Location */}
                {/* <div className="relative pl-4 border-l-2 border-red-600">
                  <h5 className="font-semibold text-sm mb-1 text-foreground">Canada Office</h5>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    238 Fleetwood Dr Oshawa,<br />
                    L1k3E7, Ontario, Canada
                  </p>
                </div> */}

              </CardContent>
            </Card>

            {/* Support Highlight */}
            <div className="bg-[#25D366]/10 rounded-xl p-4 border border-[#25D366]/20 flex items-start gap-3">
              <div className="p-2 bg-[#25D366] rounded-full text-white shrink-0">
                <WhatsAppIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-[#128C7E] mb-1">Need Quick Help?</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Message us on WhatsApp for fast support on bookings, billing, or technical issues.
                </p>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-medium text-[#128C7E] hover:underline"
                >
                  Open WhatsApp
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Contact Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-8"
          >
            <Card className="shadow-lg border-muted h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-2xl">Send us a Message</CardTitle>
                <CardDescription className="text-base">
                  Please fill out the form below. We aim to respond to all inquiries within 24 hours.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 pb-2">
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Name & Email Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">Full Name <span className="text-red-500">*</span></Label>
                      <Input 
                        id="name" 
                        name="name" 
                        placeholder="e.g. John Doe" 
                        value={formData.name}
                        onChange={handleChange}
                        className="h-10"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email Address <span className="text-red-500">*</span></Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        placeholder="e.g. john@company.com" 
                        value={formData.email}
                        onChange={handleChange}
                        className="h-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm font-medium">Subject <span className="text-red-500">*</span></Label>
                    <Input 
                      id="subject" 
                      name="subject" 
                      placeholder="What is this regarding?" 
                      value={formData.subject}
                      onChange={handleChange}
                      className="h-10"
                      required
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-medium">Message <span className="text-red-500">*</span></Label>
                    <Textarea 
                      id="message" 
                      name="message" 
                      placeholder="Please describe your requirements, issues, or questions in detail..." 
                      className="min-h-[200px] resize-y text-base"
                      value={formData.message}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Submit Area */}
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      disabled={loading} 
                      size="lg"
                      className="w-full md:w-auto min-w-[150px]"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
              
              <CardFooter className="bg-muted/20 border-t pt-4 pb-4">
                <p className="text-xs text-muted-foreground w-full text-center md:text-left flex items-center justify-center md:justify-start gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  <strong>Note:</strong> Our representative will contact you soon after reviewing your message.
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>

      <WhatsAppFloatingButton />
    </Layout>
  );
}