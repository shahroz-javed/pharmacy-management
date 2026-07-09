import { usePage } from "@inertiajs/react";
import type { Setting } from "@/types";

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
};

const DEFAULT_SETTINGS: Setting = {
  id: 0,
  pharmacy_name: "My Pharmacy",
  license_number: null,
  gst_number: null,
  phone: null,
  email: null,
  website: null,
  address: null,
  logo_path: null,
  currency: "INR",
  language: "English",
  default_tax_rate: "0.00",
  low_stock_threshold: 10,
  allow_negative_stock: false,
  receipt_footer_text: null,
  receipt_show_logo: true,
  printer_name: null,
  paper_size: "80mm",
  barcode_prefix: null,
  barcode_format: "CODE128",
  theme_color: "Blue",
  font_size: "Default",
};

export function useSettings(): Setting {
  const { props } = usePage<{ settings: Setting | null }>();
  return props.settings ?? DEFAULT_SETTINGS;
}

export function currencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? "₹";
}

/**
 * Formats a number/decimal-string as currency using the pharmacy's configured
 * currency symbol, matching the `₹0.00` / `₹1,234` styles already used across the app.
 */
export function useCurrency() {
  const { currency } = useSettings();
  const symbol = currencySymbol(currency);
  return {
    fmt: (amount: number | string, decimals = 2) => `${symbol}${Number(amount).toFixed(decimals)}`,
    fmtCompact: (amount: number | string) => `${symbol}${Number(amount).toLocaleString()}`,
    symbol,
  };
}
