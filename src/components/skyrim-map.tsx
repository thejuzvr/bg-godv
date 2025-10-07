import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

export function SkyrimMap(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 575"
      {...props}
      className={cn("w-full h-auto", props.className)}
    >
      <path
        d="M328 10L126 12C41 12 10 39 10 112v294c0 68 31 93 116 93h134l-31 43h135l36-43h203c73 0 105-33 105-95V224c0-76-43-98-121-98h-39l-22-35-51-12-65 17-66-31-40-55z"
        fill="hsl(var(--card))"
        stroke="hsl(var(--border))"
        strokeWidth="2"
      />
    </svg>
  );
}
