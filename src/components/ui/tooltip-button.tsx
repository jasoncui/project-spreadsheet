
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TooltipButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tooltip: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'muted';
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

export const TooltipButton = ({
  tooltip,
  children,
  className,
  variant = 'muted',
  side = 'bottom',
  align = 'center',
  ...props
}: TooltipButtonProps) => {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            className={cn('toolbar-button', 
              variant === 'muted' && 'toolbar-button-muted',
              className
            )}
            {...props}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent 
          side={side}
          align={align}
          className="text-xs font-medium bg-popover text-popover-foreground shadow-md animate-fade-in"
        >
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
