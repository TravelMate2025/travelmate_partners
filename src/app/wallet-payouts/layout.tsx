import type { Metadata } from "next";
import { getPrivateRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = getPrivateRouteMetadata("/wallet-payouts");

export default function WalletPayoutsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
