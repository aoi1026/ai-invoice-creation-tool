"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { Badge, Button, Card, Field, Input, Modal, Select, Spinner, useToast } from "@/components/ui";
import { PageHeader } from "@/components/AppShell";
import { formatDate } from "@/lib/format";

type Employee = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "MEMBER";
  active: boolean;
  createdAt: string;
  _count: { invoices: number };
};

const ROLE_STYLES: Record<string, string> = {
  ADMIN: "bg-violet-50 text-violet-700 ring-violet-200",
  MANAGER: "bg-blue-50 text-blue-700 ring-blue-200",
  MEMBER: "bg-slate-100 text-slate-700 ring-slate-200",
};

export default function EmployeesPage() {
  const toast = useToast();
  const [me, setMe] = useState<{ id: string; role: string } | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "MEMBER", password: "", active: true });
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const r = await api<{ employees: Employee[] }>("/api/employees");
      setEmployees(r.employees);
    } catch {
      setDenied(true);
    }
    setLoading(false);
  }
  useEffect(() => {
    api<{ id: string; role: string }>("/api/me").then(setMe).catch(() => {});
    load();
  }, []);

  const isAdmin = me?.role === "ADMIN";

  function openNew() {
    setEditing(null);
    setForm({ name: "", email: "", role: "MEMBER", password: "", active: true });
    setOpen(true);
  }
  function openEdit(e: Employee) {
    setEditing(e);
    setForm({ name: e.name, email: e.email, role: e.role, password: "", active: e.active });
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    try {
      if (editing) {
        await api(`/api/employees/${editing.id}`, {
          method: "PATCH",
          json: {
            name: form.name,
            role: form.role,
            active: form.active,
            ...(form.password ? { password: form.password } : {}),
          },
        });
      } else {
        await api("/api/employees", {
          method: "POST",
          json: { name: form.name, email: form.email, role: form.role, password: form.password },
        });
      }
      toast.push("Team member saved", "success");
      setOpen(false);
      await load();
    } catch (e) {
      toast.push(e instanceof Error ? e.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(e: Employee) {
    if (!confirm(`Remove ${e.name} from the team?`)) return;
    try {
      await api(`/api/employees/${e.id}`, { method: "DELETE" });
      toast.push("Team member removed", "success");
      await load();
    } catch (err) {
      toast.push(err instanceof Error ? err.message : "Delete failed", "error");
    }
  }

  if (loading)
    return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  if (denied)
    return (
      <Card className="p-10 text-center">
        <h2 className="text-lg font-semibold text-slate-900">Access restricted</h2>
        <p className="mt-2 text-sm text-slate-500">
          You need Manager or Admin permissions to view team members.
        </p>
      </Card>
    );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Team"
        description="Manage employees, roles, and access."
        action={isAdmin ? <Button onClick={openNew}>+ Add member</Button> : undefined}
      />

      <Card className="overflow-hidden">
        <table className="hidden w-full text-left text-sm md:table">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Email</th>
              <th className="px-6 py-3 font-medium">Role</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Invoices</th>
              <th className="px-6 py-3 font-medium">Joined</th>
              {isAdmin && <th className="px-6 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-medium text-slate-900">{e.name}</td>
                <td className="px-6 py-3 text-slate-600">{e.email}</td>
                <td className="px-6 py-3"><Badge className={ROLE_STYLES[e.role]}>{e.role}</Badge></td>
                <td className="px-6 py-3">
                  {e.active ? (
                    <span className="text-emerald-600">Active</span>
                  ) : (
                    <span className="text-slate-400">Disabled</span>
                  )}
                </td>
                <td className="px-6 py-3 text-slate-600">{e._count.invoices}</td>
                <td className="px-6 py-3 text-slate-500">{formatDate(e.createdAt)}</td>
                {isAdmin && (
                  <td className="px-6 py-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(e)}>Edit</Button>
                    {e.id !== me?.id && (
                      <Button size="sm" variant="ghost" onClick={() => remove(e)}>Delete</Button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        <ul className="divide-y divide-slate-100 md:hidden">
          {employees.map((e) => (
            <li key={e.id} className="px-4 py-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-900">{e.name}</span>
                <Badge className={ROLE_STYLES[e.role]}>{e.role}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">{e.email}</p>
              {isAdmin && (
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(e)}>Edit</Button>
                  {e.id !== me?.id && <Button size="sm" variant="ghost" onClick={() => remove(e)}>Delete</Button>}
                </div>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit team member" : "Add team member"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving} disabled={!form.name.trim() || (!editing && (!form.email.trim() || form.password.length < 8))}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="Email">
            <Input type="email" value={form.email} disabled={!!editing} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Role">
              <Select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                <option value="MEMBER">Member</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </Select>
            </Field>
            {editing && (
              <Field label="Status">
                <Select value={form.active ? "1" : "0"} onChange={(e) => setForm((f) => ({ ...f, active: e.target.value === "1" }))}>
                  <option value="1">Active</option>
                  <option value="0">Disabled</option>
                </Select>
              </Field>
            )}
          </div>
          <Field label={editing ? "New password (optional)" : "Password"} hint="At least 8 characters.">
            <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          </Field>
          <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            <strong>Roles:</strong> Members create and manage invoices. Managers can also view the team.
            Admins manage employees, permissions, and company settings.
          </p>
        </div>
      </Modal>
    </div>
  );
}
