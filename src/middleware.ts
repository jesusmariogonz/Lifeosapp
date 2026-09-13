export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/",
    "/calendar/:path*",
    "/tasks/:path*",
    "/goals/:path*",
    "/habits/:path*",
    "/finance/:path*",
    "/wellness/:path*",
    "/journal/:path*",
    "/weekly-review/:path*",
    "/analytics/:path*",
    "/assistant/:path*",
    "/relationships/:path*",
    "/integrations/:path*",
  ],
};
