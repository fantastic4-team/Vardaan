import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Dashboard from "@/components/dashboard/Dashboard";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default async function AppPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <Dashboard user={{ name: user.name, email: user.email }} />;
}
