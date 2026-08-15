"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { CircleDashed, FileText, ShieldAlert, Upload } from "lucide-react";
import { useAuth } from "@/components/admin/AuthContext";
import EmptyState from "@/components/admin/EmptyState";

export default function ContentPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "master_admin";
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [price, setPrice] = useState("");
  const [materials, setMaterials] = useState<any[]>([]);

  const loadMaterials = async () => {
    try {
      const res = await fetch("/api/admin/content");
      const data = await res.json().catch(() => null);
      if (data?.materials) {
        setMaterials(data.materials);
      }
    } catch {}
  };

  useEffect(() => {
    void loadMaterials();
  }, []);

  const handleUpload = async () => {
    if (!title.trim()) {
      setUploadFeedback({ type: "error", message: "عنوان المحتوى مطلوب" });
      return;
    }
    
    setIsUploading(true);
    setUploadFeedback(null);

    try {
      const formData = new FormData();
      if (selectedFile) formData.append("file", selectedFile);
      formData.append("title", title);
      formData.append("subject", subject);
      formData.append("price", price || "0");

      const res = await fetch("/api/admin/content", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("تعذر الرفع");
      
      setUploadFeedback({ type: "success", message: "تم الرفع وإضافة المحتوى بنجاح." });
      setSelectedFile(null);
      setTitle("");
      setSubject("");
      setPrice("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      void loadMaterials();
    } catch (e) {
      setUploadFeedback({ type: "error", message: "وصلنا خطأ أثناء الرفع، حاول مرة أخرى." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("متأكد إنك عاوز تحذف الملف ده؟")) return;
    try {
      await fetch("/api/admin/content", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      void loadMaterials();
    } catch {}
  };

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-[2rem] border border-dashed border-red-200 bg-red-50 p-8 text-center text-red-600">
        <ShieldAlert className="mb-3 h-14 w-14 opacity-70" />
        <h2 className="text-xl font-extrabold">لا يوجد تصريح لك بالدخول إلى المحتوى</h2>
        <p className="mt-2 max-w-md text-sm font-bold leading-6">هذه الصفحة محمية للمدير فقط.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm border-slate-200 bg-white shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A2540] text-[#D4AF37]">
            <FileText className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#0A2540] text-[#0A2540]">إدارة المحتوى</h1>
            <p className="mt-1 text-sm font-bold text-slate-500 text-slate-500">
              ارفع الملفات والمذكرات مباشرة وستكون متاحة للطلاب والمدرسين.
            </p>
          </div>
        </div>
      </motion.div>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm border-slate-200 bg-white shadow-sm">
          {materials.length === 0 ? (
            <EmptyState
              icon={CircleDashed}
              title="لا توجد ملفات منشورة حالياً"
              description="أي ملف سيُضاف من هنا سيظهر تلقائياً في قائمة المحتوى ويمكن للطلاب الوصول إليه."
            />
          ) : (
            <div className="grid gap-3">
              {materials.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                  <div>
                    <h3 className="font-bold text-[#0A2540]">{m.title}</h3>
                    <p className="text-sm text-slate-500">{m.subject || "بدون مادة"} • {m.price} جنيه</p>
                    {m.file_url && <a href={m.file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">عرض الملف</a>}
                  </div>
                  <button onClick={() => handleDelete(m.id)} className="text-xs font-bold text-red-600 hover:underline">مسح</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm border-slate-200 bg-white shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A2540]/5 text-[#0A2540] bg-slate-50 dark:text-[#D4AF37]">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#0A2540] text-[#0A2540]">رفع ملف جديد</h2>
              <p className="text-sm font-bold text-slate-500 text-slate-500">
                أضف المذكرة وحدد المادة والسعر.
              </p>
            </div>
          </div>

          <div className="mb-4 grid gap-3">
            <input
              type="text"
              placeholder="عنوان المحتوى *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-[#D4AF37]"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="المادة (اختياري)"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-[#D4AF37]"
              />
              <input
                type="number"
                placeholder="السعر (0 للمجاني)"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-center border-slate-200 bg-slate-50">
            <input
              ref={fileInputRef}
              type="file"
              accept="*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setSelectedFile(file);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex min-h-[5rem] w-full items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm font-bold text-slate-500 transition-colors hover:border-slate-300 hover:bg-white bg-slate-50 text-slate-700"
            >
              <div>
                <p className="mb-3">اختر الملف (اختياري)</p>
                {selectedFile ? (
                  <p className="mt-2 text-sm font-bold text-[#0A2540]">الملف: {selectedFile.name}</p>
                ) : null}
              </div>
            </button>
          </div>
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
            className="mt-4 inline-flex w-full items-center justify-center rounded-[1.5rem] bg-[#0A2540] px-4 py-3 text-sm font-bold text-white transition-opacity disabled:opacity-70"
          >
            {isUploading ? "جاري الرفع والإضافة..." : "حفظ ونشر المحتوى"}
          </button>
          
          {uploadFeedback ? (
            <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-bold ${
              uploadFeedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'
            }`}>
              {uploadFeedback.message}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
