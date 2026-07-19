import { InputHTMLAttributes, forwardRef } from 'react';
import { LucideIcon, AlertCircle } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-300">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <Icon
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500"
              aria-hidden="true"
            />
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full rounded-lg border bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500
              transition-all duration-200 focus:outline-none focus:ring-2
              ${Icon ? 'pl-10' : ''}
              ${
                error
                  ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-700 focus:ring-cyan-500/20 focus:border-cyan-500'
              }
              ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="flex items-center gap-1 text-xs text-red-400">
            <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
