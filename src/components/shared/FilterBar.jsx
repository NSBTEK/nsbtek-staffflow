import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Reusable filter bar for all list pages.
 * Props:
 *   search, onSearch       — search input
 *   filters                — array of { key, label, options: [{value, label}] }
 *   filterValues           — { [key]: value }
 *   onFilterChange         — (key, value) => void
 *   sortOptions            — array of { value, label }
 *   sortValue, onSortChange
 *   onClear                — clear all filters
 */
export default function FilterBar({
  search, onSearch,
  filters = [],
  filterValues = {},
  onFilterChange,
  sortOptions = [],
  sortValue, onSortChange,
  onClear,
  className
}) {
  const hasActive = search || sortValue ||
    Object.values(filterValues).some(v => v && v !== 'all');

  return (
    <div className={cn("flex flex-wrap items-center gap-2 mb-4", className)}>
      {onSearch !== undefined && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={e => onSearch(e.target.value)}
            className="pl-8 h-8 w-[200px] text-sm bg-background"
          />
        </div>
      )}

      {filters.map(f => (
        <Select
          key={f.key}
          value={filterValues[f.key] || 'all'}
          onValueChange={v => onFilterChange(f.key, v)}
        >
          <SelectTrigger className="h-8 text-xs w-auto min-w-[120px] bg-background">
            <SelectValue placeholder={f.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {f.label}</SelectItem>
            {f.options.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {sortOptions.length > 0 && (
        <Select value={sortValue || ''} onValueChange={onSortChange}>
          <SelectTrigger className="h-8 text-xs w-auto min-w-[140px] bg-background">
            <ArrowUpDown className="w-3 h-3 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {hasActive && onClear && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}