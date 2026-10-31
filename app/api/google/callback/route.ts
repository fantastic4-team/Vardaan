import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { linkGoogle, redirectUri } from "@/lib/google";

// GET /api/google/callback: Google sends the user back here after they allow (or deny) access.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const back = (result: string) => {
    const res = NextResponse.redirect(`${url.origin}/app?google=${encodeURIComponent(result)}`);
    res.cookies.delete({ name: "vardaan_google_state", path: "/api/google" });
    return res;
  };

  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(`${url.origin}/login`);
  if (url.searchParams.get("error")) return back("denied");

  const expected = (await cookies()).get("vardaan_google_state")?.value ?? "";
  const state = url.searchParams.get("state") ?? "";
  const code = url.searchParams.get("code") ?? "";
  if (!code || !expected || expected.length !== state.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(state))) return back("expired");

  try {
    await linkGoogle(user.id, code, redirectUri(url.origin));
    return back("connected");
  } catch (err) {
    console.error("Google connect failed:", err);
    return back("failed");
  }
}
