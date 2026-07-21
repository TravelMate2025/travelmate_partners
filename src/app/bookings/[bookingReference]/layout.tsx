import type { Metadata } from "next";
import { getPrivateRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = getPrivateRouteMetadata("/bookings/[bookingReference]");

export default function BookingDetailLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
