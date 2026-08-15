import { NextResponse } from "next/server";
import { getCurrentAdminProfile } from "@/src/lib/auth/session";
import { createServiceSupabaseClient } from "@/src/lib/supabase/admin";

const BUCKET = "teacher-materials";

export async function GET() {
  const profile = await getCurrentAdminProfile();
  if (!profile) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("teacher_materials")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ materials: Array.isArray(data) ? data : [] });
}

export async function POST(request: Request) {
  const profile = await getCurrentAdminProfile();
  if (!profile) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "تعذر قراءة البيانات" }, { status: 400 });

  const file = formData.get("file");
  const title = String(formData.get("title") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);

  if (!title) return NextResponse.json({ error: "العنوان مطلوب" }, { status: 400 });

  const supabase = createServiceSupabaseClient();

  let fileUrl: string | null = null;
  let fileName: string | null = null;

  if (file && file instanceof Blob) {
    const ext = (file as File).name?.split(".").pop() ?? "bin";
    const storageKey = `admin/${Date.now()}-${title.replace(/\s+/g, "_").slice(0, 40)}.${ext}`;

    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storageKey, fileBuffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 });

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(storageKey);
    fileUrl = publicData.publicUrl ?? null;
    fileName = (file as File).name ?? null;
  }

  const { data, error } = await supabase
    .from("teacher_materials")
    .insert({
      teacher_id: null, // admin-uploaded
      title,
      subject: subject || null,
      price,
      file_url: fileUrl,
      file_name: fileName,
      is_published: true,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ material: data });
}

export async function DELETE(request: Request) {
  const profile = await getCurrentAdminProfile();
  if (!profile) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "المعرف مطلوب" }, { status: 400 });

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("teacher_materials").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
