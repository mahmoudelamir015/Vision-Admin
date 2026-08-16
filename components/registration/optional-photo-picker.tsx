"use client";

import { useRef } from "react";
import { motion } from "motion/react";
import { Camera, Upload, X } from "lucide-react";

type OptionalPhotoPickerProps = {
  label: string;
  description: string;
  fileName: string | null;
  previewUrl: string | null;
  onChange: (fileName: string | null, previewUrl: string | null) => void;
};

export function OptionalPhotoPicker({ label, description, fileName, previewUrl, onChange }: OptionalPhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const openPicker = () => {
    inputRef.current?.click();
  };

  const clearSelection = () => {
    onChange(null, null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      onChange(null, null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      onChange(null, null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("حجم الصورة يجب ألا يتجاوز 5 ميجابايت");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onChange(file.name, typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-slate-700">{label}</label>
      <p className="text-xs font-medium text-slate-500">{description}</p>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <motion.button
        type="button"
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.99 }}
        onClick={openPicker}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-right text-sm font-bold text-slate-700 transition-colors hover:border-[#D4AF37] hover:bg-[#FFFCF7]"
      >
        <span className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-[#D4AF37]" />
          {fileName ?? "اختر صورة اختيارية"}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.25em] text-slate-500">Optional</span>
      </motion.button>

      {previewUrl ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
              <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <Camera className="h-4 w-4 text-[#D4AF37]" />
                معاينة الصورة
              </div>
              <p className="mt-1 truncate text-xs font-medium text-slate-500">{fileName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearSelection}
            className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-100"
          >
            <X className="h-3.5 w-3.5" />
            إلغاء الصورة
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500">
          يمكنك إكمال التسجيل بدون صورة، وسيظل الحقل اختياريًا بالكامل.
        </div>
      )}
    </div>
  );
}
