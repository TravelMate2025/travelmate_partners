import type { Metadata } from "next";
import { getPrivateRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = getPrivateRouteMetadata("/dashboard");

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
