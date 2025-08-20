import Link from "next/link";
import { cookies } from "next/headers";

// Best-effort decode of JWT payload to show email/initial (no verification).
function readEmailFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const p = token.split(".")[1] || "";
    const base64 = p.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(base64, "base64").toString("utf8");
    const payload = JSON.parse(json);
    if (typeof payload?.email === "string") return payload.email;
  } catch {}
  return null;
}

export default async function Header() {
  const token = (await cookies()).get("token")?.value ?? null;
  const email = readEmailFromToken(token);
  const initial = email ? email[0]?.toUpperCase() : null;

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-emerald-500 to-sky-500 shadow-sm" />
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Uptime Monitor
          </Link>
          <nav className="ml-6 hidden gap-3 text-sm text-slate-700 sm:flex">
            <Link href="/demo" className="rounded px-2 py-1 hover:bg-slate-100">
              Demo
            </Link>
            {token && (
              <>
                <Link href="/" className="rounded px-2 py-1 hover:bg-slate-100">
                  Dashboard
                </Link>
                <Link href="/monitors/new" className="rounded px-2 py-1 hover:bg-slate-100">
                  New Monitor
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Auth actions */}
        <div className="flex items-center gap-2">
          {!token ? (
            <>
              <Link
                href="/login"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Create account
              </Link>
            </>
          ) : (
            <>
              {/* Tiny identity chip */}
              <div className="hidden items-center gap-2 sm:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {initial ?? "•"}
                </div>
                <span className="max-w-[180px] truncate text-sm text-slate-600">{email}</span>
              </div>
              {/* POST to /api/auth/logout without client JS */}
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Sign out
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
