import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/registro");
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");

    if (isAuthPage) {
      if (isAuth) {
        if (token.role === "admin" || token.role === "vendedor") {
          return NextResponse.redirect(new URL("/admin", req.url));
        } else if (token.role === "conductor") {
          return NextResponse.redirect(new URL("/staff/conductor", req.url));
        } else if (token.role === "operario") {
          return NextResponse.redirect(new URL("/staff/operario", req.url));
        }
        return NextResponse.redirect(new URL("/", req.url));
      }
      return null;
    }

    const isStaffRoute = req.nextUrl.pathname.startsWith("/staff");

    if (isAdminRoute) {
      if (!isAuth) return NextResponse.redirect(new URL("/login", req.url));
      
      const pathname = req.nextUrl.pathname;
      if (token.role === "vendedor") {
        const rutasPermitidas = [
          "/admin/pasajes",
          "/admin/encomiendas",
          "/admin/viajes"
        ];
        const isAllowed = pathname === "/admin" || rutasPermitidas.some(ruta => pathname.startsWith(ruta));
        if (!isAllowed) {
          return NextResponse.redirect(new URL("/admin", req.url));
        }
      } else if (token.role !== "admin") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    if (isStaffRoute) {
      if (!isAuth || (token.role !== "conductor" && token.role !== "operario")) {
        return NextResponse.redirect(new URL("/login", req.url));
      }

      const pathname = req.nextUrl.pathname;
      if (token.role === "conductor" && !pathname.startsWith("/staff/conductor")) {
        return NextResponse.redirect(new URL("/staff/conductor", req.url));
      }
      if (token.role === "operario" && !pathname.startsWith("/staff/operario")) {
        return NextResponse.redirect(new URL("/staff/operario", req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: () => true, // We handle authorization in the middleware function
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/staff/:path*", "/login", "/registro"],
};
