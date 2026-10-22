import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthPage from "@/components/AuthPage";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default async function Login() {
  if (await getCurrentUser()) redirect("/app");
  return <AuthPage mode="login" title="Welcome back." intro="Log in to talk to Vardaan and pick up your tasks where you left off." />;
}
