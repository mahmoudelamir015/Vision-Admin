import { NextResponse } from "next/server";
import { getCurrentAdminProfile } from "@/src/lib/auth/session";
import { createServiceSupabaseClient } from "@/src/lib/supabase/admin";

function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function POST(request: Request) {
  try {
    const profile = await getCurrentAdminProfile();
    if (!profile) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

    const body = (await request.json().catch(() => null)) as {
      shared?: boolean;
      student_phone?: string;
      valid_for_seconds?: number;
    } | null;

    const validSeconds = Math.max(60, Math.min(body?.valid_for_seconds ?? 600, 7200));
    const supabase = createServiceSupabaseClient();

    if (body?.shared !== false) {
      // Generate a 4-digit PIN directly without relying on RPC is_admin_user()
      const pin = generatePin();
      const expiresAt = new Date(Date.now() + validSeconds * 1000).toISOString();

      // Clean old shared tokens first
      await supabase.from("attendance_tokens").delete().eq("shared", true);

      const { error: insertError } = await supabase.from("attendance_tokens").insert({
        shared: true,
        token_hash: await hashToken(pin),
        pin_hash: null,
        expires_at: expiresAt,
        use_count: 0,
      });

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 400 });
      }

      return NextResponse.json({
        token: { token: pin, expires_at: expiresAt },
      });
    }

    return NextResponse.json({ error: "unsupported mode" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "تعذر توليد رمز الحضور" },
      { status: 400 }
    );
  }
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
