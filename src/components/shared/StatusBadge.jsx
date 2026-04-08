import React from 'react';
import { cn } from '@/lib/utils';

const statusStyles = {
  // Job
  open: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  on_hold: 'bg-amber-50 text-amber-700 ring-amber-200',
  filled: 'bg-sky-50 text-sky-700 ring-sky-200',
  cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
  closed: 'bg-slate-100 text-slate-500 ring-slate-200',
  // Candidate
  new: 'bg-violet-50 text-violet-700 ring-violet-200',
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  passive: 'bg-amber-50 text-amber-700 ring-amber-200',
  placed: 'bg-sky-50 text-sky-700 ring-sky-200',
  do_not_contact: 'bg-rose-50 text-rose-700 ring-rose-200',
  blacklisted: 'bg-rose-50 text-rose-700 ring-rose-200',
  // Submission
  submitted: 'bg-violet-50 text-violet-700 ring-violet-200',
  client_review: 'bg-amber-50 text-amber-700 ring-amber-200',
  interview_scheduled: 'bg-sky-50 text-sky-700 ring-sky-200',
  interview_completed: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  offered: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  accepted: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-200',
  withdrawn: 'bg-slate-100 text-slate-500 ring-slate-200',
  // Interview
  scheduled: 'bg-sky-50 text-sky-700 ring-sky-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  no_show: 'bg-rose-50 text-rose-700 ring-rose-200',
  rescheduled: 'bg-amber-50 text-amber-700 ring-amber-200',
  // Activity
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  in_progress: 'bg-sky-50 text-sky-700 ring-sky-200',
  blocked: 'bg-rose-50 text-rose-700 ring-rose-200',
  // Placement / Timesheet / Expense / Contract
  terminated: 'bg-rose-50 text-rose-700 ring-rose-200',
  draft: 'bg-slate-100 text-slate-500 ring-slate-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  invoiced: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  reimbursed: 'bg-teal-50 text-teal-700 ring-teal-200',
  sent: 'bg-sky-50 text-sky-700 ring-sky-200',
  signed: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  expired: 'bg-slate-100 text-slate-500 ring-slate-200',
  // Client
  prospect: 'bg-violet-50 text-violet-700 ring-violet-200',
  inactive: 'bg-slate-100 text-slate-500 ring-slate-200',
  lost: 'bg-rose-50 text-rose-700 ring-rose-200',
  // Priority
  low: 'bg-slate-100 text-slate-500 ring-slate-200',
  medium: 'bg-amber-50 text-amber-700 ring-amber-200',
  high: 'bg-orange-50 text-orange-700 ring-orange-200',
  urgent: 'bg-rose-50 text-rose-700 ring-rose-200',
  // Job type / Contract type / Source
  full_time: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  part_time: 'bg-violet-50 text-violet-700 ring-violet-200',
  contract: 'bg-sky-50 text-sky-700 ring-sky-200',
  contract_to_hire: 'bg-teal-50 text-teal-700 ring-teal-200',
  temporary: 'bg-amber-50 text-amber-700 ring-amber-200',
  permanent: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  w2: 'bg-sky-50 text-sky-700 ring-sky-200',
  '1099': 'bg-amber-50 text-amber-700 ring-amber-200',
  c2c: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  // Leave types
  vacation: 'bg-sky-50 text-sky-700 ring-sky-200',
  sick: 'bg-rose-50 text-rose-700 ring-rose-200',
  personal: 'bg-violet-50 text-violet-700 ring-violet-200',
  maternity: 'bg-pink-50 text-pink-700 ring-pink-200',
  paternity: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  unpaid: 'bg-slate-100 text-slate-500 ring-slate-200',
  // net terms
  net_15: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  net_30: 'bg-sky-50 text-sky-700 ring-sky-200',
  net_45: 'bg-amber-50 text-amber-700 ring-amber-200',
  net_60: 'bg-rose-50 text-rose-700 ring-rose-200',
  // Expense category
  travel: 'bg-sky-50 text-sky-700 ring-sky-200',
  meals: 'bg-orange-50 text-orange-700 ring-orange-200',
  equipment: 'bg-violet-50 text-violet-700 ring-violet-200',
  training: 'bg-teal-50 text-teal-700 ring-teal-200',
  accommodation: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  communication: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  other: 'bg-slate-100 text-slate-500 ring-slate-200',
};

export default function StatusBadge({ status }) {
  if (!status) return null;
  const style = statusStyles[status] || 'bg-slate-100 text-slate-500 ring-slate-200';
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ring-1 ring-inset whitespace-nowrap',
      style
    )}>
      {label}
    </span>
  );
}