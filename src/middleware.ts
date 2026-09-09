import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { USER_ROLES } from "@/types";

interface RoleRouteMapping {
  prefix: string;
  allowedRole: string;
}

const PROTECTED_ROUTES: RoleRouteMapping[] = [
  { prefix: "/farmer", allowedRole: USER_ROLES.FARMER },
  { prefix: "/fpo", allowedRole: USER_ROLES.FPO },
  { prefix: "/consumer", allowedRole: USER_ROLES.CONSUMER },
  { prefix: "/buyer", allowedRole: USER_ROLES.BULK_BUYER },
  { prefix: "/admin", allowedRole: USER_ROLES.ADMIN },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Find if current path is a protected role path
  const matchingRoute = PROTECTED_ROUTES.find((route) =>
    pathname.startsWith(route.prefix)
  );

  if (!matchingRoute) {
    return NextResponse.next();
  }

  // Retrieve token using NextAuth JWT
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  // 1. If not authenticated, redirect to login with callback URL
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If authenticated but wrong role, redirect to unauthorized error page
  if (token.role !== matchingRoute.allowedRole) {
    const unauthorizedUrl = new URL("/unauthorized", req.url);
    unauthorizedUrl.searchParams.set("required", matchingRoute.allowedRole);
    unauthorizedUrl.searchParams.set("actual", String(token.role));
    return NextResponse.redirect(unauthorizedUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/farmer/:path*",
    "/fpo/:path*",
    "/consumer/:path*",
    "/buyer/:path*",
    "/admin/:path*",
  ],
};
