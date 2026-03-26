"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon } from "@hugeicons/core-free-icons";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Error Boundary]:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <HugeiconsIcon
              icon={Alert01Icon}
              className="h-8 w-8 text-destructive"
            />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mt-1">
            An unexpected error occurred. Please try again.
          </p>
        </div>
        <Button onClick={reset}>Try Again</Button>
      </div>
    </div>
  );
}
