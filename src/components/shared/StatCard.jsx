import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function StatCard({ title, value, icon: Icon, trend, trendLabel, className }) {
  return (
    <Card className={cn("p-5 relative overflow-hidden", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-1 tracking-tight">{value}</p>
          {trend !== undefined && (
            <p className={cn(
              "text-xs font-medium mt-2",
              trend >= 0 ? "text-accent" : "text-destructive"
            )}>
              {trend >= 0 ? '+' : ''}{trend}% {trendLabel || 'vs last month'}
            </p>
          )}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>
    </Card>
  );
}