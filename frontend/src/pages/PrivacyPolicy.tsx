import LegalPageShell from '@/components/LegalPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Info,
  Database,
  Eye,
  Lock,
  Share2,
  UserCheck,
  Mail,
} from 'lucide-react';

const sections = [
  {
    icon: Database,
    title: '1. Information We Collect',
    points: [
      'Hotel and account details such as hotel name, admin name, phone number, and email used during registration.',
      'Guest and booking information entered by hotel staff (guest name, phone, ID details, stay dates, room numbers).',
      'Payment and billing records related to bookings, advances, invoices, and refunds.',
      'Technical data such as login activity, device/browser type, and usage logs needed to keep the system secure.',
    ],
  },
  {
    icon: Eye,
    title: '2. How We Use Information',
    points: [
      'To provide hotel management features: bookings, checkout, reports, staff access, and related services.',
      'To send important account notices (login, subscription/trial status, support replies).',
      'To improve product reliability, fix issues, and prevent unauthorized access.',
      'To comply with legal or regulatory requirements when required.',
    ],
  },
  {
    icon: Lock,
    title: '3. Data Storage & Security',
    points: [
      'Hotel data is stored securely and access is limited to authorized users of that hotel account.',
      'Passwords are protected using industry-standard practices and should never be shared.',
      'Hotels are responsible for managing staff logins and keeping credentials confidential.',
      'No system is 100% secure; we take reasonable measures to protect data against unauthorized access.',
    ],
  },
  {
    icon: Share2,
    title: '4. Sharing of Information',
    points: [
      'We do not sell guest or hotel data to third parties.',
      'Data may be shared with trusted service providers only as needed to run the platform (hosting, email, payments).',
      'Information may be disclosed if required by law, court order, or to protect rights and safety.',
      'OTA / channel integrations (if enabled) share only the booking data needed for that channel.',
    ],
  },
  {
    icon: UserCheck,
    title: '5. Your Rights & Hotel Responsibility',
    points: [
      'Hotel admins can update account and hotel settings from the application.',
      'Hotels must collect and use guest data lawfully and with guest consent where required.',
      'Guests should contact the hotel for corrections to their booking or personal details.',
      'You may request account-related support through Contact Support.',
    ],
  },
  {
    icon: Mail,
    title: '6. Contact',
    points: [
      'For privacy questions, use Contact Support in the sidebar.',
      'You may also reach Hithlaksh Solutions Private Limited via the company website linked in the footer.',
      'We will review privacy requests and respond within a reasonable time.',
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <LegalPageShell>
      <div className="page-shell mx-auto max-w-4xl pb-8 space-y-6">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            Privacy Policy
          </h1>

          <Alert className="border-blue-200 bg-blue-50 text-blue-900">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm sm:text-base">
              This Privacy Policy explains how the Hotel Management System collects, uses, and protects
              information for hotels and guests using the platform.
            </AlertDescription>
          </Alert>
        </div>

        <div className="space-y-4">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.title} className="shadow-sm border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 p-2 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-muted-foreground">
                    {section.points.map((point) => (
                      <li key={point} className="leading-relaxed text-foreground/85">
                        {point}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-muted/30">
          <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">Last updated:</strong> July 2026
            </p>
            <p>
              This policy may be updated from time to time. Continued use of the system means you accept the
              updated policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </LegalPageShell>
  );
}
