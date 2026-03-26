import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { FileQuestionMarkIcon } from "@hugeicons/core-free-icons";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <HugeiconsIcon
              icon={FileQuestionMarkIcon}
              className="h-8 w-8 text-muted-foreground"
            />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold">Page Not Found</h2>
          <p className="text-sm text-muted-foreground mt-1">
            The page you're looking for doesn't exist.
          </p>
        </div>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
}
