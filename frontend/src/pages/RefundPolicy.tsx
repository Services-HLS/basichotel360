import LegalPageShell from '@/components/LegalPageShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Info,
  CalendarDays,
  Ban,
  Clock,
  Wallet,
  Building2,
  Bed,
  AlertTriangle,
} from 'lucide-react';

const sections = [
  {
    icon: CalendarDays,
    title: '1. Room Booking Cancellation',
    points: [
      'Cancellation 7 days or more before check-in: Full refund of advance paid (if any).',
      'Cancellation 3–6 days before check-in: 50% refund of advance paid.',
      'Cancellation within 2 days of check-in: No refund of advance paid.',
      'No-show (guest does not arrive): No refund.',
    ],
  },
  {
    icon: Bed,
    title: '2. Early Checkout',
    points: [
      'If a guest checks out earlier than the booked stay, charges may still apply as per hotel rules.',
      'Any unused nights refund (if allowed) is decided by hotel management.',
      'Room tariff already billed may not be refundable after checkout.',
    ],
  },
  {
    icon: Building2,
    title: '3. Function Hall / Event Bookings',
    points: [
      'Cancellation 15 days or more before the event: Full refund of advance paid.',
      'Cancellation 7–14 days before the event: 50% refund of advance paid.',
      'Cancellation within 7 days of the event: No refund.',
      'Date change requests are subject to hall availability and management approval.',
    ],
  },
  {
    icon: Ban,
    title: '4. Non-Refundable Cases',
    points: [
      'Bookings marked as non-refundable at the time of booking.',
      'Cancellations due to guest misconduct or policy violation.',
      'Third-party / OTA bookings follow the channel (MMT, Booking.com, etc.) cancellation rules.',
      'Special packages or promotional rates may have different refund terms.',
    ],
  },
  {
    icon: Wallet,
    title: '5. Refund Method & Timeline',
    points: [
      'Approved refunds are processed by cash, bank transfer, or original payment method.',
      'Online / UPI / card refunds generally take 5–7 working days to reflect.',
      'Cash refunds (if applicable) are settled at the hotel reception.',
      'Refund confirmation may be shared by SMS, WhatsApp, or email.',
    ],
  },
  {
    icon: Clock,
    title: '6. How to Request a Refund',
    points: [
      'Contact hotel reception / admin with booking ID or invoice number.',
      'Share guest name, phone number, and reason for cancellation.',
      'Hotel staff will verify the booking and apply this policy.',
      'Final refund amount is decided by hotel management as per the rules above.',
    ],
  },
];

export default function RefundPolicy() {
  return (
    <LegalPageShell>
      <div className="page-shell mx-auto max-w-4xl pb-8 space-y-6">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            Refund Policy
          </h1>

          <Alert className="border-blue-200 bg-blue-50 text-blue-900">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm sm:text-base">
              This page explains the hotel’s cancellation and refund rules for room and function hall bookings.
              Use it as a reference for staff and guests. Actual refund processing is done from{' '}
              <strong>Cancellations &amp; Refunds</strong>.
            </AlertDescription>
          </Alert>
        </div>

        <Card className="border-amber-200 bg-amber-50/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-900">
              <AlertTriangle className="h-4 w-4" />
              Important
            </CardTitle>
            <CardDescription className="text-amber-800">
              Hotel management reserves the right to adjust refund decisions in special cases
              (medical emergency, natural calamity, government restrictions, etc.).
            </CardDescription>
          </CardHeader>
        </Card>

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
              For support, use <strong className="text-foreground">Contact Support</strong> in the sidebar
              or speak with hotel management.
            </p>
          </CardContent>
        </Card>
      </div>
    </LegalPageShell>
  );
}
