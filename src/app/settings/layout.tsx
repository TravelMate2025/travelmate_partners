import type { Metadata } from "next";
import { getPrivateRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = getPrivateRouteMetadata("/settings");

export default function SettingsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
