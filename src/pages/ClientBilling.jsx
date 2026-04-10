import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  DollarSign,
  FileText,
  Building2,
  CheckCircle,
  Clock,
  Send,
  TrendingUp,
  Plus,
  Eye,
  AlertCircle,
  Search,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";
import { listInvoices, createInvoice, updateInvoice, deleteInvoice } from "@/api/invoices";
import { toast } from "sonner";

const INVOICE_STATUSES = ["draft", "sent", "paid", "overdue", "disputed"];

function generateInvoiceNumber() {
  const now = new Date();
  return `INV-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    Math.floor(Math.random() * 9000) + 1000
  )}`;
}

async function listTimesheetsForBilling(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data, error } = await supabase
    .from("timesheets")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

async function listClientsForBilling(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

async function listPlacementsForBilling(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data, error } = await supabase
    .from("placements")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

function StatCard({ title, value, icon: Icon }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold mt-1">{value}</p>
        </div>
        <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 grid place-items-center">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ClientBilling() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [form, setForm] = useState({
    invoice_number: generateInvoiceNumber(),
    client_name: "",
    amount: "",
    status: "draft",
    due_date: format(addDays(new Date(), 14), "yyyy-MM-dd"),
    notes: "",
  });

  const { data: timesheets = [] } = useQuery({
    queryKey: ["billing-timesheets", authUser?.id],
    queryFn: () => listTimesheetsForBilling(authUser),
    enabled: !!authUser?.id,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["billing-clients", authUser?.id],
    queryFn: () => listClientsForBilling(authUser),
    enabled: !!authUser?.id,
  });

  const { data: placements = [] } = useQuery({
    queryKey: ["billing-placements", authUser?.id],
    queryFn: () => listPlacementsForBilling(authUser),
    enabled: !!authUser?.id,
  });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", authUser?.id],
    queryFn: () => listInvoices(authUser),
    enabled: !!authUser?.id,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createInvoice(payload, authUser),
    onSuccess: async () => {
      toast.success("Invoice created");
      setInvoiceOpen(false);
      setForm({
        invoice_number: generateInvoiceNumber(),
        client_name: "",
        amount: "",
        status: "draft",
        due_date: format(addDays(new Date(), 14), "yyyy-MM-dd"),
        notes: "",
      });
      await queryClient.invalidateQueries({ queryKey: ["invoices", authUser?.id] });
    },
    onError: (error) => toast.error(error.message || "Failed to create invoice"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateInvoice(id, payload, authUser),
    onSuccess: async () => {
      toast.success("Invoice updated");
      setInvoiceOpen(false);
      setSelectedInvoice(null);
      await queryClient.invalidateQueries({ queryKey: ["invoices", authUser?.id] });
    },
    onError: (error) => toast.error(error.message || "Failed to update invoice"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInvoice,
    onSuccess: async () => {
      toast.success("Invoice deleted");
      await queryClient.invalidateQueries({ queryKey: ["invoices", authUser?.id] });
    },
    onError: (error) => toast.error(error.message || "Failed to delete invoice"),
  });

  const billingData = useMemo(() => {
    const grouped = {};

    timesheets
      .filter((t) => ["approved", "invoiced"].includes((t.status || "").toLowerCase()))
      .forEach((timesheet) => {
        const clientName =
          timesheet.client_name ||
          clients.find((c) => c.id === timesheet.client_id)?.name ||
          "Unknown Client";

        const hours = Number(timesheet.hours || 0);
        const rate = Number(timesheet.bill_rate || timesheet.rate || 0);
        const amount = hours * rate;

        if (!grouped[clientName]) {
          grouped[clientName] = {
            client_name: clientName,
            total_hours: 0,
            total_amount: 0,
            timesheet_count: 0,
          };
        }

        grouped[clientName].total_hours += hours;
        grouped[clientName].total_amount += amount;
        grouped[clientName].timesheet_count += 1;
      });

    return Object.values(grouped).sort((a, b) => b.total_amount - a.total_amount);
  }, [timesheets, clients]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        !search ||
        invoice.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
        invoice.client_name?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        filterStatus === "all" || invoice.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, filterStatus]);

  const stats = useMemo(() => {
    const totalRevenue = invoices
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);

    const outstanding = invoices
      .filter((i) => ["sent", "overdue"].includes(i.status))
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);

    const paidCount = invoices.filter((i) => i.status === "paid").length;
    const overdueCount = invoices.filter((i) => i.status === "overdue").length;

    return { totalRevenue, outstanding, paidCount, overdueCount };
  }, [invoices]);

  const openCreate = () => {
    setSelectedInvoice(null);
    setForm({
      invoice_number: generateInvoiceNumber(),
      client_name: "",
      amount: "",
      status: "draft",
      due_date: format(addDays(new Date(), 14), "yyyy-MM-dd"),
      notes: "",
    });
    setInvoiceOpen(true);
  };

  const openEdit = (invoice) => {
    setSelectedInvoice(invoice);
    setForm({
      invoice_number: invoice.invoice_number || "",
      client_name: invoice.client_name || "",
      amount: invoice.amount || "",
      status: invoice.status || "draft",
      due_date: invoice.due_date || "",
      notes: invoice.notes || "",
    });
    setInvoiceOpen(true);
  };

  const handleSave = () => {
    if (!form.client_name.trim()) {
      toast.error("Client name is required");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    if (selectedInvoice?.id) {
      updateMutation.mutate({ id: selectedInvoice.id, payload: form });
    } else {
      createMutation.mutate(form);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading billing...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Client Billing</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage invoices and review billable timesheet totals.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Paid Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} icon={DollarSign} />
        <StatCard title="Outstanding" value={`$${stats.outstanding.toFixed(2)}`} icon={Clock} />
        <StatCard title="Paid Invoices" value={stats.paidCount} icon={CheckCircle} />
        <StatCard title="Overdue" value={stats.overdueCount} icon={AlertCircle} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>Invoices</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search invoices"
                  className="pl-9 w-[220px]"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {INVOICE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {filteredInvoices.length === 0 ? (
              <div className="text-sm text-muted-foreground">No invoices found.</div>
            ) : (
              filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="rounded-xl border p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="font-medium">{invoice.invoice_number}</div>
                    <div className="text-sm text-muted-foreground">{invoice.client_name}</div>
                    <div className="text-sm text-muted-foreground">
                      Due: {invoice.due_date ? format(new Date(invoice.due_date), "MMM d, yyyy") : "—"}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-semibold">${Number(invoice.amount || 0).toFixed(2)}</div>
                      <Badge variant="outline">{invoice.status}</Badge>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => { setSelectedInvoice(invoice); setViewOpen(true); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={() => openEdit(invoice)}>
                      Edit
                    </Button>
                    <Button variant="destructive" onClick={() => deleteMutation.mutate(invoice.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billable summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {billingData.length === 0 ? (
              <div className="text-sm text-muted-foreground">No approved or invoiced timesheets found.</div>
            ) : (
              billingData.map((item) => (
                <div key={item.client_name} className="rounded-xl border p-4">
                  <div className="font-medium">{item.client_name}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {item.timesheet_count} timesheets · {item.total_hours.toFixed(2)} hours
                  </div>
                  <div className="mt-2 font-semibold">${item.total_amount.toFixed(2)}</div>
                </div>
              ))
            )}

            <div className="pt-4 border-t text-sm text-muted-foreground">
              Placements in system: <span className="font-medium text-foreground">{placements.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedInvoice ? "Edit Invoice" : "Create Invoice"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Invoice Number</label>
              <Input
                value={form.invoice_number}
                onChange={(e) => setForm((s) => ({ ...s, invoice_number: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Client Name</label>
              <Input
                value={form.client_name}
                onChange={(e) => setForm((s) => ({ ...s, client_name: e.target.value }))}
                placeholder="Client name"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={form.status} onValueChange={(value) => setForm((s) => ({ ...s, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Due Date</label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((s) => ({ ...s, due_date: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <Input
                value={form.notes}
                onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
                placeholder="Optional notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-3 text-sm">
              <div><span className="font-medium">Invoice:</span> {selectedInvoice.invoice_number}</div>
              <div><span className="font-medium">Client:</span> {selectedInvoice.client_name}</div>
              <div><span className="font-medium">Amount:</span> ${Number(selectedInvoice.amount || 0).toFixed(2)}</div>
              <div><span className="font-medium">Status:</span> {selectedInvoice.status}</div>
              <div><span className="font-medium">Due Date:</span> {selectedInvoice.due_date || "—"}</div>
              <div><span className="font-medium">Notes:</span> {selectedInvoice.notes || "—"}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}