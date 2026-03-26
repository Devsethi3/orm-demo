"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import {
  validateInvitation,
  markInvitationUsed,
} from "@/server/actions/invitations";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from "@hugeicons/react";
import { Dollar01Icon, Loading03Icon } from "@hugeicons/core-free-icons";

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [inviteData, setInviteData] = useState<{
    email: string;
    role: string;
  } | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);

  useEffect(() => {
    async function validate() {
      const result = await validateInvitation(token);
      if (result.success && result.data) {
        setInviteData(result.data);
      } else {
        setError(result.error || "Invalid invitation");
      }
      setValidating(false);
    }
    validate();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData) return;

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // 1. Create account via Better Auth
      const result = await signUp.email({
        email: inviteData.email,
        password,
        name,
      });

      if (result.error) {
        setError(result.error.message || "Registration failed");
        setLoading(false);
        return;
      }

      // 2. Update user role and mark invitation used
      await fetch("/api/auth/complete-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email: inviteData.email,
          role: inviteData.role,
        }),
      });

      // 3. Redirect to dashboard
      router.push("/");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <HugeiconsIcon
          icon={Loading03Icon}
          className="h-6 w-6 animate-spin text-muted-foreground"
        />
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <h1 className="text-xl font-bold mb-2">Invalid Invitation</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button className="mt-4" onClick={() => router.push("/login")}>
            Go to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <HugeiconsIcon
              icon={Dollar01Icon}
              className="h-6 w-6 text-primary-foreground"
            />
          </div>
          <h1 className="text-xl font-bold">Join Ocean Labs</h1>
          <p className="text-sm text-muted-foreground">
            You&apos;ve been invited as{" "}
            <span className="font-medium text-primary capitalize">
              {inviteData.role}
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={inviteData.email} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="John Doe"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Minimum 8 characters"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && (
              <HugeiconsIcon
                icon={Loading03Icon}
                className="mr-2 h-4 w-4 animate-spin"
              />
            )}
            Create Account
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
