import { ReactNode } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layouts/dashboard-shell";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  return <DashboardShell>{children}</DashboardShell>;
}
