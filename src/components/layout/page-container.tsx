import React from 'react';
import { cn } from "@/lib/utils";

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxWidth?: 'none' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'container';
  centered?: boolean;
}

export function PageContainer({
  children,
  className,
  maxWidth = 'none',
  centered = false,
  ...props
}: PageContainerProps) {
  const maxWidthClasses = {
    'none': 'w-full',
    '3xl': 'max-w-3xl mx-auto',
    '4xl': 'max-w-4xl mx-auto',
    '5xl': 'max-w-5xl mx-auto',
    '6xl': 'max-w-6xl mx-auto',
    '7xl': 'max-w-7xl mx-auto',
    'container': 'container mx-auto',
  };

  return (
    <div
      className={cn(
        "p-4 md:p-8 min-h-screen",
        centered && "flex flex-col items-center justify-center",
        maxWidthClasses[maxWidth],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
