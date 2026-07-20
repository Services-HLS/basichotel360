import { UPI_PAYMENT_APPS, UpiPaymentAppId } from '@/lib/upiPaymentApps';
import { cn } from '@/lib/utils';

type UpiAppSelectorProps = {
  value: UpiPaymentAppId | '';
  onChange: (id: UpiPaymentAppId) => void;
  className?: string;
  required?: boolean;
};

export function UpiAppSelector({
  value,
  onChange,
  className,
  required = true,
}: UpiAppSelectorProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs font-semibold text-foreground">
        Which UPI app did the guest use?
        {required && <span className="text-red-500"> *</span>}
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {UPI_PAYMENT_APPS.map((app) => {
          const selected = value === app.id;
          return (
            <button
              key={app.id}
              type="button"
              onClick={() => onChange(app.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-1.5 rounded-lg border bg-white p-2 min-h-[72px] transition-all',
                selected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/30 shadow-sm'
                  : 'border-border hover:border-primary/40 hover:bg-muted/30'
              )}
              title={app.label}
            >
              <img
                src={app.image}
                alt={app.label}
                className="h-8 w-8 object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/payments/other.svg';
                }}
              />
              <span className="text-[10px] font-medium leading-tight text-center line-clamp-2">
                {app.label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground">
        To use your own logos, replace files in{' '}
        <code className="text-[10px]">frontend/public/payments/</code> (same names).
      </p>
    </div>
  );
}
