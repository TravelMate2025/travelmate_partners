import type { Metadata } from "next";
import { getPrivateRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = getPrivateRouteMetadata("/reports");

export default function ReportsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
