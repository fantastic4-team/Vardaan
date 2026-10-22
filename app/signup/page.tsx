import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthPage from "@/components/AuthPage";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Create your account", robots: { index: false } };

export default async function Signup() {
  if (await getCurrentUser()) redirect("/app");
  return (
    <AuthPage
      mode="signup"
      title="Create your account."
      intro="One account to talk to Vardaan, hand off tasks and keep track of everything it does for you."
    />
  );
}
