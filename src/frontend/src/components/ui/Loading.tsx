import { Loader } from 'lucide-react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export function Loading({ size = 'md', message }: LoadingProps) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8" role="status">
      <Loader className={`animate-spin text-cyan-500 ${sizes[size]}`} aria-hidden="true" />
      {message && <p className="text-sm text-slate-400">{message}</p>}
      <span className="sr-only">{message || 'Carregando...'}</span>
    </div>
  );
}
