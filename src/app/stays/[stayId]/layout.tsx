import type { Metadata } from "next";
import { getPrivateRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = getPrivateRouteMetadata("/stays/[stayId]");

export default function StayDetailLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
