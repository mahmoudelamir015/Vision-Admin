import { NextResponse } from "next/server";
import { getCurrentAdminProfile } from "@/src/lib/auth/session";

export async function GET() {
  const profile = await getCurrentAdminProfile();
  return profile ? NextResponse.json({ profile }) : NextResponse.json({ error: "غير مسجل" }, { status: 401 });
}
