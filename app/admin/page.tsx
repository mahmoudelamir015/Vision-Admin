"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Banknote,
  CircleDashed,
  CreditCard,
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
import { fetchSystemSettings, updateSystemSettings, type SystemSettings } from "@/src/lib/supabase/system-settings";

type SystemSwitchKey = "wallet" | "registration" | "results";
type StaffPermission = "attendance" | "wallet" | "operations";

type StaffMember = {
  id: string;
  name: string;
  phone: string;
  permission: StaffPermission;
  active: boolean;
};

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
  { title: "غرفة الحضور", href: "/admin/attendance", icon: QrCode },
  { title: "المحفظة", href: "/admin/wallet", icon: Wallet },
  { title: "إدارة الموظفين", href: "/admin/staff", icon: Users },
  { title: "الخزنة", href: "/admin/vault", icon: Banknote },
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
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [staffName, setStaffName] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffPermission, setStaffPermission] = useState<StaffPermission>("attendance");
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

    return () => {
      isMounted = false;
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

  const addStaffMember = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!staffName.trim() || !staffPhone.trim()) return;

    setStaff((current) => [
      ...current,
      {
        id: `staff-${Date.now()}`,
        name: staffName.trim(),
        phone: staffPhone.trim(),
        permission: staffPermission,
        active: true,
      },
    ]);
    setStaffName("");
    setStaffPhone("");
    setStaffPermission("attendance");
  };

  return (
    <div className="space-y-6 pb-10">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="overflow-hidden rounded-[2rem] border border-white/50 bg-gradient-to-br from-[#0A2540] via-[#0f345b] to-[#132f49] p-6 text-white shadow-[0_20px_60px_rgba(10,37,64,0.18)] dark:border-white/10"
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
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/15"
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
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A2540]/5 text-[#0A2540] dark:bg-white/5 dark:text-[#D4AF37]">
                  <SlidersHorizontal className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#0A2540] dark:text-white">مفاتيح التحكم</h2>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">التفعيل والحفظ الفوري داخل جدول system_settings.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 dark:bg-white/5 dark:text-slate-300">
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
                    className={`rounded-[1.5rem] border p-5 text-right transition-all ${
                      enabled
                        ? "border-[#D4AF37]/40 bg-[#D4AF37]/5 shadow-sm"
                        : "border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-white/5"
                    } ${isLoadingSettings || savingKey ? "cursor-wait opacity-70" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.25em] text-[#0A2540] dark:bg-[#0A2540] dark:text-white">
                          {isSaving ? "..." : enabled ? "ON" : "OFF"}
                        </span>
                        <h3 className="text-base font-extrabold text-[#0A2540] dark:text-white">{item.title}</h3>
                      </div>
                      <Icon className={`h-7 w-7 ${enabled ? "text-[#D4AF37]" : "text-slate-400"}`} />
                    </div>
                    <p className="mt-3 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">{item.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                {isLoadingSettings ? "جارٍ تحميل الإعدادات..." : "تم تحميل الإعدادات من Supabase"}
              </span>
              {settingsError ? <span className="text-red-500 dark:text-red-300">{settingsError}</span> : null}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A2540]/5 text-[#0A2540] dark:bg-white/5 dark:text-[#D4AF37]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#0A2540] dark:text-white">إدارة الموظفين</h2>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">إضافة موظف برقم موبايله، تعديل الصلاحية، والحذف عند الحاجة.</p>
                </div>
              </div>
            </div>

            <form onSubmit={addStaffMember} className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr_auto]">
              <input
                value={staffName}
                onChange={(event) => setStaffName(event.target.value)}
                placeholder="اسم الموظف"
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
              />
              <input
                value={staffPhone}
                onChange={(event) => setStaffPhone(event.target.value)}
                placeholder="010XXXXXXXX"
                dir="ltr"
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
              />
              <select
                value={staffPermission}
                onChange={(event) => setStaffPermission(event.target.value as StaffPermission)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
              >
                <option value="attendance">الحضور</option>
                <option value="wallet">المحفظة</option>
                <option value="operations">العمليات</option>
              </select>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A2540] px-5 py-3 font-bold text-white transition-colors hover:bg-[#123B66] dark:bg-[#D4AF37] dark:text-[#0A2540]"
              >
                <Plus className="h-4 w-4" />
                إضافة
              </button>
            </form>

            <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200 dark:border-white/10">
              {staff.length === 0 ? (
                <div className="bg-slate-50/80 p-4 dark:bg-white/5">
                  <EmptyState
                    icon={CircleDashed}
                    title="لا يوجد موظفون بعد"
                    description="أضف أول موظف من النموذج بالأعلى، وبعدها هنقدر نعدل الصلاحيات أو نوقف الحساب من هنا."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-right">
                    <thead className="bg-slate-50 text-slate-500 dark:bg-white/5 dark:text-slate-300">
                      <tr>
                        <th className="px-4 py-3 text-sm font-bold">الاسم</th>
                        <th className="px-4 py-3 text-sm font-bold">الموبايل</th>
                        <th className="px-4 py-3 text-sm font-bold">الصلاحية</th>
                        <th className="px-4 py-3 text-sm font-bold">الحالة</th>
                        <th className="px-4 py-3 text-sm font-bold text-left">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                      {staff.map((member) => (
                        <tr key={member.id} className="bg-white/70 dark:bg-transparent">
                          <td className="px-4 py-4 font-bold text-[#0A2540] dark:text-white">{member.name}</td>
                          <td className="px-4 py-4 font-mono text-sm tracking-wider text-slate-500 dark:text-slate-300">{member.phone}</td>
                          <td className="px-4 py-4">
                            <select
                              value={member.permission}
                              onChange={(event) => {
                                const nextPermission = event.target.value as StaffPermission;
                                setStaff((current) =>
                                  current.map((item) =>
                                    item.id === member.id ? { ...item, permission: nextPermission } : item,
                                  ),
                                );
                              }}
                              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-black/20"
                            >
                              <option value="attendance">الحضور</option>
                              <option value="wallet">المحفظة</option>
                              <option value="operations">العمليات</option>
                            </select>
                          </td>
                          <td className="px-4 py-4">
                            <button
                              type="button"
                              onClick={() =>
                                setStaff((current) =>
                                  current.map((item) =>
                                    item.id === member.id ? { ...item, active: !item.active } : item,
                                  ),
                                )
                              }
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ${
                                member.active
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                                  : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"
                              }`}
                            >
                              {member.active ? "نشط" : "موقوف"}
                            </button>
                          </td>
                          <td className="px-4 py-4 text-left">
                            <button
                              type="button"
                              onClick={() => setStaff((current) => current.filter((item) => item.id !== member.id))}
                              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-100"
                            >
                              <Trash2 className="h-4 w-4" />
                              حذف
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A2540]/5 text-[#0A2540] dark:bg-white/5 dark:text-[#D4AF37]">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#0A2540] dark:text-white">التحكم المالي المطلق</h2>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">تعديل نسب المدرسين وسعر الحصة وسياسة التقفيل الآلي.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">نسبة المدرس %</span>
                <input
                  value={teacherRatio}
                  onChange={(event) => setTeacherRatio(event.target.value)}
                  type="number"
                  min="0"
                  max="100"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">سعر الحصة</span>
                <input
                  value={lessonPrice}
                  onChange={(event) => setLessonPrice(event.target.value)}
                  type="number"
                  min="0"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">التقفيل الآلي %</span>
                <input
                  value={autoSettlement}
                  onChange={(event) => setAutoSettlement(event.target.value)}
                  type="number"
                  min="0"
                  max="100"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
                />
              </label>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">حصة المدرس</p>
                <p className="mt-2 text-2xl font-black text-[#0A2540] dark:text-white">
                  {teacherShare} <span className="text-sm font-bold text-slate-400">ج.م</span>
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">حصة السنتر</p>
                <p className="mt-2 text-2xl font-black text-[#0A2540] dark:text-white">
                  {centerShare} <span className="text-sm font-bold text-slate-400">ج.م</span>
                </p>
              </div>
              <div className="rounded-2xl bg-[#D4AF37]/10 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b28d1f]">قيمة التقفيل</p>
                <p className="mt-2 text-2xl font-black text-[#0A2540]">
                  {autoCloseValue} <span className="text-sm font-bold text-slate-500">ج.م</span>
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A2540]/5 text-[#0A2540] dark:bg-white/5 dark:text-[#D4AF37]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#0A2540] dark:text-white">نظرة سريعة</h2>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">حالة الأنظمة المفتاحية الآن.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                { label: "المحفظة", value: switches.wallet ? "مفعلة" : "مقفولة" },
                { label: "تسجيل الطلاب", value: switches.registration ? "مفتوح" : "مغلق" },
                { label: "إظهار النتائج", value: switches.results ? "ظاهر" : "مخفي" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/5">
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-300">{item.label}</span>
                  <span className="text-sm font-black text-[#0A2540] dark:text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A2540]/5 text-[#0A2540] dark:bg-white/5 dark:text-[#D4AF37]">
                <ReceiptText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#0A2540] dark:text-white">خطوات الربط القادمة</h2>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">الجداول والسياسات جاهزة للتوصيل.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                Tables: users, system_settings, wallets, attendance.
              </div>
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                Auth: Phone OTP للمدير العام والموظفين.
              </div>
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                Policies: المدير العام كامل، والموظف بصلاحيات محدودة فقط.
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
