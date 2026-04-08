import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DataTable({ columns, data, isLoading, onRowClick, emptyMessage }) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (col) => {
    if (!col.sortKey) return;
    if (sortCol === col.sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col.sortKey);
      setSortDir('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortCol) return data;
    return [...data].sort((a, b) => {
      const av = a[sortCol] ?? '';
      const bv = b[sortCol] ?? '';
      const cmp = typeof av === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortCol, sortDir]);

  const renderSortIcon = (col) => {
    if (!col.sortKey) return null;
    if (sortCol !== col.sortKey) return <ChevronsUpDown className="w-3 h-3 ml-1 text-muted-foreground/50" />;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1 text-primary" />
      : <ArrowDown className="w-3 h-3 ml-1 text-primary" />;
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {columns.map((col, i) => (
                <TableHead key={i} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 py-3">
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(5).fill(0).map((_, i) => (
              <TableRow key={i} className="border-b border-border/50">
                {columns.map((_, j) => (
                  <TableCell key={j} className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border">
              {columns.map((col, i) => (
                <TableHead
                  key={i}
                  onClick={() => handleSort(col)}
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 py-3 select-none",
                    col.sortKey && "cursor-pointer hover:text-foreground"
                  )}
                >
                  <div className="flex items-center">
                    {col.header}
                    {renderSortIcon(col)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-14 text-muted-foreground text-sm">
                  {emptyMessage || 'No data found'}
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row, i) => (
                <TableRow
                  key={row.id || i}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "border-b border-border/50 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-muted/30"
                  )}
                >
                  {columns.map((col, j) => (
                    <TableCell key={j} className="text-sm py-3">
                      {col.render ? col.render(row) : row[col.accessor]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}