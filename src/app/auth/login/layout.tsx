import type { Metadata } from "next";
import { buildRouteMetadata, PUBLIC_METADATA } from "@/lib/seo";

export const metadata: Metadata = buildRouteMetadata(PUBLIC_METADATA["/auth/login"]);

export default function LoginLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
