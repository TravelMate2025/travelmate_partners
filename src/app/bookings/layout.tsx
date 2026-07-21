import type { Metadata } from "next";
import { getPrivateRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = getPrivateRouteMetadata("/bookings");

export default function BookingsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
