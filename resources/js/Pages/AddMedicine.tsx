import { useState } from "react";
import { Link, useForm } from "@inertiajs/react";
import { ChevronLeft, Save, Scan, Image as ImageIcon } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { Toast } from "@/Components/ui/Toast";
import { useCurrency, useSettings } from "@/lib/settings";
import type { Medicine } from "@/types";

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-foreground mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
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

interface Props {
  medicine?: Medicine;
}

export default function AddMedicine({ medicine }: Props) {
  const { fmt } = useCurrency();
  const settings = useSettings();
  const isEdit = !!medicine;
  const [tab, setTab] = useState<"basic" | "pricing" | "stock">("basic");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(medicine?.image_path ? `/storage/${medicine.image_path}` : null);

  const { data, setData, post, processing, errors } = useForm({
    generic_name: medicine?.generic_name ?? "",
    brand_name: medicine?.brand_name ?? "",
    category: medicine?.category ?? "",
    manufacturer: medicine?.manufacturer ?? "",
    strength: medicine?.strength ?? "",
    dosage_form: medicine?.dosage_form ?? "",
    unit: medicine?.unit ?? "",
    sku: medicine?.sku ?? "",
    barcode: medicine?.barcode ?? "",
    prescription_required: medicine?.prescription_required ?? false,
    description: medicine?.description ?? "",
    purchase_price: medicine?.purchase_price ?? "",
    selling_price: medicine?.selling_price ?? "",
    mrp: medicine?.mrp ?? "",
    tax: medicine?.tax ?? String(Number(settings.default_tax_rate)),
    wholesale_price: medicine?.wholesale_price ?? "",
    discount: medicine?.discount ?? "0",
    batch_number: medicine?.batch_number ?? "",
    expiry_date: medicine?.expiry_date ?? "",
    stock: medicine?.stock ?? "",
    reorder_level: medicine?.reorder_level ?? settings.low_stock_threshold,
    storage_location: medicine?.storage_location ?? "",
    temperature_storage: medicine?.temperature_storage ?? "",
    status: medicine?.status ?? "In Stock",
    image: null as File | null,
    _method: isEdit ? "put" : "post",
  });

  const submit = () => {
    const url = isEdit ? `/medicines/${medicine!.id}` : "/medicines";
    post(url, {
      forceFormData: true,
      onSuccess: () => setToast({ msg: `Medicine ${isEdit ? "updated" : "added"} successfully`, type: "success" }),
      onError: () => setToast({ msg: "Please fix the errors and try again", type: "error" }),
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setData("image", file);
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  const purchase = Number(data.purchase_price) || 0;
  const selling = Number(data.selling_price) || 0;
  const margin = purchase > 0 ? (((selling - purchase) / purchase) * 100).toFixed(1) : "0";

  return (
    <AppLayout>
      <div className="p-5 max-w-4xl">
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        <div className="flex items-center gap-2 mb-5">
          <Link href="/medicines" className="text-muted-foreground hover:text-foreground transition-colors"><ChevronLeft size={18} /></Link>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{isEdit ? "Edit Medicine" : "Add New Medicine"}</h1>
            <p className="text-xs text-muted-foreground">Fill in all required fields to {isEdit ? "update this" : "add a"} medicine {isEdit ? "" : "to the catalogue"}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/medicines"><Btn variant="outline">Cancel</Btn></Link>
            <Btn variant="primary" disabled={processing} onClick={submit}><Save size={13} />Save Medicine</Btn>
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
                <Field label="Generic Name" required error={errors.generic_name}>
                  <Input placeholder="e.g. Amoxicillin" value={data.generic_name} onChange={e => setData("generic_name", e.target.value)} />
                </Field>
                <Field label="Brand Name" required error={errors.brand_name}>
                  <Input placeholder="e.g. Moxilin" value={data.brand_name} onChange={e => setData("brand_name", e.target.value)} />
                </Field>
                <Field label="Category" required error={errors.category}>
                  <Select value={data.category} onChange={e => setData("category", e.target.value)}>
                    <option value="">Select category</option>
                    {["Antibiotics", "Analgesics", "Vitamins", "Antacids", "Antihistamines", "Antidiabetic"].map(c => <option key={c}>{c}</option>)}
                  </Select>
                </Field>
                <Field label="Manufacturer" error={errors.manufacturer}>
                  <Input placeholder="e.g. Sun Pharma" value={data.manufacturer} onChange={e => setData("manufacturer", e.target.value)} />
                </Field>
                <Field label="Strength" error={errors.strength}>
                  <Input placeholder="e.g. 500mg" value={data.strength} onChange={e => setData("strength", e.target.value)} />
                </Field>
                <Field label="Dosage Form" error={errors.dosage_form}>
                  <Select value={data.dosage_form} onChange={e => setData("dosage_form", e.target.value)}>
                    <option value="">Select form</option>
                    {["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Drops"].map(f => <option key={f}>{f}</option>)}
                  </Select>
                </Field>
                <Field label="Unit" error={errors.unit}>
                  <Select value={data.unit} onChange={e => setData("unit", e.target.value)}>
                    <option value="">Select unit</option>
                    {["Strip", "Bottle", "Vial", "Tube", "Sachet"].map(u => <option key={u}>{u}</option>)}
                  </Select>
                </Field>
                <Field label="SKU / Item Code" required error={errors.sku}>
                  <Input placeholder="e.g. MED008" value={data.sku} onChange={e => setData("sku", e.target.value)} />
                </Field>
                <Field label="Barcode" error={errors.barcode}>
                  <div className="flex gap-2">
                    <Input placeholder="Scan or enter barcode" value={data.barcode} onChange={e => setData("barcode", e.target.value)} />
                    <button type="button" className="px-3 py-2 border border-border rounded-md hover:bg-muted text-muted-foreground"><Scan size={14} /></button>
                  </div>
                </Field>
                <Field label="Prescription Required">
                  <Select value={data.prescription_required ? "Yes" : "No"} onChange={e => setData("prescription_required", e.target.value === "Yes")}>
                    <option>No</option><option>Yes</option>
                  </Select>
                </Field>
                <div className="col-span-2">
                  <Field label="Description" error={errors.description}>
                    <textarea rows={3} placeholder="Optional notes about this medicine" value={data.description} onChange={e => setData("description", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none" />
                  </Field>
                </div>
              </Card>
            )}

            {tab === "pricing" && (
              <Card className="p-4 grid grid-cols-2 gap-4">
                <Field label="Purchase Price (₹)" required error={errors.purchase_price}>
                  <Input type="number" placeholder="0.00" value={data.purchase_price} onChange={e => setData("purchase_price", e.target.value)} />
                </Field>
                <Field label="Selling Price (₹)" required error={errors.selling_price}>
                  <Input type="number" placeholder="0.00" value={data.selling_price} onChange={e => setData("selling_price", e.target.value)} />
                </Field>
                <Field label="MRP (₹)" error={errors.mrp}>
                  <Input type="number" placeholder="0.00" value={data.mrp} onChange={e => setData("mrp", e.target.value)} />
                </Field>
                <Field label="Tax / GST (%)" error={errors.tax}>
                  <Select value={data.tax} onChange={e => setData("tax", e.target.value)}>
                    <option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option>
                  </Select>
                </Field>
                <Field label="Wholesale Price (₹)" error={errors.wholesale_price}>
                  <Input type="number" placeholder="0.00" value={data.wholesale_price} onChange={e => setData("wholesale_price", e.target.value)} />
                </Field>
                <Field label="Discount (%)" error={errors.discount}>
                  <Input type="number" placeholder="0" value={data.discount} onChange={e => setData("discount", e.target.value)} />
                </Field>
                <div className="col-span-2 p-3 bg-muted/50 rounded-md">
                  <div className="text-xs font-medium text-foreground mb-2">Margin Calculator</div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div><span className="text-muted-foreground">Purchase:</span> <span className="font-mono font-medium">{fmt(purchase)}</span></div>
                    <div><span className="text-muted-foreground">Selling:</span> <span className="font-mono font-medium">{fmt(selling)}</span></div>
                    <div><span className="text-muted-foreground">Margin:</span> <span className="font-mono font-medium text-emerald-600">{margin}%</span></div>
                  </div>
                </div>
              </Card>
            )}

            {tab === "stock" && (
              <Card className="p-4 grid grid-cols-2 gap-4">
                <Field label="Batch Number" required error={errors.batch_number}>
                  <Input placeholder="e.g. BT2407" value={data.batch_number} onChange={e => setData("batch_number", e.target.value)} />
                </Field>
                <Field label="Expiry Date" required error={errors.expiry_date}>
                  <Input type="date" value={data.expiry_date} onChange={e => setData("expiry_date", e.target.value)} />
                </Field>
                <Field label="Opening Stock" required error={errors.stock}>
                  <Input type="number" placeholder="0" value={data.stock} onChange={e => setData("stock", e.target.value)} />
                </Field>
                <Field label="Reorder Level" error={errors.reorder_level}>
                  <Input type="number" placeholder="e.g. 20" value={data.reorder_level} onChange={e => setData("reorder_level", e.target.value)} />
                </Field>
                <Field label="Storage Location" error={errors.storage_location}>
                  <Input placeholder="e.g. Shelf A3" value={data.storage_location} onChange={e => setData("storage_location", e.target.value)} />
                </Field>
                <Field label="Temperature Storage" error={errors.temperature_storage}>
                  <Select value={data.temperature_storage} onChange={e => setData("temperature_storage", e.target.value)}>
                    <option>Room Temperature</option><option>Refrigerated (2-8°C)</option><option>Frozen</option>
                  </Select>
                </Field>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-56 shrink-0 space-y-4">
            <Card className="p-4">
              <div className="text-xs font-semibold text-foreground mb-3">Medicine Image</div>
              <label className="w-full aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-colors bg-muted/20 overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <ImageIcon size={24} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground text-center">Click to upload or drag & drop</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
              {errors.image && <p className="text-xs text-red-500 mt-1">{errors.image}</p>}
            </Card>
            <Card className="p-4">
              <div className="text-xs font-semibold text-foreground mb-3">Status</div>
              <select value={data.status} onChange={e => setData("status", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background text-foreground focus:outline-none">
                <option>In Stock</option><option>Low Stock</option><option>Out of Stock</option><option>Discontinued</option><option>Inactive</option>
              </select>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
