// src/components/ui/button.jsx
import React from 'react';
import { cn } from '@/lib/utils';

export const buttonVariants = {
  default: 'px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300',
};

export function Button({ variant = 'default', className, ...props }) {
  return <button className={cn(buttonVariants[variant], className)} {...props} />;
}