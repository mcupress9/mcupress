import React from 'react';
import { getStockStatus } from '../services/storage';

interface StockBadgeProps {
  quantity: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StockBadge: React.FC<StockBadgeProps> = ({ quantity, showIcon = true, size = 'md' }) => {
  const status = getStockStatus(quantity);

  let badgeStyle = '';
  let dotColor = '';
  let label = '';

  switch (status) {
    case 'in_stock':
      badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      dotColor = 'bg-emerald-500';
      label = 'มีสินค้า';
      break;
    case 'low_stock':
      badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200/80';
      dotColor = 'bg-amber-500 animate-pulse';
      label = 'ใกล้หมด';
      break;
    case 'out_of_stock':
      badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200/80';
      dotColor = 'bg-rose-500';
      label = 'หมดสต๊อก';
      break;
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5 font-semibold',
    md: 'text-xs px-3 py-1 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 font-bold',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border whitespace-nowrap tracking-tight ${badgeStyle} ${sizeClasses}`}
    >
      {showIcon && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
      <span>{label}</span>
    </span>
  );
};
