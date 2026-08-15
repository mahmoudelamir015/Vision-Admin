"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CircleDashed, Layers3, School2, User, Users } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "@/components/admin/AuthContext";
import EmptyState from "@/components/admin/EmptyState";
import { approveAdminPasswordReset } from "@/src/lib/supabase/auth";
import { fetchUsers, subscribeToUsers, type AppUserRecord } from "@/src/lib/supabase/users";

type Audience = "ALL" | "GROUP" | "STUDENT";
type SchoolStage = "primary" | "prep" | "secondary";

const stageOptions: Array<{ value: SchoolStage; label: string }> = [
  { value: "primary", label: "المرحلة الابتدائية" },
  { value: "prep", label: "المرحلة الإعدادية" },
  { value: "secondary", label: "المرحلة الثانوية" },
];

const groupOptionsByStage: Record<SchoolStage, string[]> = {
  primary: [
    "الصف الأول الابتدائي",
    "الصف الثاني الابتدائي",
    "الصف الثالث الابتدائي",
    "الصف الرابع الابتدائي",
    "الصف الخامس الابتدائي",
    "الصف السادس الابتدائي",
  ],
  prep: [
    "الصف الأول الإعدادي",
    "الصف الثاني الإعدادي",
    "الصف الثالث الإعدادي",
  ],
  secondary: [
    "الصف الأول الثانوي",
    "الصف الثاني الثانوي",
    "الصف الثالث الثانوي",
  ],
};

const getPasswordResetMeta = (item: AppUserRecord) => {
  const extra = item.extra as Record<string, unknown> | undefined;
  const passwordReset = extra?.password_reset as Record<string, unknown> | undefined;
  return passwordReset ?? null;
};

const getPasswordResetStatus = (meta: Record<string, unknown> | null) => {
  if (!meta?.status || typeof meta.status !== "string") return "غير مطلوب";
  if (meta.status === "pending") return "معلقة";
  if (meta.status === "approved") {
    const approvedUntil = typeof meta.approved_until === "string" ? new Date(meta.approved_until) : null;
    if (approvedUntil && approvedUntil.getTime() > Date.now()) return "موافق عليها";
    return "منتهية";
  }
  return "غير مطلوب";
};

const formatApprovedUntil = (meta: Record<string, unknown> | null) => {
  if (typeof meta?.approved_until !== "string") return null;
  const date = new Date(meta.approved_until);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("ar-EG");
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "master_admin";
  const [stage, setStage] = useState<SchoolStage>("secondary");
  const [audience, setAudience] = useState<Audience>("ALL");
  const [groupName, setGroupName] = useState(groupOptionsByStage.secondary[0]);
  const [section, setSection] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [resetRequests, setResetRequests] = useState<AppUserRecord[]>([]);
  const [approvalLoading, setApprovalLoading] = useState<string | null>(null);
  const [approvalMessage, setApprovalMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const availableGroups = useMemo(() => groupOptionsByStage[stage], [stage]);

  useEffect(() => {
    let isMounted = true;

    const loadRequests = async () => {
      const users = await fetchUsers();
      const pending = users.filter((item) => {
        const meta = getPasswordResetMeta(item);
        return meta?.status === "pending";
      });
      if (isMounted) {
        setResetRequests(pending);
      }
    };

    void loadRequests();

    const unsubscribe = subscribeToUsers((users) => {
      const pending = users.filter((item) => {
        const meta = getPasswordResetMeta(item);
        return meta?.status === "pending";
      });
      if (isMounted) {
        setResetRequests(pending);
      }
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const approveReset = async (phone: string) => {
    setApprovalLoading(phone);
    setApprovalMessage(null);

    try {
      await approveAdminPasswordReset(phone);
      setApprovalMessage({ type: "success", message: "تمت الموافقة على طلب إعادة كلمة المرور بنجاح." });
    } catch (error) {
      console.error("Failed to approve password reset", error);
      setApprovalMessage({ type: "error", message: "فشل الموافقة على الطلب. حاول مرة أخرى." });
    } finally {
      setApprovalLoading(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-[2rem] border border-dashed border-red-200 bg-red-50 p-8 text-center text-red-600">
        <Bell className="mb-3 h-14 w-14 opacity-70" />
        <h2 className="text-xl font-extrabold">غير مصرح لك بدخول الصفحة دي</h2>
        <p className="mt-2 max-w-md text-sm font-bold leading-6">الصفحة مخصصة للمدير العام فقط.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col gap-6">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm border-slate-200 bg-white shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A2540] text-[#D4AF37]">
            <Bell className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-[#0A2540] text-[#0A2540]">مركز الإشعارات</h1>
            <p className="text-sm font-bold text-slate-500 text-slate-500">
              الصفحة جاهزة لاستقبال نطاق الاستهداف من Supabase بدون أي بيانات وهمية.
            </p>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm border-slate-200 bg-white shadow-sm"
      >
        <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-[#0A2540] text-[#0A2540]">طلبات استرجاع كلمة المرور</h2>
              <p className="mt-1 text-sm font-bold text-slate-500 text-slate-700">
                الطلبات المعلقة بتظهر هنا، وبعد الموافقة يقدر المستخدم يغيّر الباسورد خلال 24 ساعة.
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700 bg-slate-100 dark:text-amber-200">
              {resetRequests.length} طلب
            </span>
          </div>          {approvalMessage ? (
            <div
              className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-bold ${
                approvalMessage.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {approvalMessage.message}
            </div>
          ) : null}
          {resetRequests.length === 0 ? (
            <EmptyState
              icon={CircleDashed}
              title="لا توجد طلبات معلقة"
              description="أي طلب استرجاع جديد هيظهر هنا بمجرد تسجيله من التطبيق."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {resetRequests.map((request) => (
                <div key={request.phone} className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm border-slate-200 bg-white">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-extrabold text-[#0A2540] text-[#0A2540]">{request.name}</h3>
                      <p className="text-sm font-bold text-slate-500 text-slate-500">{request.phone}</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
                      {request.role}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-xs font-bold text-slate-500 text-slate-500">
                      {String(getPasswordResetMeta(request)?.requested_at ?? "")}
                    </div>
                    <button
                      type="button"
                      onClick={() => void approveReset(request.phone)}
                      disabled={approvalLoading === request.phone}
                      className="rounded-xl bg-[#0A2540] px-4 py-2 text-sm font-black text-white disabled:opacity-60"
                    >
                      {approvalLoading === request.phone ? "جاري..." : "موافقة 24 ساعة"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#0A2540] text-[#0A2540]">الفئة المستهدفة</h2>
            <p className="mt-1 text-sm font-bold text-slate-500 text-slate-500">
              اختار جمهور الإشعار قبل ما نربطه بالإرسال الحقيقي.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500 bg-slate-50 text-slate-700">
            NO MOCK DATA
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {[
            { id: "ALL" as const, label: "الجميع", icon: Bell },
            { id: "GROUP" as const, label: "مجموعة صفية", icon: Users },
            { id: "STUDENT" as const, label: "طالب محدد", icon: User },
          ].map((item) => {
            const Icon = item.icon;
            const active = audience === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setAudience(item.id)}
                className={`rounded-2xl border px-4 py-4 text-right transition-all ${
                  active
                    ? "border-[#0A2540] bg-[#0A2540]/5 text-[#0A2540] shadow-sm dark:border-[#D4AF37] dark:bg-[#D4AF37]/10 text-[#0A2540]"
                    : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-white border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-base font-extrabold">{item.label}</span>
                  <Icon className={`h-5 w-5 ${active ? "text-[#D4AF37]" : "text-slate-400"}`} />
                </div>
              </button>
            );
          })}
        </div>

        {audience === "GROUP" ? (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <label className="space-y-2 md:col-span-1">
              <span className="block text-sm font-bold text-slate-700 text-slate-700">اختر المرحلة الدراسية</span>
              <select
                value={stage}
                onChange={(event) => {
                  const nextStage = event.target.value as SchoolStage;
                  setStage(nextStage);
                  setGroupName(groupOptionsByStage[nextStage][0]);
                }}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] border-slate-200 bg-white"
              >
                {stageOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="block text-sm font-bold text-slate-700 text-slate-700">اختر الصف الدراسي</span>
              <select
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] border-slate-200 bg-white"
              >
                {availableGroups.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 md:col-span-3">
              <span className="block text-sm font-bold text-slate-700 text-slate-700">القسم أو الشعبة</span>
              <input
                value={section}
                onChange={(event) => setSection(event.target.value)}
                placeholder="مثال: أ / ب / علمي علوم"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] border-slate-200 bg-white"
              />
            </label>
          </div>
        ) : null}

        {audience === "STUDENT" ? (
          <div className="mt-6">
            <label className="space-y-2 block">
              <span className="block text-sm font-bold text-slate-700 text-slate-700">كود الطالب</span>
              <input
                value={studentCode}
                onChange={(event) => setStudentCode(event.target.value)}
                placeholder="مثال: VIS-101"
                dir="ltr"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono tracking-[0.2em] outline-none transition-colors focus:border-[#D4AF37] border-slate-200 bg-white"
              />
            </label>
          </div>
        ) : null}
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm border-slate-200 bg-white shadow-sm"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A2540]/5 text-[#0A2540] bg-slate-50 dark:text-[#D4AF37]">
            <Layers3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#0A2540] text-[#0A2540]">محتوى الإشعار</h2>
            <p className="text-sm font-bold text-slate-500 text-slate-500">
              هنربطه لاحقًا بجدول الإشعارات بعد ما يتجهز الـ backend.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <label className="space-y-2">
            <span className="block text-sm font-bold text-slate-700 text-slate-700">عنوان الإشعار</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="مثال: تنبيه هام بخصوص الحضور"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] border-slate-200 bg-white"
            />
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-bold text-slate-700 text-slate-700">نص الإشعار</span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="اكتب محتوى الإشعار هنا..."
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] border-slate-200 bg-white"
            />
          </label>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm border-slate-200 bg-white shadow-sm"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A2540]/5 text-[#0A2540] bg-slate-50 dark:text-[#D4AF37]">
              <School2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#0A2540] text-[#0A2540]">سجل الإشعارات</h2>
              <p className="text-sm font-bold text-slate-500 text-slate-500">
                لسه مفيش بيانات مرسلة، فإحنا مستنيين الربط الحقيقي.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500 bg-slate-50 text-slate-700">
            EMPTY FEED
          </span>
        </div>

        <EmptyState
          icon={CircleDashed}
          title="لا توجد إشعارات مرسلة حالياً"
          description="بعد الربط مع Supabase هتظهر هنا الإشعارات المرسلة للجميع أو للصفوف أو للطلاب المحددين."
        />
      </motion.section>
    </div>
  );
}
