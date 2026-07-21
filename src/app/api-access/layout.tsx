import type { Metadata } from "next";
import { getPrivateRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = getPrivateRouteMetadata("/api-access");

export default function ApiAccessLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
