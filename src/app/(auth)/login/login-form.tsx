"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { DecorIcon } from "@/components/ui/decor-icon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Loader2,
  Eye,
  EyeOff,
  AtSignIcon,
  LockKeyholeIcon,
} from "lucide-react";
import Image from "next/image";

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      const result = await login(data);
      if (result.success) {
        toast.success("Login successful");
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.error(result.error || "Login failed");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden px-6 md:px-8">
      <div
        className={cn(
          "relative flex w-full max-w-md flex-col justify-between p-8 md:p-10",
          "dark:bg-[radial-gradient(50%_80%_at_20%_0%,--theme(--color-foreground/.1),transparent)]",
        )}
      >
        <div className="absolute -inset-y-6 -left-px w-px bg-border" />
        <div className="absolute -inset-y-6 -right-px w-px bg-border" />
        <div className="absolute -inset-x-6 -top-px h-px bg-border" />
        <div className="absolute -inset-x-6 -bottom-px h-px bg-border" />
        <DecorIcon position="top-left" />
        <DecorIcon position="bottom-right" />

        <div className="w-full animate-in space-y-8">
          <div className="flex flex-col items-center space-y-2">
            <Image src="/logo.png" width={50} height={50} alt="logo" />
            <h1 className="font-medium text-2xl! tracking-wide">Finance CRM</h1>
            <p className="text-base text-muted-foreground text-center">
              Enter your credentials to access
            </p>
          </div>

          <div className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="space-y-1">
                <InputGroup>
                  <InputGroupInput
                    placeholder="name@example.com"
                    type="email"
                    disabled={loading}
                    {...register("email")}
                  />
                  <InputGroupAddon align="inline-start">
                    <AtSignIcon />
                  </InputGroupAddon>
                </InputGroup>
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <InputGroup>
                  <InputGroupInput
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    disabled={loading}
                    {...register("password")}
                  />
                  <InputGroupAddon align="inline-start">
                    <LockKeyholeIcon />
                  </InputGroupAddon>
                  <InputGroupAddon align="inline-end">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </InputGroupAddon>
                </InputGroup>
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button className="w-full" type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </div>

          <p className="text-muted-foreground text-sm text-center">
            This is an invite-only system. Contact your administrator for
            access.
          </p>
        </div>
      </div>
    </div>
  );
}
