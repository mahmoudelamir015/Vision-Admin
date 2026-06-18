"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { Activity, CircleDashed, Download, QrCode, Clock } from "lucide-react";
import QRCode from "react-qr-code";
import { useAuth } from "@/components/admin/AuthContext";
import EmptyState from "@/components/admin/EmptyState";

const CHECKIN_VALUE = "VISION_CENTER_CHECKIN_CODE";

export default function AttendancePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "master_admin";
  const [activeTab, setActiveTab] = useState<"LIVE" | "BARCODE">("LIVE");
  const barcodeRef = useRef<HTMLDivElement | null>(null);

  const downloadBarcode = async () => {
    const svg = barcodeRef.current?.querySelector("svg");
    if (!svg) return;

    const serialized = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width || 512;
      canvas.height = image.height || 512;

      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(url);
        return;
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
      URL.revokeObjectURL(url);

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "vision-center-checkin.png";
      link.click();
    };

    image.src = url;
  };

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A2540] text-[#D4AF37]">
            <Activity className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#0A2540] dark:text-white">
              ط§ظ„ط­ط¶ظˆط± ط§ظ„ط°ظƒظٹ
            </h1>
            <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
              ط¨ط§ط±ظƒظˆط¯ ط«ط§ط¨طھ ظ„ظ„ط·ط¨ط§ط¹ط© + ط´ط§ط´ط© ط¨ط« ظ…ط¨ط§ط´ط± ط¬ط§ظ‡ط²ط© ظ„ظ„ط±ط¨ط·.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-black/20">
          <button
            type="button"
            onClick={() => setActiveTab("LIVE")}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
              activeTab === "LIVE"
                ? "bg-white text-[#0A2540] shadow-sm dark:bg-[#D4AF37] dark:text-[#0A2540]"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-300"
            }`}
          >
            ط§ظ„ط¨ط« ط§ظ„ظ…ط¨ط§ط´ط±
          </button>
          {isAdmin ? (
            <button
              type="button"
              onClick={() => setActiveTab("BARCODE")}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                activeTab === "BARCODE"
                  ? "bg-white text-[#0A2540] shadow-sm dark:bg-[#D4AF37] dark:text-[#0A2540]"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-300"
              }`}
            >
              ط§ظ„ط¨ط§ط±ظƒظˆط¯ ط§ظ„ط«ط§ط¨طھ
            </button>
          ) : null}
        </div>
      </motion.div>

      {activeTab === "LIVE" ? (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40"
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-[#0A2540] dark:text-white">ط´ط§ط´ط© ط§ظ„ط¨ط« ط§ظ„ظ…ط¨ط§ط´ط±</h2>
              <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
                ظ‡طھط¸ظ‡ط± ظ‡ظ†ط§ طھط³ط¬ظٹظ„ط§طھ ط§ظ„ط­ط¶ظˆط± ط§ظ„ظپط¹ظ„ظٹط© ط£ظˆظ„ ظ…ط§ ط§ظ„ظ€ backend ظٹط¨ظ‚ظ‰ ظ…طھطµظ„.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500 dark:bg-white/5 dark:text-slate-300">
              LIVE FEED
            </span>
          </div>

          <EmptyState
            icon={CircleDashed}
            title="ظ„ط§ طھظˆط¬ط¯ طھط³ط¬ظٹظ„ط§طھ ط­ط¶ظˆط± ط­ط§ظ„ظٹط§ظ‹"
            description="ظ…ظپظٹط´ ط¨ظٹط§ظ†ط§طھ ط­ظ‚ظٹظ‚ظٹط© ظ„ط³ظ‡. ط§ظ„ط´ط§ط´ط© ط¬ط§ظ‡ط²ط© ظ„ط§ط³طھظ‚ط¨ط§ظ„ ط£ظٹ ط·ط§ظ„ط¨ ظٹط³ط¬ظ„ ط¨ط§ظ„ظ…ظˆط¨ط§ظٹظ„ ط¨ط¯ظˆظ† ط£ظٹ ط¨ظٹط§ظ†ط§طھ ظˆظ‡ظ…ظٹط©."
          />
        </motion.section>
      ) : (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40"
        >
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#0A2540]/5 px-3 py-1 text-xs font-black uppercase tracking-[0.25em] text-[#0A2540] dark:bg-white/5 dark:text-[#D4AF37]">
                <QrCode className="h-4 w-4" />
                ط«ط§ط¨طھ ظ„ظ„ط·ط¨ط§ط¹ط©
              </div>
              <h2 className="text-2xl font-extrabold text-[#0A2540] dark:text-white">
                ط¨ط§ط±ظƒظˆط¯ ط§ظ„ط­ط¶ظˆط± ط§ظ„ط«ط§ط¨طھ
              </h2>
              <p className="max-w-xl text-sm font-bold leading-7 text-slate-500 dark:text-slate-400">
                ط§ط³طھط®ط¯ظ… ط§ظ„ط¨ط§ط±ظƒظˆط¯ ظ†ظپط³ظ‡ ط¹ظ„ظ‰ ظ…ط¯ط®ظ„ ط§ظ„ط³ظ†طھط± ط£ظˆ ط¹ظ„ظ‰ ظ„ظˆط­ط© ط§ظ„ط­ط¶ظˆط±. ط¨ط¹ط¯ ط§ظ„ط±ط¨ط·
                ط§ظ„ط­ظ‚ظٹظ‚ظٹطŒ ظ†ظپط³ ط§ظ„ظƒظˆط¯ ط¯ظ‡ ظ‡ظٹظ‚ظˆط¯ طµظپط­ط© ط§ظ„ظ€ self check-in ظ„ظ„ظ…ظˆط¨ط§ظٹظ„.
              </p>

              <div ref={barcodeRef} className="inline-flex rounded-[2rem] border border-slate-200 bg-white p-4 shadow-lg dark:border-white/10 dark:bg-white">
                <div className="rounded-[1.5rem] border-4 border-[#0A2540] bg-white p-4">
                  <QRCode value={CHECKIN_VALUE} size={260} fgColor="#0A2540" />
                </div>
              </div>

              <button
                type="button"
                onClick={downloadBarcode}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0A2540] px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#123B66] dark:bg-[#D4AF37] dark:text-[#0A2540]"
              >
                <Download className="h-4 w-4" />
                طھط­ظ…ظٹظ„ ط§ظ„ط¨ط§ط±ظƒظˆط¯ ظƒطµظˆط±ط©
              </button>
            </div>

            <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#D4AF37]" />
                <h3 className="text-lg font-extrabold text-[#0A2540] dark:text-white">
                  ط³ط¬ظ„ ط§ظ„ط­ط¶ظˆط± ط§ظ„ظ„ط­ط¸ظٹ
                </h3>
              </div>

              <EmptyState
                icon={CircleDashed}
                title="ظ„ط§ طھظˆط¬ط¯ ط­ط±ظƒط© ط­ط¶ظˆط± ط§ظ„ط¢ظ†"
                description="ط¨ط¹ط¯ طھط´ط؛ظٹظ„ ط§ظ„ظ€ mobile check-in ظ…ظ† ط£ظˆظ„ظٹط§ط، ط§ظ„ط£ظ…ظˆط± ط£ظˆ ط§ظ„ط·ظ„ط§ط¨ ظ‡طھط¸ظ‡ط± ط§ظ„ط³ط¬ظ„ط§طھ ظ‡ظ†ط§ ظپظˆط±ط§ظ‹."
              />
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
}

