import type { Metadata } from "next";
import { getPrivateRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = getPrivateRouteMetadata("/transfers");

export default function TransfersLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
