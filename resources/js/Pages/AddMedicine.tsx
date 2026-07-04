import { useState } from "react";
import { Link, router } from "@inertiajs/react";
import { ChevronLeft, Save, Scan, Image } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { Toast } from "@/Components/ui/Toast";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-foreground mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  );
}

function Input({ placeholder, type = "text", ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input type={type} placeholder={placeholder} {...rest} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20" />
  );
}

function Select({ children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20">
      {children}
    </select>
  );
}

export default function AddMedicine() {
  const [tab, setTab] = useState<"basic" | "pricing" | "stock">("basic");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  return (
    <AppLayout notifCount={3}>
      <div className="p-5 max-w-4xl">
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        <div className="flex items-center gap-2 mb-5">
          <Link href="/medicines" className="text-muted-foreground hover:text-foreground transition-colors"><ChevronLeft size={18} /></Link>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Add New Medicine</h1>
            <p className="text-xs text-muted-foreground">Fill in all required fields to add a medicine to the catalogue</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/medicines"><Btn variant="outline">Cancel</Btn></Link>
            <Btn variant="primary" onClick={() => { setToast({ msg: "Medicine added successfully", type: "success" }); setTimeout(() => router.visit("/medicines"), 1200); }}><Save size={13} />Save Medicine</Btn>
          </div>
        </div>

        <div className="flex gap-5">
          <div className="flex-1 space-y-4">
            <div className="flex gap-1 border-b border-border mb-4">
              {(["basic", "pricing", "stock"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2.5 text-xs font-medium capitalize border-b-2 -mb-px transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                  {t === "basic" ? "Basic Info" : t === "pricing" ? "Pricing & Tax" : "Stock & Storage"}
                </button>
              ))}
            </div>

            {tab === "basic" && (
              <Card className="p-4 grid grid-cols-2 gap-4">
                <Field label="Generic Name" required><Input placeholder="e.g. Amoxicillin" /></Field>
                <Field label="Brand Name" required><Input placeholder="e.g. Moxilin" /></Field>
                <Field label="Category" required>
                  <Select><option>Select category</option>{["Antibiotics", "Analgesics", "Vitamins", "Antacids", "Antihistamines", "Antidiabetic"].map(c => <option key={c}>{c}</option>)}</Select>
                </Field>
                <Field label="Manufacturer"><Input placeholder="e.g. Sun Pharma" /></Field>
                <Field label="Strength"><Input placeholder="e.g. 500mg" /></Field>
                <Field label="Dosage Form">
                  <Select><option>Select form</option>{["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Drops"].map(f => <option key={f}>{f}</option>)}</Select>
                </Field>
                <Field label="Unit">
                  <Select><option>Select unit</option>{["Strip", "Bottle", "Vial", "Tube", "Sachet"].map(u => <option key={u}>{u}</option>)}</Select>
                </Field>
                <Field label="SKU / Item Code"><Input placeholder="Auto-generated" /></Field>
                <Field label="Barcode">
                  <div className="flex gap-2"><Input placeholder="Scan or enter barcode" /><button className="px-3 py-2 border border-border rounded-md hover:bg-muted text-muted-foreground"><Scan size={14} /></button></div>
                </Field>
                <Field label="Prescription Required">
                  <Select><option>No</option><option>Yes</option></Select>
                </Field>
                <div className="col-span-2"><Field label="Description"><textarea rows={3} placeholder="Optional notes about this medicine" className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none" /></Field></div>
              </Card>
            )}

            {tab === "pricing" && (
              <Card className="p-4 grid grid-cols-2 gap-4">
                <Field label="Purchase Price (₹)" required><Input type="number" placeholder="0.00" /></Field>
                <Field label="Selling Price (₹)" required><Input type="number" placeholder="0.00" /></Field>
                <Field label="MRP (₹)"><Input type="number" placeholder="0.00" /></Field>
                <Field label="Tax / GST (%)">
                  <Select><option>0%</option><option>5%</option><option>12%</option><option>18%</option></Select>
                </Field>
                <Field label="Wholesale Price (₹)"><Input type="number" placeholder="0.00" /></Field>
                <Field label="Discount (%)"><Input type="number" placeholder="0" /></Field>
                <div className="col-span-2 p-3 bg-muted/50 rounded-md">
                  <div className="text-xs font-medium text-foreground mb-2">Margin Calculator</div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div><span className="text-muted-foreground">Purchase:</span> <span className="font-mono font-medium">₹0.00</span></div>
                    <div><span className="text-muted-foreground">Selling:</span> <span className="font-mono font-medium">₹0.00</span></div>
                    <div><span className="text-muted-foreground">Margin:</span> <span className="font-mono font-medium text-emerald-600">0%</span></div>
                  </div>
                </div>
              </Card>
            )}

            {tab === "stock" && (
              <Card className="p-4 grid grid-cols-2 gap-4">
                <Field label="Batch Number" required><Input placeholder="e.g. BT2407" /></Field>
                <Field label="Expiry Date" required><Input type="month" /></Field>
                <Field label="Opening Stock" required><Input type="number" placeholder="0" /></Field>
                <Field label="Reorder Level"><Input type="number" placeholder="e.g. 20" /></Field>
                <Field label="Storage Location"><Input placeholder="e.g. Shelf A3" /></Field>
                <Field label="Temperature Storage">
                  <Select><option>Room Temperature</option><option>Refrigerated (2-8°C)</option><option>Frozen</option></Select>
                </Field>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-56 shrink-0 space-y-4">
            <Card className="p-4">
              <div className="text-xs font-semibold text-foreground mb-3">Medicine Image</div>
              <div className="w-full aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-colors bg-muted/20">
                <Image size={24} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground text-center">Click to upload or drag & drop</span>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-xs font-semibold text-foreground mb-3">Status</div>
              <select className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background text-foreground focus:outline-none">
                <option>Active</option><option>Inactive</option><option>Discontinued</option>
              </select>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
