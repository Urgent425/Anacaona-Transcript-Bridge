// src/pages/InstitutionsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";

// Optional shadcn/ui components (recommended). If you don't have them, replace with simple HTML equivalents.
import { Badge } from "../components/ui/badge";              // fallback: <span>
import { Input } from "../components/ui/input";              // fallback: <input className="border px-3 py-2 rounded" />
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs"; // fallback: switch on local state
import { ScrollArea } from "../components/ui/scroll-area";  // fallback: <div className="max-h-[60vh] overflow-auto">

import { MailPlus, RefreshCw, ShieldCheck, FolderSearch, Users2, Settings2, Ban, CheckCircle2 } from "lucide-react";

import AdminSubmissionsTable from "../components/AdminSubmissionsTable";
import CreateInstitutionForm from "../components/CreateInstitutionForm";

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Existing modal (assignments)
  const [selectedInst, setSelectedInst] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Manage Access modal
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [accessInst, setAccessInst] = useState(null);

  // Access data
  const [invites, setInvites] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [suspendedUsers, setSuspendedUsers] = useState([]);

  const [accessLoading, setAccessLoading] = useState(false);
  const [accessError, setAccessError] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [search, setSearch] = useState("");

  // ---------------------------
  // Fetch institutions
  // ---------------------------
  const fetchInstitutions = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/institutions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load institutions");
      const data = await res.json();
      setInstitutions(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, []);

  // Derived quick stats
  const stats = useMemo(() => {
    const total = institutions.length;
    const withEmail = institutions.filter(i => i.contactEmail).length;
    const withPhone = institutions.filter(i => i.contactPhone).length;
    return { total, withEmail, withPhone };
  }, [institutions]);

  // Assignments view
  const viewAssignments = async (inst) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/admin/transcripts?institution=${inst._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to load assignments");
      const data = await res.json();
      setAssignments(data);
      setSelectedInst(inst);
      setModalOpen(true);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  // Access management helpers
  const loadAccessDetails = async (inst) => {
    if (!inst?._id) return;
    setAccessLoading(true);
    setAccessError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/admin/institutions/${inst._id}/access`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to load institution access data");
      const data = await res.json();
      setAccessInst(data.institution || inst);
      setInvites(data.invites || []);
      setPendingUsers(data.pendingUsers || []);
      setActiveUsers(data.activeUsers || []);
      setSuspendedUsers(data.suspendedUsers || []);
    } catch (err) {
      console.error(err);
      setAccessError(err.message);
    } finally {
      setAccessLoading(false);
    }
  };

  const openAccessModal = async (inst) => {
    setAccessInst(inst);
    setAccessModalOpen(true);
    await loadAccessDetails(inst);
  };

  const createInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/institution-invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ institutionId: accessInst._id, email: inviteEmail.trim() }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message || "Failed to create institution invite");
      }
      setInviteEmail("");
      await loadAccessDetails(accessInst);
    } catch (err) {
      console.error(err);
      setAccessError(err.message);
    }
  };

  const activateUser = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/admin/institution-users/${userId}/activate`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message || "Failed to activate institution user");
      }
      await loadAccessDetails(accessInst);
    } catch (err) {
      console.error(err);
      setAccessError(err.message);
    }
  };

  const suspendUser = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/admin/institution-users/${userId}/suspend`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message || "Failed to suspend institution user");
      }
      await loadAccessDetails(accessInst);
    } catch (err) {
      console.error(err);
      setAccessError(err.message);
    }
  };

  // UI helpers
  const renderBadge = (status) => {
    const map = {
      pending:   "bg-amber-100 text-amber-800",
      active:    "bg-emerald-100 text-emerald-800",
      suspended: "bg-rose-100 text-rose-800",
    };
    return (
      <Badge className={`capitalize ${map[status] || "bg-gray-100 text-gray-700"}`}>
        {status}
      </Badge>
    );
  };

  const filteredInstitutions = useMemo(() => {
    if (!search.trim()) return institutions;
    const q = search.trim().toLowerCase();
    return institutions.filter(i =>
      i.name?.toLowerCase().includes(q) ||
      i.contactEmail?.toLowerCase().includes(q) ||
      i.contactPhone?.toLowerCase().includes(q)
    );
  }, [institutions, search]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <ShieldCheck size={20} className="opacity-70" />
            Institutions
          </h2>
          <p className="text-sm text-gray-500">
            Manage partner institutions, assignments, and secure access.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchInstitutions}>
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-xs uppercase text-gray-500">Total Institutions</div>
          <div className="mt-1 text-2xl font-semibold">{stats.total}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-xs uppercase text-gray-500">With Contact Email</div>
          <div className="mt-1 text-2xl font-semibold">{stats.withEmail}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-xs uppercase text-gray-500">With Phone</div>
          <div className="mt-1 text-2xl font-semibold">{stats.withPhone}</div>
        </div>
      </div>

      {/* Create + Filter row */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-600 mb-1 block">Search</label>
          <Input
            placeholder="Search by name, email, or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-600 mb-1 block">Add Institution</label>
          <div className="rounded-xl border bg-white p-2">
            <CreateInstitutionForm onCreated={fetchInstitutions} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-gray-500 animate-pulse">
            Loading institutions…
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-rose-600">{error}</div>
        ) : filteredInstitutions.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            <FolderSearch className="mx-auto mb-2 opacity-60" />
            No institutions found. Try adjusting your search.
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr className="text-left text-gray-700">
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-4 py-2 font-medium">Phone</th>
                  <th className="px-4 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInstitutions.map((inst, idx) => (
                  <tr
                    key={inst._id}
                    className={`border-t hover:bg-gray-50 ${idx % 2 ? "bg-white" : "bg-white"}`}
                  >
                    <td className="px-4 py-2">{inst.name}</td>
                    <td className="px-4 py-2">{inst.contactEmail || "—"}</td>
                    <td className="px-4 py-2">{inst.contactPhone || "—"}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => viewAssignments(inst)}>
                          <Users2 size={16} className="mr-2" />
                          View Assignments
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => openAccessModal(inst)}>
                          <Settings2 size={16} className="mr-2" />
                          Manage Access
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assignments Modal */}
      {selectedInst && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users2 size={18} />
                Assignments for {selectedInst.name}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <AdminSubmissionsTable
                submissions={assignments}
                onRefresh={() => viewAssignments(selectedInst)}
              />
            </div>
            <DialogFooter>
              <Button onClick={() => setModalOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Manage Access Modal */}
      {accessInst && (
        <Dialog open={accessModalOpen} onOpenChange={setAccessModalOpen}>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings2 size={18} />
                Manage Access — {accessInst.name || "Institution"}
              </DialogTitle>
            </DialogHeader>

            {accessError ? (
              <div className="mb-3 text-sm text-rose-600">{accessError}</div>
            ) : null}

            <div className="mb-3 text-xs text-gray-500">
              {accessInst.contactEmail && (
                <div><span className="font-medium">Contact Email:</span> {accessInst.contactEmail}</div>
              )}
              {accessInst.contactPhone && (
                <div><span className="font-medium">Contact Phone:</span> {accessInst.contactPhone}</div>
              )}
            </div>

            <Tabs defaultValue="invites" className="w-full">
              <TabsList className="mb-3">
                <TabsTrigger value="invites">Invites</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="suspended">Suspended</TabsTrigger>
              </TabsList>

              {/* Invites */}
              <TabsContent value="invites">
                <div className="rounded-lg border p-4 bg-gray-50">
                  <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <Input
                      type="email"
                      placeholder="registrar@university.ht"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                    <Button onClick={createInvite}>
                      <MailPlus size={16} className="mr-2" />
                      Add Invite
                    </Button>
                  </div>

                  <div className="rounded-lg border bg-white">
                    <ScrollArea className="max-h-[46vh]">
                      {accessLoading ? (
                        <div className="p-4 text-sm text-gray-500">Loading invites…</div>
                      ) : invites.length === 0 ? (
                        <div className="p-6 text-sm text-gray-500">
                          No invites yet. Add the first authorized email above.
                        </div>
                      ) : (
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100">
                            <tr className="text-left text-gray-700">
                              <th className="px-3 py-2 font-medium">Email</th>
                              <th className="px-3 py-2 font-medium">Status</th>
                              <th className="px-3 py-2 font-medium">Invited</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invites.map((inv) => (
                              <tr key={inv._id} className="border-t">
                                <td className="px-3 py-2">{inv.email}</td>
                                <td className="px-3 py-2">
                                  {inv.used ? (
                                    <Badge className="bg-emerald-100 text-emerald-800">Used</Badge>
                                  ) : (
                                    <Badge className="bg-gray-100 text-gray-700">Not used</Badge>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-500">
                                  {new Date(inv.createdAt).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              </TabsContent>

              {/* Pending */}
              <TabsContent value="pending">
                <div className="rounded-lg border bg-white">
                  <ScrollArea className="max-h-[52vh]">
                    {accessLoading ? (
                      <div className="p-4 text-sm text-gray-500">Loading pending users…</div>
                    ) : pendingUsers.length === 0 ? (
                      <div className="p-6 text-sm text-gray-500">No pending accounts.</div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr className="text-left text-gray-700">
                            <th className="px-3 py-2 font-medium">Name / Position</th>
                            <th className="px-3 py-2 font-medium">Email</th>
                            <th className="px-3 py-2 font-medium">Status</th>
                            <th className="px-3 py-2 font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingUsers.map((u) => (
                            <tr key={u._id} className="border-t">
                              <td className="px-3 py-2">
                                {u.firstName} {u.lastName}
                                {u.position && (
                                  <div className="text-xs text-gray-500">{u.position}</div>
                                )}
                              </td>
                              <td className="px-3 py-2">{u.email}</td>
                              <td className="px-3 py-2">{renderBadge(u.status)}</td>
                              <td className="px-3 py-2">
                                <Button size="sm" onClick={() => activateUser(u._id)}>
                                  <CheckCircle2 size={16} className="mr-2" />
                                  Activate
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </ScrollArea>
                </div>
              </TabsContent>

              {/* Active */}
              <TabsContent value="active">
                <div className="rounded-lg border bg-white">
                  <ScrollArea className="max-h-[52vh]">
                    {accessLoading ? (
                      <div className="p-4 text-sm text-gray-500">Loading active users…</div>
                    ) : activeUsers.length === 0 ? (
                      <div className="p-6 text-sm text-gray-500">No active accounts.</div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr className="text-left text-gray-700">
                            <th className="px-3 py-2 font-medium">Name / Position</th>
                            <th className="px-3 py-2 font-medium">Email</th>
                            <th className="px-3 py-2 font-medium">Status</th>
                            <th className="px-3 py-2 font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeUsers.map((u) => (
                            <tr key={u._id} className="border-t">
                              <td className="px-3 py-2">
                                {u.firstName} {u.lastName}
                                {u.position && (
                                  <div className="text-xs text-gray-500">{u.position}</div>
                                )}
                              </td>
                              <td className="px-3 py-2">{u.email}</td>
                              <td className="px-3 py-2">{renderBadge(u.status)}</td>
                              <td className="px-3 py-2">
                                <Button size="sm" variant="destructive" onClick={() => suspendUser(u._id)}>
                                  <Ban size={16} className="mr-2" />
                                  Suspend
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </ScrollArea>
                </div>
              </TabsContent>

              {/* Suspended */}
              <TabsContent value="suspended">
                <div className="rounded-lg border bg-white">
                  <ScrollArea className="max-h-[52vh]">
                    {accessLoading ? (
                      <div className="p-4 text-sm text-gray-500">Loading suspended users…</div>
                    ) : suspendedUsers.length === 0 ? (
                      <div className="p-6 text-sm text-gray-500">No suspended accounts.</div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr className="text-left text-gray-700">
                            <th className="px-3 py-2 font-medium">Name / Position</th>
                            <th className="px-3 py-2 font-medium">Email</th>
                            <th className="px-3 py-2 font-medium">Status</th>
                            <th className="px-3 py-2 font-medium"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {suspendedUsers.map((u) => (
                            <tr key={u._id} className="border-t">
                              <td className="px-3 py-2">
                                {u.firstName} {u.lastName}
                                {u.position && (
                                  <div className="text-xs text-gray-500">{u.position}</div>
                                )}
                              </td>
                              <td className="px-3 py-2">{u.email}</td>
                              <td className="px-3 py-2">{renderBadge(u.status)}</td>
                              <td className="px-3 py-2 text-xs text-gray-400">Suspended</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button onClick={() => setAccessModalOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
