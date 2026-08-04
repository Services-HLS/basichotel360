import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ScrollText,
  Info,
  Building2,
  UserCog,
  CreditCard,
  ShieldAlert,
  Scale,
  Ban,
} from 'lucide-react';

const sections = [
  {
    icon: Building2,
    title: '1. Acceptance of Terms',
    points: [
      'By creating an account or using the Hotel Management System, you agree to these Terms & Conditions.',
      'If you do not agree, please do not use the software or related services.',
      'These terms apply to hotel owners, admins, and staff users invited to a hotel account.',
    ],
  },
  {
    icon: UserCog,
    title: '2. Account & Access',
    points: [
      'You are responsible for keeping login credentials secure and for all activity under your account.',
      'Hotel admins must assign staff roles carefully and remove access when staff leave.',
      'Misuse of the system, sharing of logins, or unauthorized access may lead to account suspension.',
      'You must provide accurate hotel and registration details.',
    ],
  },
  {
    icon: CreditCard,
    title: '3. Plans, Trial & Billing',
    points: [
      'Features available depend on your plan (Basic / PRO) and subscription status.',
      'Trial periods, if offered, are limited in duration and may convert to paid access after expiry.',
      'Fees, renewals, and upgrades (if applicable) follow the plan details shown at purchase or upgrade.',
      'Non-payment or plan expiry may restrict access to PRO features.',
    ],
  },
  {
    icon: Scale,
    title: '4. Hotel Operations Responsibility',
    points: [
      'Hotels remain responsible for guest bookings, pricing, taxes, invoices, cancellations, and refunds.',
      'The software is a management tool; final business decisions rest with hotel management.',
      'Refund and cancellation practices should follow the hotel’s Refund Policy and local laws.',
      'Staff must enter booking and guest data accurately.',
    ],
  },
  {
    icon: Ban,
    title: '5. Acceptable Use',
    points: [
      'Do not use the system for illegal activity, fraud, or harmful content.',
      'Do not attempt to hack, reverse engineer, or disrupt the platform.',
      'Do not upload false guest documents or misuse guest personal data.',
      'We may suspend access if terms are violated.',
    ],
  },
  {
    icon: ShieldAlert,
    title: '6. Limitation of Liability',
    points: [
      'The service is provided on an “as available” basis. We aim for reliability but do not guarantee uninterrupted uptime.',
      'Hithlaksh Solutions is not liable for hotel business losses arising from incorrect data entry by staff, guest disputes, or third-party OTA issues.',
      'To the extent permitted by law, liability is limited to fees paid for the service in the relevant period.',
      'Users should keep their own backups of important invoices and records where needed.',
    ],
  },
];

export default function TermsAndConditions() {
  return (
    <Layout>
      <div className="page-shell mx-auto max-w-4xl pb-8 space-y-6">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <ScrollText className="h-7 w-7 text-primary" />
            Terms &amp; Conditions
          </h1>

          <Alert className="border-blue-200 bg-blue-50 text-blue-900">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm sm:text-base">
              Please read these Terms &amp; Conditions carefully before using the Hotel Management System
              provided by Hithlaksh Solutions Private Limited.
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
              For questions, use <strong className="text-foreground">Contact Support</strong> in the sidebar
              or visit the company website linked in the footer.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
