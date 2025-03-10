
import React, { useRef, useEffect } from 'react';
import { CellData } from './types';
import { cn } from '@/lib/utils';

interface CellProps {
  row: number;
  col: number;
  data?: CellData;
  isSelected: boolean;
  isActive: boolean;
  isEditing: boolean;
  editValue: string;
  onSelect: (row: number, col: number, isShiftKey: boolean) => void;
  onDoubleClick: () => void;
  onEditValueChange: (value: string) => void;
  onStopEditing: (save: boolean) => void;
}

export const Cell: React.FC<CellProps> = ({
  row,
  col,
  data,
  isSelected,
  isActive,
  isEditing,
  editValue,
  onSelect,
  onDoubleClick,
  onEditValueChange,
  onStopEditing,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus the input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  // Apply cell formatting
  const cellStyle: React.CSSProperties = {
    textAlign: data?.format?.align || 'left',
    fontWeight: data?.format?.bold ? 'bold' : 'normal',
    fontStyle: data?.format?.italic ? 'italic' : 'normal',
    textDecoration: data?.format?.underline ? 'underline' : 'none',
    color: data?.format?.color || '',
    backgroundColor: data?.format?.bgColor || '',
  };
  
  // Handle cell click
  const handleClick = (e: React.MouseEvent) => {
    onSelect(row, col, e.shiftKey);
  };
  
  // Handle key events in edit input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur(); // Force the input to lose focus
      onStopEditing(true); // Finalize editing and save the value
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onStopEditing(false);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      onStopEditing(true);
      // The tab navigation is handled by the parent component
    }
  };
  
  return (
    <div
      className={cn(
        'spreadsheet-cell',
        isSelected && 'spreadsheet-cell-selected',
        isActive && 'spreadsheet-cell-active',
        isActive && isEditing && 'shadow-cell-focus'
      )}
      style={cellStyle}
      onClick={handleClick}
      onDoubleClick={onDoubleClick}
      data-row={row}
      data-col={col}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          className="absolute inset-0 w-full h-full p-1 outline-none border-none bg-white z-10"
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => onStopEditing(true)}
        />
      ) : (
        <div className="truncate">{data?.value || ''}</div>
      )}
    </div>
  );
};
