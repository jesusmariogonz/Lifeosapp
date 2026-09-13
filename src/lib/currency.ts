export const SUPPORTED_CURRENCIES = [
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "MXN", label: "Mexican Peso", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "CAD", label: "Canadian Dollar", symbol: "$" },
  { code: "ARS", label: "Argentine Peso", symbol: "$" },
  { code: "COP", label: "Colombian Peso", symbol: "$" },
  { code: "CLP", label: "Chilean Peso", symbol: "$" },
  { code: "BRL", label: "Brazilian Real", symbol: "R$" },
];

export const DEFAULT_CURRENCY = "USD";

// A reasonable locale per currency so grouping/decimal formatting looks native
// (e.g. MXN formats as "$1,234.00", EUR as "1.234,00 €" depending on region).
const CURRENCY_LOCALE: Record<string, string> = {
  USD: "en-US",
  MXN: "es-MX",
  EUR: "de-DE",
  GBP: "en-GB",
  CAD: "en-CA",
  ARS: "es-AR",
  COP: "es-CO",
  CLP: "es-CL",
  BRL: "pt-BR",
};

export function formatCurrency(amount: number, currencyCode: string = DEFAULT_CURRENCY): string {
  const code = currencyCode || DEFAULT_CURRENCY;
  const locale = CURRENCY_LOCALE[code] || "en-US";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      currencyDisplay: "symbol",
      // Some currencies (CLP, COP) are conventionally shown without decimals.
      maximumFractionDigits: code === "CLP" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${code}`;
  }
}
