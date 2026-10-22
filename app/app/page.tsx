import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Console from "@/components/console/Console";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Console", robots: { index: false } };

export default async function AppPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <Console user={{ name: user.name, email: user.email }} />;
}
