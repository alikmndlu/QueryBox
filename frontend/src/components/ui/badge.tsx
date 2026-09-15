import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-400 select-none',
  {
    variants: {
      variant: {
        default:
          'border-indigo-500/20 bg-indigo-500/10 text-indigo-300',
        secondary:
          'border-[#1e2638] bg-[#161c2b] text-slate-300',
        destructive:
          'border-rose-500/20 bg-rose-500/10 text-rose-300',
        outline:
          'text-slate-400 border-[#1e2638]',
        success:
          'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
        warning:
          'border-amber-500/20 bg-amber-500/10 text-amber-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
