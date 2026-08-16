const arabicIndicDigits = "٠١٢٣٤٥٦٧٨٩";
const easternArabicDigits = "۰۱۲۳۴۵۶۷۸۹";

function toLatinDigits(value: string) {
  return value
    .split("")
    .map((char) => {
      const arabicIndex = arabicIndicDigits.indexOf(char);
      if (arabicIndex >= 0) return String(arabicIndex);

      const easternIndex = easternArabicDigits.indexOf(char);
      if (easternIndex >= 0) return String(easternIndex);

      return char;
    })
    .join("");
}

export function normalizeEgyptianPhone(phone: string): string | null {
  const digits = toLatinDigits(phone.trim()).replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (!digits) return null;

  const local = digits.startsWith("20") ? digits.slice(2) : digits.startsWith("0") ? digits.slice(1) : digits;
  if (!/^1\d{9}$/.test(local)) return null;

  return `+20${local}`;
}

export function displayEgyptianPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const cleaned = phone.trim();
  if (cleaned.startsWith("+20")) return "0" + cleaned.slice(3);
  if (cleaned.startsWith("20") && cleaned.length === 12) return "0" + cleaned.slice(2);
  return cleaned;
}

export function isEgyptianMobilePhone(phone: string): boolean {
  return normalizeEgyptianPhone(phone) !== null;
}
