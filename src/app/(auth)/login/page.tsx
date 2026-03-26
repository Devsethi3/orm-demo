import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./login-form";

// This page uses cookies() via getSession, making it dynamic
// Tell Next.js it cannot be prerendered statically
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  try {
    const session = await getSession();

    if (session) {
      redirect("/dashboard");
    }
  } catch (error) {
    console.error("Error checking session on login page:", error);
    // Continue to show login page even if session check fails
  }

  return <LoginForm />;
}
