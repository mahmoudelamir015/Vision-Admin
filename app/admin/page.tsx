"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Banknote,
  CircleDashed,
  CreditCard,
  GraduationCap,
  Loader2,
  Plus,
  QrCode,
  ReceiptText,
  Shield,
  SlidersHorizontal,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/components/admin/AuthContext";
import EmptyState from "@/components/admin/EmptyState";
import {
  fetchSystemSettings,
  subscribeToSystemSettings,
  updateSystemSettings,
  type SystemSettings,
} from "@/src/lib/supabase/system-settings";
import { deleteUser, fetchUsers, saveUser, subscribeToUsers, type AppUserRecord } from "@/src/lib/supabase/users";

type SystemSwitchKey = "wallet" | "registration" | "results";
type StaffPermission = "attendance" | "wallet" | "operations" | "manage_teachers";

const switchMeta: Array<{
  key: SystemSwitchKey;
  title: string;
  description: string;
}> = [
  {
    key: "wallet",
    title: "تفعيل / تعطيل المحفظة",
    description: "التحكم في إظهار واجهة الماليات وتفعيل الشحن والتفاصيل المالية للطلاب وأولياء الأمور.",
  },
  {
    key: "registration",
    title: "فتح / قفل تسجيل الطلاب الجدد",
    description: "إيقاف أو استقبال طلبات الطلاب الجدد من الواجهة العامة وقت الحاجة.",
  },
  {
    key: "results",
    title: "إظهار / إخفاء النتائج",
    description: "التحكم في إظهار نتائج الامتحانات للطلاب وأولياء الأمور مباشرة من هنا.",
  },
];

const quickActions = [
  { title: "المحفظة", href: "/admin/wallet", icon: Wallet },
  { title: "إدارة المدرسين", href: "/admin/teachers", icon: GraduationCap },
  { title: "إدارة الطلاب", href: "/admin/users", icon: Users },
  { title: "الخزنة", href: "/admin/vault", icon: Banknote },
];

const editDataActions = [
  { title: "تعديل بيانات الطلاب", href: "/admin/users" },
  { title: "تعديل بيانات المعلمين", href: "/admin/teachers" },
];

const defaultSwitches: Record<SystemSwitchKey, boolean> = {
  wallet: false,
  registration: false,
  results: false,
};

export default function AdminControlRoomPage() {
  const { user } = useAuth();
  const [switches, setSwitches] = useState<Record<SystemSwitchKey, boolean>>(defaultSwitches);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [savingKey, setSavingKey] = useState<SystemSwitchKey | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [staff, setStaff] = useState<AppUserRecord[]>([]);
  const [staffName, setStaffName] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffPermission, setStaffPermission] = useState<StaffPermission>("attendance");
  const [staffFormFeedback, setStaffFormFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isStaffSaving, setIsStaffSaving] = useState(false);
  const [memberActionLoading, setMemberActionLoading] = useState<string | null>(null);
  const [teacherRatio, setTeacherRatio] = useState("60");
  const [lessonPrice, setLessonPrice] = useState("250");
  const [autoSettlement, setAutoSettlement] = useState("80");

  useEffect(() => {
    if (user?.role === "staff") {
      return;
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const settings = await fetchSystemSettings();

        if (!isMounted) return;

        if (settings) {
          setSwitches({
            wallet: Boolean(settings.wallet_enabled),
            registration: Boolean(settings.registration_open),
            results: Boolean(settings.show_results),
          });
        }
      } catch (error) {
        console.error("Failed to load system settings", error);

        if (isMounted) {
          setSettingsError("تعذر تحميل مفاتيح التحكم من قاعدة البيانات.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingSettings(false);
        }
      }
    };

    void loadSettings();

    const unsubscribe = subscribeToSystemSettings((settings) => {
      if (!isMounted) return;

      setSwitches({
        wallet: Boolean(settings.wallet_enabled),
        registration: Boolean(settings.registration_open),
        results: Boolean(settings.show_results),
      });
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToUsers((records) => {
      setStaff(records.filter((record) => record.role === "staff"));
    });

    void fetchUsers("staff").then((records) => setStaff(records));

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (user?.role !== "master_admin") {
    return null;
  }

  const lessonPriceNumber = Number(lessonPrice || 0);
  const teacherRatioNumber = Number(teacherRatio || 0);
  const autoSettlementNumber = Number(autoSettlement || 0);
  const teacherShare = Math.round((lessonPriceNumber * teacherRatioNumber) / 100);
  const centerShare = lessonPriceNumber - teacherShare;
  const autoCloseValue = Math.round((lessonPriceNumber * autoSettlementNumber) / 100);

  const toggleSwitch = async (key: SystemSwitchKey) => {
    if (savingKey) return;

    const nextValue = !switches[key];
    const previousValue = switches[key];
    const dbKey =
      key === "wallet"
        ? "wallet_enabled"
        : key === "registration"
          ? "registration_open"
          : "show_results";

    setSettingsError(null);
    setSwitches((current) => ({
      ...current,
      [key]: nextValue,
    }));
    setSavingKey(key);

    try {
      const updated = await updateSystemSettings({
        [dbKey]: nextValue,
      } as Partial<SystemSettings>);

      if (!updated) {
        throw new Error("لم يتم حفظ التغيير.");
      }
    } catch (error) {
      console.error("Failed to update system settings", error);
      setSettingsError("حصل خطأ أثناء الحفظ. تم إرجاع القيمة السابقة.");
      setSwitches((current) => ({
        ...current,
        [key]: previousValue,
      }));
    } finally {
      setSavingKey(null);
    }
  };

  const addStaffMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStaffFormFeedback(null);

    if (!staffName.trim() || !staffPhone.trim()) {
      setStaffFormFeedback({ type: "error", message: "من فضلك اكتب الاسم والهاتف قبل الإضافة." });
      return;
    }

    setIsStaffSaving(true);
    try {
      const saved = await saveUser({
        name: staffName.trim(),
        phone: staffPhone.trim(),
        role: "staff",
        permissions: [staffPermission],
        active: true,
        password: staffPassword.trim() || undefined,
      });

      if (!saved) {
        setStaffFormFeedback({ type: "error", message: "حدث خطأ أثناء حفظ الموظف. تأكد من البيانات وحاول مرة أخرى." });
        return;
      }

      setStaff((current) => [saved, ...current.filter((item) => item.phone !== saved.phone)]);
      setStaffName("");
      setStaffPhone("");
      setStaffPassword("");
      setStaffPermission("attendance");
      setStaffFormFeedback({ type: "success", message: "تم إضافة الموظف بنجاح." });
    } catch (error) {
      console.error("Failed to add staff member", error);
      setStaffFormFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء حفظ الموظف.",
      });
    } finally {
      setIsStaffSaving(false);
    }
  };

  const updateStaffMember = async (member: AppUserRecord, patch: Partial<AppUserRecord>) => {
    if (!member.id) return;
    setMemberActionLoading(member.id);
    setStaffFormFeedback(null);

    try {
      const saved = await saveUser({
        ...member,
        role: "staff",
        ...patch,
      });

      if (!saved) {
        setStaffFormFeedback({
          type: "error",
          message: "تعذر حفظ بيانات الموظف. حاول مرة أخرى.",
        });
        return;
      }

      setStaff((current) => current.map((item) => (item.id === member.id ? saved : item)));
      setStaffFormFeedback({ type: "success", message: "تم تحديث بيانات الموظف بنجاح." });
    } catch (error) {
      console.error("Failed to update staff member", error);
      setStaffFormFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء تحديث بيانات الموظف.",
      });
    } finally {
      setMemberActionLoading(null);
    }
  };

  const handleDeleteStaff = async (member: AppUserRecord) => {
    if (!member.id) return;
    setMemberActionLoading(member.id);
    setStaffFormFeedback(null);

    try {
      const deleted = await deleteUser(member.id);
      if (!deleted) {
        setStaffFormFeedback({
          type: "error",
          message: "حدث خطأ أثناء حذف الموظف. حاول مرة أخرى.",
        });
        return;
      }

      setStaff((current) => current.filter((item) => item.phone !== member.phone));
      setStaffFormFeedback({ type: "success", message: "تم حذف الموظف بنجاح." });
    } catch (error) {
      console.error("Failed to delete staff member", error);
      setStaffFormFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء حذف الموظف.",
      });
    } finally {
      setMemberActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="overflow-hidden rounded-[2rem] border border-white/50 bg-gradient-to-br from-[#0A2540] via-[#0f345b] to-[#132f49] p-6 text-white shadow-[0_20px_60px_rgba(10,37,64,0.18)] border-slate-200"
      >
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.3em] text-[#D4AF37]">
              <Shield className="h-4 w-4" />
              The Control Room
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-black leading-tight sm:text-4xl">غرفة العمليات الشاملة</h1>
              <p className="max-w-2xl text-sm font-medium leading-7 text-white/70 sm:text-base">
                هنا بنشغل ونوقف الأنظمة الحساسة، نراجع حركة الموظفين، ونضبط نسب المدرسين وسعر الحصص قبل ما البيانات الحقيقية توصل من Supabase.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-white/20 hover:shadow-lg"
                  >
                    <Icon className="h-4 w-4 text-[#D4AF37]" />
                    {action.title}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/50">المدير</p>
              <p className="mt-2 text-xl font-black text-[#D4AF37]">{user.name}</p>
              <p className="mt-1 text-sm font-medium text-white/70">صلاحية كاملة داخل اللوحة</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/50">الموظفين</p>
              <p className="mt-2 text-xl font-black text-[#D4AF37]">{staff.length}</p>
              <p className="mt-1 text-sm font-medium text-white/70">حسابات تحت الإدارة</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/50">المحفظة</p>
              <p className="mt-2 text-xl font-black text-[#D4AF37]">{switches.wallet ? "ON" : "OFF"}</p>
              <p className="mt-1 text-sm font-medium text-white/70">وضع التشغيل الحالي</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/50">النتائج</p>
              <p className="mt-2 text-xl font-black text-[#D4AF37]">{switches.results ? "VISIBLE" : "HIDDEN"}</p>
              <p className="mt-1 text-sm font-medium text-white/70">حالة العرض للطلاب</p>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A2540]/5 text-[#0A2540]">
                  <SlidersHorizontal className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#0A2540]">مفاتيح التحكم</h2>
                  <p className="text-sm font-bold text-slate-500">التفعيل والحفظ الفوري داخل جدول system_settings.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
                {isLoadingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isLoadingSettings ? "جارٍ التحميل..." : "جاهز"}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {switchMeta.map((item) => {
                const enabled = switches[item.key];
                const Icon = enabled ? ToggleRight : ToggleLeft;
                const isSaving = savingKey === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => void toggleSwitch(item.key)}
                    disabled={isLoadingSettings || savingKey !== null}
                    className={`rounded-[1.5rem] border p-5 text-right transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg ${
                      enabled
                        ? "border-[#D4AF37] bg-gradient-to-br from-amber-50 to-white shadow-sm"
                        : "border-slate-200 bg-slate-50 hover:bg-white"
                    } ${isLoadingSettings || savingKey ? "cursor-wait opacity-70" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <span className="inline-flex rounded-full bg-[#0A2540] px-3 py-1 text-[11px] font-black uppercase tracking-[0.25em] text-white">
                          {isSaving ? "..." : enabled ? "ON" : "OFF"}
                        </span>
                        <h3 className="text-base font-extrabold text-[#0A2540]">{item.title}</h3>
                      </div>
                      <Icon className={`h-7 w-7 ${enabled ? "text-[#D4AF37]" : "text-slate-400"}`} />
                    </div>
                    <p className="mt-3 text-sm font-bold leading-6 text-slate-600">{item.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 bg-slate-50 text-slate-700">
                {isLoadingSettings ? "جارٍ تحميل الإعدادات..." : "تم تحميل الإعدادات من Supabase"}
              </span>
              {settingsError ? <span className="text-red-500 dark:text-red-300">{settingsError}</span> : null}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A2540]/5 text-[#0A2540]">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#0A2540]">التحكم المالي المطلق</h2>
                  <p className="text-sm font-bold text-slate-500">تعديل نسب المدرسين وسعر الحصة وسياسة التقفيل الآلي.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-700">نسبة المدرس %</span>
                <input
                  value={teacherRatio}
                  onChange={(event) => setTeacherRatio(event.target.value)}
                  type="number"
                  min="0"
                  max="100"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 font-bold outline-none transition-all focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-700">سعر الحصة</span>
                <input
                  value={lessonPrice}
                  onChange={(event) => setLessonPrice(event.target.value)}
                  type="number"
                  min="0"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 font-bold outline-none transition-all focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-700">التقفيل الآلي %</span>
                <input
                  value={autoSettlement}
                  onChange={(event) => setAutoSettlement(event.target.value)}
                  type="number"
                  min="0"
                  max="100"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 font-bold outline-none transition-all focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
                />
              </label>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">حصة المدرس</p>
                <p className="mt-2 text-2xl font-black text-[#0A2540]">
                  {teacherShare} <span className="text-sm font-bold text-slate-500">ج.م</span>
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">حصة السنتر</p>
                <p className="mt-2 text-2xl font-black text-[#0A2540]">
                  {centerShare} <span className="text-sm font-bold text-slate-500">ج.م</span>
                </p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4 border border-[#D4AF37]/30">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-800">قيمة التقفيل</p>
                <p className="mt-2 text-2xl font-black text-[#0A2540]">
                  {autoCloseValue} <span className="text-sm font-bold text-slate-600">ج.م</span>
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A2540]/5 text-[#0A2540]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#0A2540]">نظرة سريعة</h2>
                <p className="text-sm font-bold text-slate-500">حالة الأنظمة المفتاحية الآن.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                { label: "المحفظة", value: switches.wallet ? "مفعلة" : "مقفولة" },
                { label: "تسجيل الطلاب", value: switches.registration ? "مفتوح" : "مغلق" },
                { label: "إظهار النتائج", value: switches.results ? "ظاهر" : "مخفي" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3">
                  <span className="text-sm font-bold text-slate-600">{item.label}</span>
                  <span className="text-sm font-black text-[#0A2540]">{item.value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A2540]/5 text-[#0A2540]">
                <ReceiptText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#0A2540]">حالة التغييرات</h2>
                <p className="text-sm font-bold text-slate-500">الجداول والسياسات متصلة بالكامل.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-bold text-slate-700">
                Tables: users, system_settings, wallets, attendance.
              </div>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-bold text-slate-700">
                Auth: Phone OTP للمدير العام والموظفين.
              </div>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-bold text-slate-700">
                Policies: المدير العام كامل، والموظف بصلاحيات محدودة فقط.
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
