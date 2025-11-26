export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    "/agent-control/:path*",
    "/billing/:path*",
    "/settings/:path*",
    "/logs/:path*",
    "/analytics/:path*",
  ],
};
