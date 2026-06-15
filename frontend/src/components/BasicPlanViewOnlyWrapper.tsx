import { ReactNode, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { isBasicDatabaseUser, isBasicPlanViewOnlyPath } from '@/lib/planUtils';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const INTERACTIVE_SELECTOR =
  'button:not([data-basic-plan-allow]), [role="button"]:not([data-basic-plan-allow]), input:not([data-basic-plan-allow]), select:not([data-basic-plan-allow]), textarea:not([data-basic-plan-allow])';

interface BasicPlanViewOnlyWrapperProps {
  children: ReactNode;
}

export function BasicPlanViewOnlyWrapper({ children }: BasicPlanViewOnlyWrapperProps) {
  const { pathname } = useLocation();
  const { toast } = useToast();
  const lastToastRef = useRef(0);
  const viewOnly = isBasicDatabaseUser() && isBasicPlanViewOnlyPath(pathname);

  const showUpgradeToast = useCallback(() => {
    const now = Date.now();
    if (now - lastToastRef.current < 2000) return;
    lastToastRef.current = now;
    toast({
      title: 'Pro feature',
      description: 'Upgrade to Pro to use buttons and forms on this page.',
    });
  }, [toast]);

  const blockInteraction = (e: React.SyntheticEvent) => {
    if (!viewOnly) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-basic-plan-allow]')) return;

    const interactive = target.closest(INTERACTIVE_SELECTOR);
    if (!interactive) return;

    e.preventDefault();
    e.stopPropagation();
    showUpgradeToast();
  };

  if (!viewOnly) {
    return <>{children}</>;
  }

  return (
    <div
      className={cn(
        '[&_button:not([data-basic-plan-allow])]:cursor-not-allowed',
        '[&_button:not([data-basic-plan-allow])]:opacity-55',
        '[&_[role=button]:not([data-basic-plan-allow])]:cursor-not-allowed',
        '[&_[role=button]:not([data-basic-plan-allow])]:opacity-55',
        '[&_input:not([data-basic-plan-allow])]:cursor-not-allowed',
        '[&_input:not([data-basic-plan-allow])]:opacity-55',
        '[&_select:not([data-basic-plan-allow])]:cursor-not-allowed',
        '[&_select:not([data-basic-plan-allow])]:opacity-55',
        '[&_textarea:not([data-basic-plan-allow])]:cursor-not-allowed',
        '[&_textarea:not([data-basic-plan-allow])]:opacity-55'
      )}
      onClickCapture={blockInteraction}
      onKeyDownCapture={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          blockInteraction(e);
        }
      }}
    >
      <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        <Lock className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">View-only (Basic plan)</p>
          <p className="text-xs text-amber-800/90 mt-0.5">
            You can browse this page. Upgrade to Pro to add, edit, or delete.
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}

export function useBasicPlanViewOnly(): boolean {
  const { pathname } = useLocation();
  return isBasicDatabaseUser() && isBasicPlanViewOnlyPath(pathname);
}
