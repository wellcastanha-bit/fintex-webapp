import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",               // home
  "/auth-required",  // sua página de aviso
  "/login",          // se existir
];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;

  // assets e rotas internas
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/imagens") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/api") // ✅ não trava suas APIs
  ) return true;

  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ sempre deixa passar o que é público/interno
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  /**
   * ✅ MODO ATUAL (SEM LOGIN):
   * Se FINtex quiser tudo liberado por enquanto, deixa passar.
   * Pra ligar proteção depois, defina NEXT_PUBLIC_AUTH_MODE="on"
   */
  const mode = process.env.NEXT_PUBLIC_AUTH_MODE || "off";
  if (mode !== "on") {
    return NextResponse.next();
  }

  /**
   * 🔒 MODO FUTURO (COM LOGIN):
   * Aqui você checa se existe cookie de sessão e bloqueia se não tiver.
   *
   * Obs: sem depender de lib, fazemos uma checagem simples:
   * - se não tiver nenhum cookie do supabase, manda pro auth-required
   * Isso não valida token profundamente, mas funciona como “gate” inicial.
   */
  const cookie = req.headers.get("cookie") || "";
  const hasSbCookie =
    cookie.includes("sb-") && (cookie.includes("auth-token") || cookie.includes("refresh-token"));

  if (!hasSbCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth-required";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // roda só em rotas "de página", ignora estáticos e arquivos do public
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|site.webmanifest|imagens/|icons/|api/).*)",
  ],
};
