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
        if (token.role === "admin" || token.role === "operario" || token.role === "vendedor") {
          return NextResponse.redirect(new URL("/admin", req.url));
        }
        return NextResponse.redirect(new URL("/", req.url));
      }
      return null;
    }

    if (isAdminRoute) {
      if (!isAuth) {
        return NextResponse.redirect(new URL("/login", req.url));
      }

      const pathname = req.nextUrl.pathname;

      if (token.role === "vendedor") {
        const rutasPermitidas = [
          "/admin/pasajes",
          "/admin/encomiendas",
          "/admin/viajes"
        ];
        
        // Permitimos exactamente "/admin" o cualquier ruta que empiece por alguna de las permitidas
        const isAllowed = pathname === "/admin" || rutasPermitidas.some(ruta => pathname.startsWith(ruta));
        
        if (!isAllowed) {
          return NextResponse.redirect(new URL("/admin", req.url));
        }
      } else if (token.role !== "admin" && token.role !== "operario") {
        return NextResponse.redirect(new URL("/", req.url));
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
  matcher: ["/admin/:path*", "/login", "/registro"],
};
