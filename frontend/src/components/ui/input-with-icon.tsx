// components/ui/input-with-icon.tsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface InputWithIconProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const InputWithIcon = React.forwardRef<HTMLInputElement, InputWithIconProps>(
  ({ className, icon, iconPosition = 'left', ...props }, ref) => {
    return (
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            {icon}
          </div>
        )}
        <Input
          className={cn(
            iconPosition === 'left' ? 'pl-10' : 'pr-10',
            className
          )}
          ref={ref}
          {...props}
        />
        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {icon}
          </div>
        )}
      </div>
    );
  }
);

InputWithIcon.displayName = 'InputWithIcon';

export { InputWithIcon };