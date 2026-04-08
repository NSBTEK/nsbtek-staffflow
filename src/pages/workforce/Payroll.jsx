import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "../../lib/base44Stub";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import StatusBadge from '@/components/shared/StatusBadge';
import {
  DollarSign, Play, CheckCircle, AlertCircle, Settings, Calculator,
  Download, Users, Clock, TrendingUp, Zap, ToggleLeft, ToggleRight
} from 'lucide-react';
import { format } from 'date-fns';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { toast } from 'sonner';

const TAX_BRACKETS = [
  { min: 0, max: 9950, rate: 0.10 },
  { min: 9950, max: 40525, rate: 0.12 },
  { min: 40525, max: 86375, rate: 0.22 },
  { min: 86375, max: 164925, rate: 0.24 },
  { min: 164925, max: Infinity, rate: 0.32 },
];

function calcFederalTax(annualIncome) {
  let tax = 0;
  for (const bracket of TAX_BRACKETS) {
    if (annualIncome > bracket.min) {
      const taxable = Math.min(annualIncome, bracket.max) - bracket.min;
      tax += taxable * bracket.rate;
    }
  }
  return tax;
}

function calcPayrollForEmployee(ts, contract) {
  const hours = (ts.monday_hours || 0) + (ts.tuesday_hours || 0) + (ts.wednesday_hours || 0) +
    (ts.thursday_hours || 0) + (ts.friday_hours || 0) + (ts.saturday_hours || 0) + (ts.sunday_hours || 0);
  const payRate = ts.pay_rate || contract?.pay_rate || 0;
  const billRate = ts.bill_rate || contract?.bill_rate || 0;
  const grossPay = hours * payRate;
  const grossBill = hours * billRate;
  const annualEstimate = grossPay * 52;
  const federalTaxAnnual = calcFederalTax(annualEstimate);
  const federalTax = federalTaxAnnual / 52;
  const socialSecurity = grossPay * 0.062;
  const medicare = grossPay * 0.0145;
  const stateTax = grossPay * 0.05;
  const totalDeductions = federalTax + socialSecurity + medicare + stateTax;
  const netPay = grossPay - totalDeductions;
  const margin = grossBill - grossPay;
  return { hours, payRate, billRate, grossPay, grossBill, federalTax, socialSecurity, medicare, stateTax, totalDeductions, netPay, margin };
}

export default function Payroll() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [autoPayroll, setAutoPayroll] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: timesheets = [], isLoading } = useQuery({
    queryKey: ['timesheets'],
    queryFn: () => base44.entities.Timesheet.list('-week_start'),
  });
  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.Contract.list(),
  });
  const { data: placements = [] } = useQuery({
    queryKey: ['placements'],
    queryFn: () => base44.entities.Placement.list(),
  });

  const approvedTimesheets = useMemo(() =>
    timesheets.filter(t => t.status === 'approved'),
    [timesheets]
  );

  const payrollData = useMemo(() =>
    approvedTimesheets
      .filter(ts => !search || ts.employee_name?.toLowerCase().includes(search.toLowerCase()))
      .map(ts => {
        const contract = contracts.find(c => c.employee_email === ts.employee_email && c.status === 'active');
        const calc = calcPayrollForEmployee(ts, contract);
        return { ...ts, ...calc, contract };
      }),
    [approvedTimesheets, contracts, search]
  );

  const totals = useMemo(() => ({
    totalGross: payrollData.reduce((s, r) => s + r.grossPay, 0),
    totalNet: payrollData.reduce((s, r) => s + r.netPay, 0),
    totalBill: payrollData.reduce((s, r) => s + r.grossBill, 0),
    totalMargin: payrollData.reduce((s, r) => s + r.margin, 0),
    totalHours: payrollData.reduce((s, r) => s + r.hours, 0),
    count: payrollData.length,
  }), [payrollData]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Timesheet.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      toast.success('Payroll processed successfully!');
      setRunDialogOpen(false);
    },
  });

  const handleRunPayroll = () => {
    const toProcess = payrollData.filter(r => r.grossPay > 0);
    Promise.all(toProcess.map(r => base44.entities.Timesheet.update(r.id, { status: 'invoiced' })))
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['timesheets'] });
        toast.success(`Payroll run complete! Processed ${toProcess.length} records.`);
        setRunDialogOpen(false);
      });
  };

  const fmt = (n) => `$${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (user?.role !== 'admin' && user?.role !== 'manager' && user?.role !== 'workforce_manager') {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">Access Restricted</p>
        <p className="text-sm">Only managers and admins can access payroll.</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payroll Processing</h1>
          <p className="text-sm text-muted-foreground mt-1">Calculate and run payroll for approved timesheets</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto/Manual Toggle */}
          <div className="flex items-center gap-2 bg-muted border border-border rounded-xl px-4 py-2">
            <span className="text-xs text-muted-foreground font-medium">Auto Payroll</span>
            <button onClick={() => setAutoPayroll(!autoPayroll)} className="transition-colors">
              {autoPayroll
                ? <ToggleRight className="w-6 h-6 text-primary" />
                : <ToggleLeft className="w-6 h-6 text-muted-foreground" />}
            </button>
            <Badge variant="outline" className={autoPayroll
              ? 'text-xs bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'text-xs bg-amber-50 text-amber-700 border-amber-200'}>
              {autoPayroll ? 'Auto' : 'Manual'}
            </Badge>
          </div>
          <Button onClick={() => setRunDialogOpen(true)} disabled={payrollData.length === 0} className="gap-2">
            <Play className="w-4 h-4" /> Run Payroll
          </Button>
        </div>
      </div>

      {autoPayroll && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-700">
          <Zap className="w-4 h-4 shrink-0" />
          <span><strong>Auto Payroll is ON.</strong> Payroll will automatically process every Friday for all approved timesheets. You can still run it manually at any time.</span>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Employees to Pay', value: totals.count, icon: Users, color: 'text-primary bg-primary/10' },
          { label: 'Total Hours', value: `${totals.totalHours}h`, icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Gross Pay', value: fmt(totals.totalGross), icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Net Pay', value: fmt(totals.totalNet), icon: CheckCircle, color: 'text-sky-600 bg-sky-50' },
          { label: 'Gross Margin', value: fmt(totals.totalMargin), icon: TrendingUp, color: 'text-violet-600 bg-violet-50' },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Tax note */}
      <div className="flex items-center gap-3">
        <Input placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs h-8 text-sm" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
          <Calculator className="w-3.5 h-3.5 text-blue-500" />
          Calculations: Federal tax (brackets) + SS 6.2% + Medicare 1.45% + State 5%
        </div>
      </div>

      {/* Payroll Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                {['Employee', 'Week', 'Hours', 'Pay Rate', 'Bill Rate', 'Gross Pay', 'Deductions', 'Net Pay', 'Margin', 'Actions'].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={10} className="text-center py-12 text-muted-foreground">Loading...</td></tr>
              ) : payrollData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-14 text-muted-foreground">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No approved timesheets ready for payroll.</p>
                    <p className="text-xs mt-1">Approve timesheets in the Timesheets section first.</p>
                  </td>
                </tr>
              ) : (
                payrollData.map(row => (
                  <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{row.employee_name}</p>
                      <p className="text-xs text-muted-foreground">{row.client_name}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {row.week_start ? format(new Date(row.week_start), 'MMM d') : '-'}
                    </td>
                    <td className="px-4 py-3 font-medium">{row.hours}h</td>
                    <td className="px-4 py-3">{fmt(row.payRate)}/hr</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmt(row.billRate)}/hr</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">{fmt(row.grossPay)}</td>
                    <td className="px-4 py-3 text-rose-500">{fmt(row.totalDeductions)}</td>
                    <td className="px-4 py-3 font-bold text-primary">{fmt(row.netPay)}</td>
                    <td className="px-4 py-3 text-violet-600">{fmt(row.margin)}</td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" className="h-7 text-xs"
                        onClick={() => { setSelectedEmployee(row); setDetailOpen(true); }}>
                        Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {payrollData.length > 0 && (
              <tfoot className="bg-muted/30 border-t border-border font-semibold">
                <tr>
                  <td className="px-4 py-3" colSpan={2}>TOTALS ({totals.count} employees)</td>
                  <td className="px-4 py-3">{totals.totalHours}h</td>
                  <td className="px-4 py-3" colSpan={2}></td>
                  <td className="px-4 py-3 text-emerald-600">{fmt(totals.totalGross)}</td>
                  <td className="px-4 py-3 text-rose-500">{fmt(totals.totalGross - totals.totalNet)}</td>
                  <td className="px-4 py-3 text-primary">{fmt(totals.totalNet)}</td>
                  <td className="px-4 py-3 text-violet-600">{fmt(totals.totalMargin)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      {/* Run Payroll Confirm Dialog */}
      <Dialog open={runDialogOpen} onOpenChange={setRunDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" /> Confirm Payroll Run
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-sm text-muted-foreground">You are about to process payroll for:</p>
            <div className="bg-muted rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm"><span>Employees</span><span className="font-semibold">{totals.count}</span></div>
              <div className="flex justify-between text-sm"><span>Total Hours</span><span className="font-semibold">{totals.totalHours}h</span></div>
              <div className="flex justify-between text-sm"><span>Gross Pay</span><span className="font-semibold text-emerald-600">{fmt(totals.totalGross)}</span></div>
              <div className="flex justify-between text-sm"><span>Total Net Pay</span><span className="font-semibold text-primary">{fmt(totals.totalNet)}</span></div>
              <div className="flex justify-between text-sm border-t pt-2"><span>Gross Margin</span><span className="font-semibold text-violet-600">{fmt(totals.totalMargin)}</span></div>
            </div>
            <p className="text-xs text-muted-foreground">All approved timesheets will be marked as "Invoiced" after processing.</p>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setRunDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRunPayroll} className="gap-2">
              <Play className="w-4 h-4" /> Process Payroll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      {selectedEmployee && (
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Pay Stub — {selectedEmployee.employee_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-1 text-sm mt-2">
              <div className="flex justify-between py-1 border-b"><span className="text-muted-foreground">Week</span><span>{selectedEmployee.week_start ? format(new Date(selectedEmployee.week_start), 'MMM d, yyyy') : '-'}</span></div>
              <div className="flex justify-between py-1"><span className="text-muted-foreground">Hours Worked</span><span className="font-medium">{selectedEmployee.hours}h</span></div>
              <div className="flex justify-between py-1"><span className="text-muted-foreground">Pay Rate</span><span>{fmt(selectedEmployee.payRate)}/hr</span></div>
              <div className="flex justify-between py-1 border-b"><span className="text-muted-foreground">Bill Rate</span><span>{fmt(selectedEmployee.billRate)}/hr</span></div>
              <div className="flex justify-between py-1 font-semibold text-emerald-600"><span>Gross Pay</span><span>{fmt(selectedEmployee.grossPay)}</span></div>
              <div className="py-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Deductions</p>
                <div className="space-y-1 bg-muted/40 rounded-lg p-3">
                  {[
                    { label: 'Federal Income Tax', value: selectedEmployee.federalTax },
                    { label: 'Social Security (6.2%)', value: selectedEmployee.socialSecurity },
                    { label: 'Medicare (1.45%)', value: selectedEmployee.medicare },
                    { label: 'State Tax (est. 5%)', value: selectedEmployee.stateTax },
                  ].map(d => (
                    <div key={d.label} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{d.label}</span>
                      <span className="text-rose-500">-{fmt(d.value)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-semibold border-t pt-1.5 mt-1">
                    <span>Total Deductions</span>
                    <span className="text-rose-500">-{fmt(selectedEmployee.totalDeductions)}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between py-2 text-base font-bold border-t">
                <span>Net Pay</span>
                <span className="text-primary">{fmt(selectedEmployee.netPay)}</span>
              </div>
              <div className="flex justify-between py-1 text-violet-600 font-medium">
                <span>Gross Margin (Agency)</span>
                <span>{fmt(selectedEmployee.margin)}</span>
              </div>
            </div>
            <DialogFooter className="mt-2">
              <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}