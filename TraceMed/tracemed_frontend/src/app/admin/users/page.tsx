"use client";

import React, { useEffect, useState, useCallback } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import {
  getAdminUsersApi,
  createAdminUserApi,
  updateAdminUserApi,
  deleteAdminUserApi,
  setAdminUserPasswordApi,
} from "@/lib/api";
import { UserDetail, UserRole, ALL_ROLES } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  RefreshCw,
  X,
  AlertCircle,
  Save,
  Shield,
  CheckCircle,
  XCircle,
} from "lucide-react";

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "bg-violet-100 text-violet-700 border-violet-200",
  regulator: "bg-blue-100 text-blue-700 border-blue-200",
  manufacturer: "bg-cyan-100 text-cyan-700 border-cyan-200",
  inspector: "bg-amber-100 text-amber-700 border-amber-200",
  logistics: "bg-orange-100 text-orange-700 border-orange-200",
  pharmacy: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ROLE_COLORS[role] || "bg-gray-100 text-gray-700 border-gray-200"}`}
    >
      {role}
    </span>
  );
}

// ─── Create User Modal ────────────────────────────────────────────────────────

function CreateUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (u: UserDetail) => void;
}) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleRole(role: UserRole) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await createAdminUserApi({
        username: username.trim(),
        password,
        email: email.trim(),
        roles: selectedRoles,
      });
      const created = (res.data || res) as UserDetail;
      onCreated(created);
    } catch (e: unknown) {
      setError((e as Error).message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Add New User" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBox message={error} />}

        <Field label="Username" required>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. john_doe"
            required
            autoFocus
            className={inputClass}
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. john@company.com"
            className={inputClass}
          />
        </Field>
        <Field label="Password" required>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 characters"
            required
            minLength={6}
            className={inputClass}
          />
        </Field>
        <Field label="Roles">
          <div className="flex flex-wrap gap-2 mt-1">
            {ALL_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  selectedRoles.includes(role)
                    ? ROLE_COLORS[role]
                    : "bg-gray-50 text-slate-500 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </Field>
        <ModalFooter onClose={onClose} loading={loading} submitLabel="Create User" />
      </form>
    </Modal>
  );
}

// ─── Edit Roles Modal ─────────────────────────────────────────────────────────

function EditRolesModal({
  user,
  onClose,
  onUpdated,
}: {
  user: UserDetail;
  onClose: () => void;
  onUpdated: (u: UserDetail) => void;
}) {
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(user.roles as UserRole[]);
  const [email, setEmail] = useState(user.email);
  const [isActive, setIsActive] = useState(user.is_active);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleRole(role: UserRole) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await updateAdminUserApi(user.id, {
        roles: user.is_superuser ? undefined : selectedRoles,
        email: email.trim(),
        is_active: isActive,
      });
      const updated = (res.data || res) as UserDetail;
      onUpdated(updated);
    } catch (e: unknown) {
      setError((e as Error).message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={`Edit: ${user.username}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBox message={error} />}

        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Status">
          <button
            type="button"
            onClick={() => setIsActive((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
              isActive
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-600 border-red-200"
            }`}
          >
            {isActive ? (
              <><CheckCircle className="w-4 h-4" /> Active</>
            ) : (
              <><XCircle className="w-4 h-4" /> Inactive</>
            )}
          </button>
        </Field>

        <Field label="Roles">
          {user.is_superuser ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-violet-50 rounded-xl px-3 py-2 border border-violet-100">
              <Shield className="w-4 h-4 text-violet-600" />
              Superuser — "admin" role is permanent and cannot be changed here.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mt-1">
              {ALL_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedRoles.includes(role)
                      ? ROLE_COLORS[role]
                      : "bg-gray-50 text-slate-500 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          )}
          {!user.is_superuser && selectedRoles.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">No roles selected — user cannot log in with any role.</p>
          )}
        </Field>

        <ModalFooter onClose={onClose} loading={loading} submitLabel="Save Changes" />
      </form>
    </Modal>
  );
}

// ─── Change Password Modal ────────────────────────────────────────────────────

function ChangePasswordModal({
  user,
  onClose,
}: {
  user: UserDetail;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await setAdminUserPasswordApi(user.id, password);
      setSuccess(true);
    } catch (e: unknown) {
      setError((e as Error).message || "Failed to set password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={`Change Password: ${user.username}`} onClose={onClose}>
      {success ? (
        <div className="text-center py-4">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <p className="text-slate-700 font-medium">Password updated successfully.</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-xl text-sm font-medium"
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorBox message={error} />}
          <Field label="New Password" required>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
              minLength={6}
              autoFocus
              className={inputClass}
            />
          </Field>
          <Field label="Confirm Password" required>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              required
              className={inputClass}
            />
          </Field>
          <ModalFooter onClose={onClose} loading={loading} submitLabel="Update Password" />
        </form>
      )}
    </Modal>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({
  user,
  onClose,
  onDeleted,
}: {
  user: UserDetail;
  onClose: () => void;
  onDeleted: (id: number) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    setError("");
    try {
      await deleteAdminUserApi(user.id);
      onDeleted(user.id);
    } catch (e: unknown) {
      setError((e as Error).message || "Failed to delete user");
      setLoading(false);
    }
  }

  return (
    <Modal title="Delete User?" onClose={onClose}>
      {error && <ErrorBox message={error} />}
      <p className="text-sm text-slate-600 mb-5">
        Are you sure you want to delete user <strong>{user.username}</strong>?
        This action cannot be undone.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium disabled:opacity-60"
        >
          {loading ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type ModalState =
  | { type: "create" }
  | { type: "edit"; user: UserDetail }
  | { type: "password"; user: UserDetail }
  | { type: "delete"; user: UserDetail }
  | null;

export default function AdminUsersPage() {
  const { hasRole, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<ModalState>(null);

  const isAdmin = hasRole(["admin"]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminUsersApi();
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (e: unknown) {
      setError((e as Error).message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin, fetchUsers]);

  if (!isAdmin) {
    return (
      <ProtectedLayout title="User Management">
        <div className="max-w-2xl mx-auto py-20 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-500 text-sm">Only admin can manage users and roles.</p>
        </div>
      </ProtectedLayout>
    );
  }

  function handleCreated(u: UserDetail) {
    setUsers((prev) => [...prev, u]);
    setModal(null);
  }

  function handleUpdated(u: UserDetail) {
    setUsers((prev) => prev.map((existing) => (existing.id === u.id ? u : existing)));
    setModal(null);
  }

  function handleDeleted(id: number) {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setModal(null);
  }

  function formatDate(s?: string | null) {
    if (!s) return "—";
    return new Date(s).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <ProtectedLayout title="User Management">
      <div className="max-w-6xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {loading ? "Loading…" : `${users.length} users`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setModal({ type: "create" })}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add User
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">User</th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Roles</th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Joined</th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Last Login</th>
                  <th className="text-right text-xs font-semibold text-slate-500 px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400 text-sm">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSelf = currentUser?.id === u.id;
                    return (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-slate-500">
                                {u.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium text-slate-900">{u.username}</p>
                                {u.is_superuser && (
                                  <span className="inline-flex items-center gap-0.5 text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-medium">
                                    <Shield className="w-3 h-3" />
                                    Super
                                  </span>
                                )}
                                {isSelf && (
                                  <span className="text-xs bg-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded-full font-medium">
                                    You
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400">{u.email || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1">
                            {u.roles.length > 0 ? (
                              u.roles.map((r) => <RoleBadge key={r} role={r as UserRole} />)
                            ) : (
                              <span className="text-xs text-slate-400 italic">No roles</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                              u.is_active
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {u.is_active ? (
                              <><CheckCircle className="w-3 h-3" /> Active</>
                            ) : (
                              <><XCircle className="w-3 h-3" /> Inactive</>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs text-slate-500">{formatDate(u.date_joined)}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs text-slate-500">{formatDate(u.last_login)}</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setModal({ type: "edit", user: u })}
                              title="Edit roles"
                              className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setModal({ type: "password", user: u })}
                              title="Change password"
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            {!u.is_superuser && !isSelf && (
                              <button
                                onClick={() => setModal({ type: "delete", user: u })}
                                title="Delete user"
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Role legend */}
        <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-slate-500 mb-3">Role Permissions</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {[
              { role: "admin", desc: "Full system access + user management" },
              { role: "regulator", desc: "Create / edit / delete medicines" },
              { role: "manufacturer", desc: "Create medicines, submit Produced records" },
              { role: "inspector", desc: "Submit Inspected records" },
              { role: "logistics", desc: "Submit InTransit / Delivered records" },
              { role: "pharmacy", desc: "Submit Delivered / Sold records" },
            ].map(({ role, desc }) => (
              <div key={role} className="flex items-start gap-1.5">
                <RoleBadge role={role as UserRole} />
                <span className="text-slate-500 leading-relaxed">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal?.type === "create" && (
        <CreateUserModal onClose={() => setModal(null)} onCreated={handleCreated} />
      )}
      {modal?.type === "edit" && (
        <EditRolesModal
          user={modal.user}
          onClose={() => setModal(null)}
          onUpdated={handleUpdated}
        />
      )}
      {modal?.type === "password" && (
        <ChangePasswordModal user={modal.user} onClose={() => setModal(null)} />
      )}
      {modal?.type === "delete" && (
        <DeleteConfirmModal
          user={modal.user}
          onClose={() => setModal(null)}
          onDeleted={handleDeleted}
        />
      )}
    </ProtectedLayout>
  );
}

// ─── Shared UI components ─────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-slate-500 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function ModalFooter({
  onClose,
  loading,
  submitLabel,
}: {
  onClose: () => void;
  loading: boolean;
  submitLabel: string;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-gray-50 transition-colors"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={loading}
        className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {loading ? "Saving…" : submitLabel}
      </button>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-700">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      {message}
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 bg-white placeholder:text-slate-400 transition";
