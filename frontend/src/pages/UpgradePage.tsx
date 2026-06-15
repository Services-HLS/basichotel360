



import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UpgradePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-100">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* FREE PLAN */}
        <Card className="border border-gray-300">
          <CardHeader>
            <div className="flex justify-between">
              <CardTitle className="text-xl font-bold">Free Plan</CardTitle>
              <span className="text-sm bg-gray-200 px-3 py-1 rounded-full">₹0/month</span>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2 items-center">
                <Check className="w-4 h-4 text-green-500" /> View Bookings
              </li>
              <li className="flex gap-2 items-center">
                <Check className="w-4 h-4 text-green-500" /> View Blocks
              </li>
              <li className="flex gap-2 items-center">
                <Check className="w-4 h-4 text-green-500" /> Basic Calendar
              </li>
              <li className="flex gap-2 items-center">
                <Check className="w-4 h-4 text-green-500" /> Up to 10 rooms
              </li>

              {/* Disabled Features */}
              <li className="flex gap-2 items-center text-red-500">
                <X className="w-4 h-4" /> No maintenance mode
              </li>
              <li className="flex gap-2 items-center text-red-500">
                <X className="w-4 h-4" /> No booking actions
              </li>
              <li className="flex gap-2 items-center text-red-500">
                <X className="w-4 h-4" /> No reports
              </li>
            </ul>

            <Button
              variant="outline"
              className="w-full cursor-not-allowed opacity-70"
            >
              Your Current Plan
            </Button>
          </CardContent>
        </Card>

        {/* PRO PLAN */}
        <Card className="border-primary shadow-md">
          <CardHeader>
            <div className="flex justify-between">
              <CardTitle className="text-xl font-bold text-primary">Pro Plan</CardTitle>
              <span className="text-sm bg-primary text-white px-3 py-1 rounded-full">
                from ₹499/month
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2 items-center">
                <Check className="w-4 h-4 text-green-500" /> All Free features
              </li>
              <li className="flex gap-2 items-center">
                <Check className="w-4 h-4 text-green-500" /> Maintenance Mode
              </li>
              <li className="flex gap-2 items-center">
                <Check className="w-4 h-4 text-green-500" /> Full Booking Actions
              </li>
              <li className="flex gap-2 items-center">
                <Check className="w-4 h-4 text-green-500" /> Advanced Reports
              </li>
              <li className="flex gap-2 items-center">
                <Check className="w-4 h-4 text-green-500" /> Export Data
              </li>
              <li className="flex gap-2 items-center">
                <Check className="w-4 h-4 text-green-500" /> Unlimited rooms
              </li>
            </ul>

            <p className="text-xs text-muted-foreground text-center">
              ₹499 / month · ₹4,788 / year (save vs monthly)
            </p>
            <Button
              className="w-full"
              onClick={() => navigate("/upgrade")}
            >
              Buy Pro Plan
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Back Button */}
      <Button
        variant="outline"
        className="absolute top-6 left-6"
        onClick={() => navigate(-1)}
      >
        ← Back
      </Button>
    </div>
  );
}
