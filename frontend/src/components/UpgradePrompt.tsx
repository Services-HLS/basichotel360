import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

interface UpgradePromptProps {
  feature: string;
  children: React.ReactNode;
  requiredPlan?: 'pro';
}

export const UpgradePrompt = ({ feature, children, requiredPlan = 'pro' }: UpgradePromptProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleUpgradeClick = () => {
    toast({
      title: "Pro Feature",
      description: `${feature} is available in the Pro plan. Upgrade to unlock advanced analytics and financial reports.`,
      action: (
        <Button 
          size="sm" 
          onClick={() => navigate('/upgrade')}
        >
          Upgrade Now
        </Button>
      ),
    });
  };

  return (
    <div 
      className="relative cursor-pointer group"
      onClick={handleUpgradeClick}
    >
      <div className="opacity-50 group-hover:opacity-70 transition-opacity pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-lg">
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 gap-1">
          <Lock className="w-3 h-3" />
          PRO
        </Badge>
      </div>
    </div>
  );
};