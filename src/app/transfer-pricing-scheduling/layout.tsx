import type { Metadata } from "next";
import { getPrivateRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = getPrivateRouteMetadata("/transfer-pricing-scheduling");

export default function TransferPricingSchedulingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
