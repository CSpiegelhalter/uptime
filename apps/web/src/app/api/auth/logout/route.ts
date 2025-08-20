import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const res = NextResponse.redirect(new URL("/", req.url));
    // clear HttpOnly token cookie
    res.cookies.set("token", "", { httpOnly: true, path: "/", maxAge: 0, sameSite: "lax" });
    return res;
  }