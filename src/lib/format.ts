// Currency + date formatting shared by client and server.

const ZERO_DECIMAL = new Set(["JPY", "KRW", "VND"]);

const LOCALE = "ja-JP";

export function formatMoney(amount: number, currency = "JPY"): string {
  const fractionDigits = ZERO_DECIMAL.has(currency) ? 0 : 2;
  try {
    return new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount || 0);
  } catch {
    return `${(amount || 0).toFixed(fractionDigits)} ${currency}`;
  }
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(LOCALE, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function toDateInput(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export type LineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export function computeTotals(items: LineItem[], taxRate: number) {
  const subtotal = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0,
  );
  const taxAmount = subtotal * ((Number(taxRate) || 0) / 100);
  const total = subtotal + taxAmount;
  return {
    subtotal: round2(subtotal),
    taxAmount: round2(taxAmount),
    total: round2(total),
  };
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export const CURRENCIES = ["JPY", "USD", "EUR", "GBP", "AUD", "CAD", "KRW"];

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "下書き",
  SENT: "送付済み",
  PAID: "入金済み",
  OVERDUE: "期限超過",
  CANCELLED: "キャンセル",
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "管理者",
  MANAGER: "マネージャー",
  MEMBER: "メンバー",
};

export const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 ring-slate-200",
  SENT: "bg-blue-50 text-blue-700 ring-blue-200",
  PAID: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  OVERDUE: "bg-red-50 text-red-700 ring-red-200",
  CANCELLED: "bg-zinc-100 text-zinc-500 ring-zinc-200",
};
