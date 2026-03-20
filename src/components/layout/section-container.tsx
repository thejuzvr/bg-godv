import React from 'react';
import { cn } from "@/lib/utils";

interface SectionContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function SectionContainer({
  children,
  className,
  ...props
}: SectionContainerProps) {
  return (
    <div
      className={cn(
        "space-y-4 md:space-y-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
