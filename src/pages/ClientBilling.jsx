import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "../lib/base44Stub";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import StatusBadge from '@/components/shared/StatusBadge';
import {
  DollarSign, FileText, Building2, CheckCircle, Clock, Send,
  TrendingUp, Download, Plus, Eye, AlertCircle, Search
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { toast } from 'sonner';

const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'disputed'];

function generateInvoiceNumber() {
  const now = new Date();
  return `INV-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

export default function ClientBilling() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);

  const { data: timesheets = [] } = useQuery({ queryKey: ['timesheets'], queryFn: () => base44.entities.Timesheet.list() });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list() });
  const { data: placements = [] } = useQuery({ queryKey: ['placements'], queryFn: () => base44.entities.Placement.list() });
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => Promise.resolve([]),
  });

  // Build billing summary from approved/invoiced timesheets grouped by client
  const billingData = useMemo(() => {
    const grouped = {};
    timesheets.filter(t => ['approved', 'invoiced'].includes(t.status)).forEach(ts => {
      const key = ts.client_name || 'Unknown Client';
      if (!grouped[key]) grouped[key] = { client_name: key, records: [], total_hours: 0, total_amount: 0, total_pay: 0 };
      const hours = (ts.monday_hours || 0) + (ts.tuesday_hours || 0) + (ts.wednesday_hours || 0) +
        (ts.thursday_hours || 0) + (ts.friday_hours || 0) + (ts.saturday_hours || 0) + (ts.sunday_hours || 0);
      const bill = hours * (ts.bill_rate || 0);
      const pay = hours * (ts.pay_rate || 0);
      grouped[key].records.push({ ...ts, hours, bill, pay });
      grouped[key].total_hours += hours;
      grouped[key].total_amount += bill;
      grouped[key].total_pay += pay;
    });
    return Object.values(grouped);
  }, [timesheets]);

  const totalRevenue = useMemo(() => billingData.reduce((s, b) => s + b.total_amount, 0), [billingData]);
  const totalPay = useMemo(() => billingData.reduce((s, b) => s + b.total_pay, 0), [billingData]);
  const totalMargin = totalRevenue - totalPay;

  const fmt = (n) => `$${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const filteredBilling = billingData.filter(b =>
    !search || b.client_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleGenerateInvoice = (billing) => {
    setSelectedInvoice({
      invoice_number: generateInvoiceNumber(),
      client_name: billing.client_name,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: addDays(new Date(), 30).toISOString().split('T')[0],
      line_items: billing.records.map(r => ({
        description: `${r.employee_name} — ${r.job_title || 'Staffing'} (Week of ${r.week_start ? format(new Date(r.week_start), 'MMM d') : 'N/A'})`,
        hours: r.hours,
        rate: r.bill_rate || 0,
        amount: r.bill,
      })),
      subtotal: billing.total_amount,
      tax_rate: 0,
      tax_amount: 0,
      total: billing.total_amount,
      status: 'draft',
      payment_terms: 'Net 30',
    });
    setInvoiceOpen(true);
  };

  if (user?.role !== 'admin' && user?.role !== 'manager') {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">Access Restricted</p>
        <p className="text-sm">Only managers and admins can access client billing.</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Client Billing Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate invoices and manage client billing</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: fmt(totalRevenue), icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Total Payroll', value: fmt(totalPay), icon: DollarSign, color: 'text-rose-600 bg-rose-50' },
          { label: 'Gross Margin', value: fmt(totalMargin), icon: CheckCircle, color: 'text-primary bg-primary/10' },
          { label: 'Active Clients', value: billingData.length, icon: Building2, color: 'text-sky-600 bg-sky-50' },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search client..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-sm w-[220px]" />
        </div>
      </div>

      {/* Billing table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                {['Client', 'Total Hours', 'Bill Amount', 'Payroll Cost', 'Gross Margin', 'Margin %', 'Actions'].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredBilling.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No billing data. Approve timesheets to generate billing.</p>
                  </td>
                </tr>
              ) : filteredBilling.map((b, i) => {
                const margin = b.total_amount - b.total_pay;
                const marginPct = b.total_amount > 0 ? ((margin / b.total_amount) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={i} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{b.client_name}</p>
                          <p className="text-xs text-muted-foreground">{b.records.length} timesheet(s)</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{b.total_hours}h</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">{fmt(b.total_amount)}</td>
                    <td className="px-4 py-3 text-rose-500">{fmt(b.total_pay)}</td>
                    <td className="px-4 py-3 font-bold text-primary">{fmt(margin)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={parseFloat(marginPct) >= 20 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'}>
                        {marginPct}%
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleGenerateInvoice(b)}>
                        <FileText className="w-3 h-3" /> Generate Invoice
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invoice preview dialog */}
      {selectedInvoice && (
        <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Invoice Preview
              </DialogTitle>
            </DialogHeader>
            <div className="bg-white border border-border rounded-xl p-8 space-y-6 text-sm">
              {/* Invoice header */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-2xl font-black text-primary">INVOICE</p>
                  <p className="text-muted-foreground text-xs mt-1">{selectedInvoice.invoice_number}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-base">StaffFlow / NSBTek</p>
                  <p className="text-xs text-muted-foreground">www.nsbtek.com</p>
                  <Badge variant="outline" className="text-xs mt-1 bg-amber-50 text-amber-700 border-amber-200">
                    {selectedInvoice.status}
                  </Badge>
                </div>
              </div>

              {/* Bill to + dates */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Bill To</p>
                  <p className="font-semibold">{selectedInvoice.client_name}</p>
                </div>
                <div className="text-right">
                  <div className="space-y-1">
                    <div className="flex justify-end gap-4 text-xs">
                      <span className="text-muted-foreground">Issue Date:</span>
                      <span className="font-medium">{format(new Date(selectedInvoice.issue_date), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex justify-end gap-4 text-xs">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span className="font-medium text-amber-600">{format(new Date(selectedInvoice.due_date), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex justify-end gap-4 text-xs">
                      <span className="text-muted-foreground">Terms:</span>
                      <span className="font-medium">{selectedInvoice.payment_terms}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line items */}
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Description</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Hours</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Rate</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {selectedInvoice.line_items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3">{item.description}</td>
                      <td className="py-2 px-3 text-right">{item.hours}h</td>
                      <td className="py-2 px-3 text-right">${item.rate}/hr</td>
                      <td className="py-2 px-3 text-right font-medium">${item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total */}
              <div className="flex justify-end">
                <div className="w-48 space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${selectedInvoice.subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between border-t pt-1 font-bold text-sm">
                    <span>TOTAL DUE</span><span className="text-primary">${selectedInvoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-2">
              <Button variant="outline" onClick={() => setInvoiceOpen(false)}>Close</Button>
              <Button className="gap-2" onClick={() => { toast.success('Invoice sent to client!'); setInvoiceOpen(false); }}>
                <Send className="w-4 h-4" /> Send to Client
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}