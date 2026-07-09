import { useState } from "react";
import { router, useForm, usePage } from "@inertiajs/react";
import { Plus, Edit2, Trash2, AlertTriangle, Check, Users as UsersIcon } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { PageHeader } from "@/Components/ui/PageHeader";
import { TableHeader } from "@/Components/ui/TableHeader";
import { Toolbar } from "@/Components/ui/Toolbar";
import { SearchInput } from "@/Components/ui/SearchInput";
import { EmptyState } from "@/Components/ui/EmptyState";
import { Modal } from "@/Components/ui/Modal";
import { Toast } from "@/Components/ui/Toast";
import { Badge } from "@/Components/ui/Badge";
import type { StaffUser, UserRole } from "@/types";

interface Props {
  users: StaffUser[];
  filters: { search?: string; role?: string };
}

const roles: UserRole[] = ["Owner", "Manager", "Cashier", "Pharmacist", "Inventory Staff"];

const roleColors: Record<string, string> = {
  Owner: "bg-violet-50 text-violet-700 border-violet-200",
  Manager: "bg-blue-50 text-blue-700 border-blue-200",
  Cashier: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Pharmacist: "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Inventory Staff": "bg-amber-50 text-amber-700 border-amber-200",
};

const permissions: Record<UserRole, string[]> = {
  Owner: ["Full access to every module", "Manage users, roles & settings", "View financial reports"],
  Manager: ["Manage inventory, purchases & sales", "View reports", "Cannot manage users or settings"],
  Cashier: ["POS & sales only", "View medicine stock", "Cannot access reports or settings"],
  Pharmacist: ["Dispense prescriptions", "POS & sales", "View medicine stock"],
  "Inventory Staff": ["Manage stock, purchases & suppliers", "Cannot access POS or sales"],
};

export default function Users({ users, filters }: Props) {
  const { props } = usePage<{ auth: { user: { id: number } } }>();
  const currentUserId = props.auth.user.id;

  const [search, setSearch] = useState(filters.search ?? "");
  const [addModal, setAddModal] = useState(false);
  const [editUser, setEditUser] = useState<StaffUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<StaffUser | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const addForm = useForm({
    name: "",
    email: "",
    role: "Cashier" as UserRole,
    status: "Active",
    password: "",
  });

  const editForm = useForm({
    name: "",
    email: "",
    role: "Cashier" as UserRole,
    status: "Active",
    password: "",
  });

  const applySearch = (v: string) => {
    setSearch(v);
    router.get("/users", { search: v }, { preserveState: true, preserveScroll: true, only: ["users", "filters"] });
  };

  const openEdit = (u: StaffUser) => {
    editForm.clearErrors();
    editForm.setData({ name: u.name, email: u.email, role: u.role, status: u.status, password: "" });
    setEditUser(u);
  };

  const submitAdd = () => {
    addForm.post("/users", {
      preserveScroll: true,
      onSuccess: () => { setAddModal(false); addForm.reset(); setToast({ msg: "User added successfully", type: "success" }); },
      onError: () => setToast({ msg: "Please fix the errors and try again", type: "error" }),
    });
  };

  const submitEdit = () => {
    if (!editUser) return;
    editForm.put(`/users/${editUser.id}`, {
      preserveScroll: true,
      onSuccess: () => { setEditUser(null); setToast({ msg: "User updated successfully", type: "success" }); },
      onError: () => setToast({ msg: "Please fix the errors and try again", type: "error" }),
    });
  };

  const confirmDelete = () => {
    if (!deleteUser) return;
    router.delete(`/users/${deleteUser.id}`, {
      preserveScroll: true,
      onSuccess: () => setToast({ msg: "User deleted successfully", type: "success" }),
      onError: () => setToast({ msg: "Failed to delete user", type: "error" }),
      onFinish: () => setDeleteUser(null),
    });
  };

  return (
    <AppLayout>
      <div className="p-5">
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        <PageHeader
          title="Users & Roles"
          subtitle="Manage staff access and permissions"
          actions={<Btn variant="primary" size="sm" onClick={() => setAddModal(true)}><Plus size={13} />Add User</Btn>}
        />

        <div className="grid grid-cols-5 gap-3 mb-5">
          {roles.map(role => (
            <Card key={role} className="p-3 text-center">
              <div className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border mb-1 ${roleColors[role]}`}>{role}</div>
              <div className="text-xs text-muted-foreground">{users.filter(u => u.role === role).length} user(s)</div>
            </Card>
          ))}
        </div>

        <Toolbar>
          <SearchInput placeholder="Search users…" value={search} onChange={applySearch} />
          <div className="ml-auto text-xs text-muted-foreground">{users.length} users</div>
        </Toolbar>

        {users.length === 0 ? (
          <Card><EmptyState icon={<UsersIcon size={40} />} title="No users found" description="Try adjusting your search or add a new user." /></Card>
        ) : (
          <Card>
            <table className="w-full">
              <TableHeader cols={["User", "Email", "Role", "Status", "Joined", ""]} />
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">{u.name.charAt(0)}</div>
                        <span className="text-sm font-medium text-foreground">{u.name}</span>
                        {u.id === currentUserId && <span className="text-xs text-muted-foreground">(You)</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-2.5"><span className={`text-xs px-2 py-0.5 rounded border font-medium ${roleColors[u.role]}`}>{u.role}</span></td>
                    <td className="px-4 py-2.5"><Badge status={u.status} /></td>
                    <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{u.created_at}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(u)} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"><Edit2 size={13} /></button>
                        {u.id !== currentUserId && (
                          <button onClick={() => setDeleteUser(u)} className="p-1.5 hover:bg-red-50 rounded text-muted-foreground hover:text-red-600"><Trash2 size={13} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        <Card className="mt-5 p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Role Permissions</h3>
          <div className="grid grid-cols-5 gap-3">
            {roles.map(role => (
              <div key={role} className="text-xs">
                <div className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border mb-2 ${roleColors[role]}`}>{role}</div>
                <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                  {permissions[role].map(p => <li key={p}>{p}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </Card>

        <Modal open={addModal} onClose={() => setAddModal(false)} title="Add User">
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Full Name<span className="text-red-500 ml-0.5">*</span></label>
              <input value={addForm.data.name} onChange={e => addForm.setData("name", e.target.value)} placeholder="e.g. Suresh Kumar" className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
              {addForm.errors.name && <p className="text-xs text-red-500 mt-1">{addForm.errors.name}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Email<span className="text-red-500 ml-0.5">*</span></label>
              <input type="email" value={addForm.data.email} onChange={e => addForm.setData("email", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
              {addForm.errors.email && <p className="text-xs text-red-500 mt-1">{addForm.errors.email}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Role<span className="text-red-500 ml-0.5">*</span></label>
                <select value={addForm.data.role} onChange={e => addForm.setData("role", e.target.value as UserRole)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none">
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {addForm.errors.role && <p className="text-xs text-red-500 mt-1">{addForm.errors.role}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Status<span className="text-red-500 ml-0.5">*</span></label>
                <select value={addForm.data.status} onChange={e => addForm.setData("status", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Password<span className="text-red-500 ml-0.5">*</span></label>
              <input type="password" value={addForm.data.password} onChange={e => addForm.setData("password", e.target.value)} placeholder="Min. 8 characters" className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
              {addForm.errors.password && <p className="text-xs text-red-500 mt-1">{addForm.errors.password}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Btn variant="outline" onClick={() => setAddModal(false)}>Cancel</Btn>
              <Btn variant="primary" disabled={addForm.processing} onClick={submitAdd}><Check size={13} />Save User</Btn>
            </div>
          </div>
        </Modal>

        <Modal open={editUser !== null} onClose={() => setEditUser(null)} title="Edit User">
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Full Name<span className="text-red-500 ml-0.5">*</span></label>
              <input value={editForm.data.name} onChange={e => editForm.setData("name", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
              {editForm.errors.name && <p className="text-xs text-red-500 mt-1">{editForm.errors.name}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Email<span className="text-red-500 ml-0.5">*</span></label>
              <input type="email" value={editForm.data.email} onChange={e => editForm.setData("email", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
              {editForm.errors.email && <p className="text-xs text-red-500 mt-1">{editForm.errors.email}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Role<span className="text-red-500 ml-0.5">*</span></label>
                <select value={editForm.data.role} onChange={e => editForm.setData("role", e.target.value as UserRole)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none">
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Status<span className="text-red-500 ml-0.5">*</span></label>
                <select
                  value={editForm.data.status}
                  onChange={e => editForm.setData("status", e.target.value)}
                  disabled={editUser?.id === currentUserId}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none disabled:opacity-50"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                {editForm.errors.status && <p className="text-xs text-red-500 mt-1">{editForm.errors.status}</p>}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">New Password</label>
              <input type="password" value={editForm.data.password} onChange={e => editForm.setData("password", e.target.value)} placeholder="Leave blank to keep current password" className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
              {editForm.errors.password && <p className="text-xs text-red-500 mt-1">{editForm.errors.password}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Btn variant="outline" onClick={() => setEditUser(null)}>Cancel</Btn>
              <Btn variant="primary" disabled={editForm.processing} onClick={submitEdit}><Check size={13} />Save Changes</Btn>
            </div>
          </div>
        </Modal>

        <Modal open={deleteUser !== null} onClose={() => setDeleteUser(null)} title="Delete User">
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-red-800 dark:text-red-400">This action cannot be undone</div>
                <div className="text-xs text-red-600 dark:text-red-400 mt-1">{deleteUser?.name} will lose access to the system immediately.</div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Btn variant="outline" onClick={() => setDeleteUser(null)}>Cancel</Btn>
              <Btn variant="danger" onClick={confirmDelete}>Delete User</Btn>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
