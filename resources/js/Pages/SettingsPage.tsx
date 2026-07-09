import { useState } from "react";
import { useForm } from "@inertiajs/react";
import { Download, Image as ImageIcon, Save } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { Toast } from "@/Components/ui/Toast";
import type { Setting } from "@/types";

const sections = [
  { id: "business", label: "Business Info" },
  { id: "pos", label: "POS Settings" },
  { id: "receipt", label: "Receipt Template" },
  { id: "printer", label: "Printer" },
  { id: "barcode", label: "Barcode" },
  { id: "backup", label: "Backup & Data" },
  { id: "theme", label: "Theme & Display" },
];

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-foreground mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20" />
  );
}

function Select({ children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20">
      {children}
    </select>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${checked ? "bg-primary" : "bg-muted"}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : ""}`} />
      </button>
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );
}

interface Props {
  settings: Setting;
}

export default function SettingsPage({ settings }: Props) {
  const [section, setSection] = useState("business");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(settings.logo_path ? `/storage/${settings.logo_path}` : null);

  const { data, setData, post, processing, errors } = useForm({
    pharmacy_name: settings.pharmacy_name,
    license_number: settings.license_number ?? "",
    gst_number: settings.gst_number ?? "",
    phone: settings.phone ?? "",
    email: settings.email ?? "",
    website: settings.website ?? "",
    address: settings.address ?? "",
    currency: settings.currency,
    language: settings.language,
    default_tax_rate: settings.default_tax_rate,
    low_stock_threshold: String(settings.low_stock_threshold),
    allow_negative_stock: settings.allow_negative_stock,
    receipt_footer_text: settings.receipt_footer_text ?? "",
    receipt_show_logo: settings.receipt_show_logo,
    printer_name: settings.printer_name ?? "",
    paper_size: settings.paper_size,
    barcode_prefix: settings.barcode_prefix ?? "",
    barcode_format: settings.barcode_format,
    theme_color: settings.theme_color,
    font_size: settings.font_size,
    logo: null as File | null,
    _method: "put",
  });

  const submit = () => {
    post("/settings", {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => setToast({ msg: "Settings updated successfully", type: "success" }),
      onError: () => setToast({ msg: "Please fix the errors and try again", type: "error" }),
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setData("logo", file);
    if (file) setLogoPreview(URL.createObjectURL(file));
  };

  return (
    <AppLayout>
      <div className="p-5">
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Settings</h1>
            <p className="text-xs text-muted-foreground">Manage your pharmacy configuration</p>
          </div>
          <Btn variant="primary" disabled={processing} onClick={submit}><Save size={13} />Save Changes</Btn>
        </div>
        <div className="flex gap-5">
          <div className="w-48 shrink-0 space-y-0.5">
            {sections.map(s => (
              <button key={s.id} onClick={() => setSection(s.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${section === s.id ? "bg-primary/5 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex-1">
            {section === "business" && (
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Business Information</h3>
                <div className="flex gap-5 mb-5">
                  <label className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/50 transition-colors bg-muted/20 overflow-hidden shrink-0">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <ImageIcon size={20} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Logo</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  </label>
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <Field label="Pharmacy Name" error={errors.pharmacy_name}>
                      <Input value={data.pharmacy_name} onChange={e => setData("pharmacy_name", e.target.value)} />
                    </Field>
                    <Field label="License Number" error={errors.license_number}>
                      <Input value={data.license_number} onChange={e => setData("license_number", e.target.value)} />
                    </Field>
                    <Field label="GST Number" error={errors.gst_number}>
                      <Input value={data.gst_number} onChange={e => setData("gst_number", e.target.value)} />
                    </Field>
                    <Field label="Phone" error={errors.phone}>
                      <Input value={data.phone} onChange={e => setData("phone", e.target.value)} />
                    </Field>
                  </div>
                </div>
                {errors.logo && <p className="text-xs text-red-500 -mt-4 mb-4">{errors.logo}</p>}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Email" error={errors.email}>
                    <Input value={data.email} onChange={e => setData("email", e.target.value)} />
                  </Field>
                  <Field label="Website" error={errors.website}>
                    <Input value={data.website} onChange={e => setData("website", e.target.value)} />
                  </Field>
                  <div className="col-span-2">
                    <Field label="Address" error={errors.address}>
                      <textarea rows={2} value={data.address} onChange={e => setData("address", e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background text-foreground focus:outline-none resize-none" />
                    </Field>
                  </div>
                  <Field label="Currency" error={errors.currency}>
                    <Select value={data.currency} onChange={e => setData("currency", e.target.value)}>
                      <option value="INR">INR — Indian Rupee (₹)</option>
                      <option value="USD">USD — US Dollar ($)</option>
                      <option value="EUR">EUR — Euro (€)</option>
                    </Select>
                  </Field>
                  <Field label="Language" error={errors.language}>
                    <Select value={data.language} onChange={e => setData("language", e.target.value)}>
                      <option>English</option><option>Hindi</option><option>Marathi</option>
                    </Select>
                  </Field>
                </div>
              </Card>
            )}

            {section === "pos" && (
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">POS Settings</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Field label="Default Tax Rate (%)" error={errors.default_tax_rate}>
                    <Input type="number" value={data.default_tax_rate} onChange={e => setData("default_tax_rate", e.target.value)} />
                  </Field>
                  <Field label="Low Stock Threshold" error={errors.low_stock_threshold}>
                    <Input type="number" value={data.low_stock_threshold} onChange={e => setData("low_stock_threshold", e.target.value)} />
                  </Field>
                </div>
                <Toggle checked={data.allow_negative_stock} onChange={v => setData("allow_negative_stock", v)} label="Allow selling when stock is zero or negative" />
              </Card>
            )}

            {section === "receipt" && (
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Receipt Template</h3>
                <div className="space-y-4">
                  <Field label="Footer Text" error={errors.receipt_footer_text}>
                    <textarea rows={3} placeholder="e.g. Thank you for shopping with us!" value={data.receipt_footer_text} onChange={e => setData("receipt_footer_text", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none resize-none" />
                  </Field>
                  <Toggle checked={data.receipt_show_logo} onChange={v => setData("receipt_show_logo", v)} label="Show pharmacy logo on printed receipts" />
                </div>
              </Card>
            )}

            {section === "printer" && (
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Printer Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Printer Name" error={errors.printer_name}>
                    <Input placeholder="e.g. EPSON TM-T82" value={data.printer_name} onChange={e => setData("printer_name", e.target.value)} />
                  </Field>
                  <Field label="Paper Size" error={errors.paper_size}>
                    <Select value={data.paper_size} onChange={e => setData("paper_size", e.target.value)}>
                      <option value="58mm">58mm</option><option value="80mm">80mm</option><option value="A4">A4</option>
                    </Select>
                  </Field>
                </div>
              </Card>
            )}

            {section === "barcode" && (
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Barcode Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Barcode Prefix" error={errors.barcode_prefix}>
                    <Input placeholder="e.g. PH" value={data.barcode_prefix} onChange={e => setData("barcode_prefix", e.target.value)} />
                  </Field>
                  <Field label="Barcode Format" error={errors.barcode_format}>
                    <Select value={data.barcode_format} onChange={e => setData("barcode_format", e.target.value)}>
                      <option value="CODE128">CODE128</option><option value="EAN13">EAN13</option><option value="UPC">UPC</option>
                    </Select>
                  </Field>
                </div>
              </Card>
            )}

            {section === "backup" && (
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Backup & Data</h3>
                <p className="text-sm text-muted-foreground mb-4">Download a full JSON snapshot of your pharmacy's data — medicines, stock, sales, purchases, customers, and suppliers.</p>
                <a href="/settings/backup">
                  <Btn variant="primary" size="sm"><Download size={13} />Download Backup</Btn>
                </a>
              </Card>
            )}

            {section === "theme" && (
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Theme & Display</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-2">Color Theme</label>
                    <div className="flex gap-3">
                      {[{ name: "Blue", label: "Blue (Default)", color: "#1a56db" }, { name: "Green", label: "Green", color: "#059669" }, { name: "Violet", label: "Violet", color: "#7c3aed" }].map(t => (
                        <button key={t.name} type="button" onClick={() => setData("theme_color", t.name)} className="flex flex-col items-center gap-1.5">
                          <div className={`w-10 h-10 rounded-lg border-2 ${data.theme_color === t.name ? "border-foreground" : "border-transparent hover:border-border"}`} style={{ background: t.color }} />
                          <span className="text-xs text-muted-foreground">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-2">Font Size</label>
                    <Select value={data.font_size} onChange={e => setData("font_size", e.target.value)}>
                      <option value="Small">Small (13px)</option><option value="Default">Default (14px)</option><option value="Large">Large (16px)</option>
                    </Select>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
