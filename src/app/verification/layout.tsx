import type { Metadata } from "next";
import { getPrivateRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = getPrivateRouteMetadata("/verification");

export default function VerificationLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
