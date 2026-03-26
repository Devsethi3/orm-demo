"use client";

import { useState } from "react";
import { useAction } from "@/hooks/use-actions";
import { createInvitation } from "@/server/actions/invitations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle03Icon,
  CopyIcon,
  Loading03Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";

export function InvitationSettings() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const { execute, isPending, error } = useAction(createInvitation);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await execute({ email, role: role as any });
    if (result.success && result.data) {
      const link = `${window.location.origin}/invite/${result.data.token}`;
      setInviteLink(link);
      setEmail("");
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-xl border border-border bg-card p-6"
    >
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
        <HugeiconsIcon icon={UserAdd01Icon} className="h-4 w-4" />
        Invite Users
      </h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Label className="text-xs">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@company.com"
              required
            />
          </div>
          <div>
            <Label className="text-xs">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="submit" size="sm" disabled={isPending}>
          {isPending && (
            <HugeiconsIcon
              icon={Loading03Icon}
              className="mr-1 h-3 w-3 animate-spin"
            />
          )}
          Send Invitation
        </Button>
      </form>

      {inviteLink && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 rounded-lg bg-muted/50 p-3"
        >
          <p className="text-xs text-muted-foreground mb-2">
            Invitation link (share with user):
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-background rounded p-2 truncate">
              {inviteLink}
            </code>
            <Button size="sm" variant="outline" onClick={copyLink}>
              {copied ? (
                <HugeiconsIcon
                  icon={CheckmarkCircle03Icon}
                  className="h-3 w-3 text-green-500"
                />
              ) : (
                <HugeiconsIcon icon={CopyIcon} className="h-3 w-3" />
              )}
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
