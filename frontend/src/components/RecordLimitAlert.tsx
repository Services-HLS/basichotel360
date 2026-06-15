// components/RecordLimitAlert.tsx
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface RecordLimitAlertProps {
  currentCount: number;
  isLimitReached: boolean;
  message: string;
}

export const RecordLimitAlert = ({ currentCount, isLimitReached, message }: RecordLimitAlertProps) => {
  if (currentCount < 4500) return null; // Only show when close to limit

  return (
    <Alert className={isLimitReached ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}>
      <AlertDescription className="flex justify-between items-center">
        <span>{message}</span>
        {isLimitReached && (
          <Button 
            size="sm" 
            onClick={() => window.location.href = '/upgrade'}
            className="ml-2"
          >
            Upgrade Now
          </Button>
        )}
      </AlertDescription>
      
      {/* Progress Bar */}
      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${
            isLimitReached ? 'bg-red-600' : 'bg-yellow-500'
          }`}
          style={{ width: `${Math.min((currentCount / 5000) * 100, 100)}%` }}
        />
      </div>
    </Alert>
  );
};