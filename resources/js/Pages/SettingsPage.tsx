import { useState } from "react";
import { Image, Save, Settings } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { PageHeader } from "@/Components/ui/PageHeader";
import { EmptyState } from "@/Components/ui/EmptyState";

const sections = [
  { id: "business", label: "Business Info" },
  { id: "pos", label: "POS Settings" },
  { id: "receipt", label: "Receipt Template" },
  { id: "tax", label: "Tax / GST" },
  { id: "users", label: "Roles & Permissions" },
  { id: "printer", label: "Printer" },
  { id: "barcode", label: "Barcode" },
  { id: "backup", label: "Backup & Data" },
  { id: "theme", label: "Theme & Display" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20" />
  );
}

export default function SettingsPage() {
  const [section, setSection] = useState("business");

  return (
    <AppLayout notifCount={3}>
      <div className="p-5">
        <PageHeader title="Settings" subtitle="Manage your pharmacy configuration" />
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
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/50 transition-colors bg-muted/20">
                    <Image size={20} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Logo</span>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <Field label="Pharmacy Name"><Input defaultValue="PharmaPro Medical Store" /></Field>
                    <Field label="License Number"><Input defaultValue="DL-MH-2024-00123" /></Field>
                    <Field label="GST Number"><Input defaultValue="27AABCU9603R1ZX" /></Field>
                    <Field label="Phone"><Input defaultValue="+91 98765 43210" /></Field>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Email"><Input defaultValue="admin@pharmapro.in" /></Field>
                  <Field label="Website"><Input defaultValue="www.pharmapro.in" /></Field>
                  <div className="col-span-2"><Field label="Address"><textarea rows={2} defaultValue="123, MG Road, Bandra West, Mumbai - 400050, Maharashtra" className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background text-foreground focus:outline-none resize-none" /></Field></div>
                  <Field label="Currency"><select defaultValue="INR" className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none"><option>INR — Indian Rupee (₹)</option><option>USD — US Dollar ($)</option><option>EUR — Euro (€)</option></select></Field>
                  <Field label="Language"><select className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none"><option>English</option><option>Hindi</option><option>Marathi</option></select></Field>
                </div>
                <div className="flex justify-end mt-5 pt-4 border-t border-border">
                  <Btn variant="primary"><Save size={13} />Save Changes</Btn>
                </div>
              </Card>
            )}
            {section === "theme" && (
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Theme & Display</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-2">Color Theme</label>
                    <div className="flex gap-3">
                      {[{ name: "Blue (Default)", color: "#1a56db" }, { name: "Green", color: "#059669" }, { name: "Violet", color: "#7c3aed" }].map(t => (
                        <button key={t.name} className="flex flex-col items-center gap-1.5">
                          <div className="w-10 h-10 rounded-lg border-2 border-transparent hover:border-border" style={{ background: t.color }} />
                          <span className="text-xs text-muted-foreground">{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-2">Font Size</label>
                    <select className="px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none"><option>Small (13px)</option><option>Default (14px)</option><option>Large (16px)</option></select>
                  </div>
                </div>
              </Card>
            )}
            {!["business", "theme"].includes(section) && (
              <Card className="p-5">
                <EmptyState icon={<Settings size={32} />} title={`${sections.find(s => s.id === section)?.label} settings`} description="Configuration options for this section." action={<Btn variant="primary" size="sm"><Save size={13} />Save Settings</Btn>} />
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
