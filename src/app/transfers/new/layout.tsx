import type { Metadata } from "next";
import { getPrivateRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = getPrivateRouteMetadata("/transfers/new");

export default function NewTransferLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
