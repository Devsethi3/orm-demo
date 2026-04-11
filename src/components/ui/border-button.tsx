import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

const BlueprintCorners = () => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
    <div className="absolute -left-[7px] -top-[7px] h-[10px] w-[10px] border-l-2 border-t-2 border-white/70" />
    <div className="absolute -right-[7px] -top-[7px] h-[10px] w-[10px] border-r-2 border-t-2 border-white/70" />
    <div className="absolute -bottom-[7px] -left-[7px] h-[10px] w-[10px] border-b-2 border-l-2 border-white/70" />
    <div className="absolute -bottom-[7px] -right-[7px] h-[10px] w-[10px] border-b-2 border-r-2 border-white/70" />
  </div>
);

export const BorderButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div className="relative inline-block">
      <BlueprintCorners />
      <button
        ref={ref}
        className={cn(
          "relative z-10",
          "inline-flex w-full justify-center items-center gap-3 font-mono",
          "bg-[#181818] border border-[#444444]",
          "bg-[repeating-linear-gradient(-45deg,#232323,#232323_1.5px,transparent_1.5px,transparent_9px)]",
          "px-6 py-2.5 text-[#d1d1d1] text-sm font-chivo-mono uppercase",
          "transition-all duration-300 ease-in-out hover:brightness-125 active:scale-[0.98]",
          className,
        )}
        {...props}
      >
        <span>{children}</span>
        <ArrowUpRight className="size-4" />
      </button>
    </div>
  );
});

BorderButton.displayName = "BorderButton";
