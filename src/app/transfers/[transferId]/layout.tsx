import type { Metadata } from "next";
import { getPrivateRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = getPrivateRouteMetadata("/transfers/[transferId]");

export default function TransferDetailLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
