import type { Metadata } from "next";
import { getPrivateRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = getPrivateRouteMetadata("/notifications");

export default function NotificationsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
