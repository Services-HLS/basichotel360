// components/PermissionButton.tsx
import { Button, ButtonProps } from '@/components/ui/button';
import { hasPermission } from '@/lib/permissions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock } from 'lucide-react';

interface PermissionButtonProps extends ButtonProps {
  permission?: string;
  tooltipText?: string;
}

const PermissionButton = ({
  permission,
  tooltipText = "You don't have permission to perform this action",
  children,
  disabled,
  onClick,
  ...props
}: PermissionButtonProps) => {
  const hasPerm = !permission || hasPermission(permission as any);
  
  if (!hasPerm) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                {...props}
                disabled={true}
                className="opacity-50 cursor-not-allowed"
              >
                <Lock className="w-4 h-4 mr-2" />
                {children}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      {...props}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
};

export default PermissionButton;