
import { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  CellData, 
  CellPosition, 
  SpreadsheetData, 
  SpreadsheetConfig, 
  CellFormatAction, 
  CellRange,
  CellTextAlign
} from './types';
import { evaluateFormula, indicesToCellRef, hasCircularReference } from './formulaParser';
import { toast } from 'sonner';

const DEFAULT_CONFIG: SpreadsheetConfig = {
  rows: 50,
  cols: 26, // A-Z
  defaultColumnWidth: 100,
  defaultRowHeight: 32,
};

export function useSpreadsheet(initialData?: SpreadsheetData, config = DEFAULT_CONFIG) {
  const [data, setData] = useState<SpreadsheetData>(initialData || {});
  const [activeCell, setActiveCell] = useState<CellPosition | null>(null);
  const [selectedRange, setSelectedRange] = useState<CellRange | null>(null);
  const [editing, setEditing] = useState<boolean>(false);
  const [editValue, setEditValue] = useState<string>('');

  // Generate column headers (A, B, C, ..., Z, AA, AB, ...)
  const columnHeaders = useMemo(() => {
    return Array.from({ length: config.cols }, (_, i) => {
      let header = '';
      let num = i;
      
      do {
        header = String.fromCharCode(65 + (num % 26)) + header;
        num = Math.floor(num / 26) - 1;
      } while (num >= 0);
      
      return header;
    });
  }, [config.cols]);

  // Start editing a cell
  const startEditing = useCallback(() => {
    if (!activeCell) return;
    
    const cellKey = indicesToCellRef(activeCell.row, activeCell.col);
    const cellData = data[cellKey];
    
    setEditing(true);
    setEditValue(cellData?.formula || cellData?.value || '');
  }, [activeCell, data]);

  // Stop editing and save the value
  const stopEditing = useCallback((save: boolean = true) => {
    if (!activeCell || !editing) return;
    
    if (save) {
      const cellKey = indicesToCellRef(activeCell.row, activeCell.col);
      
      // Check if the input is a formula
      if (editValue.startsWith('=')) {
        // Check for circular references
        if (hasCircularReference(editValue, data, cellKey)) {
          toast.error('Circular reference detected!');
          return;
        }
        
        // Create a new copy of the data object to ensure React detects the change
        const newData = { ...data };
        
        try {
          // Calculate the formula result
          const formulaResult = evaluateFormula(editValue, newData);
          
          // Update the cell with both the formula and its evaluated value
          newData[cellKey] = {
            ...(newData[cellKey] || {}),
            value: String(formulaResult),
            formula: editValue,
            type: 'formula',
          };
          
          // Re-evaluate cells that might depend on this one
          Object.keys(newData).forEach((key) => {
            if (key !== cellKey && newData[key]?.formula) {
              try {
                newData[key] = {
                  ...newData[key],
                  value: String(evaluateFormula(newData[key].formula!, newData))
                };
              } catch (e) {
                console.error(`Error evaluating formula in ${key}:`, e);
                newData[key] = {
                  ...newData[key],
                  value: '#ERROR!'
                };
              }
            }
          });
          
          // Update state with the new data
          setData(newData);
        } catch (error) {
          console.error('Formula evaluation error:', error);
          toast.error('Invalid formula');
          
          // Still update the cell but mark it as an error
          setData((prevData) => ({
            ...prevData,
            [cellKey]: {
              ...(prevData[cellKey] || {}),
              value: '#ERROR!',
              formula: editValue,
              type: 'formula',
            }
          }));
        }
      } else {
        // Not a formula, just update the value
        const cellType = isNaN(Number(editValue)) ? 'text' : 'number';
        
        setData((prevData) => ({
          ...prevData,
          [cellKey]: {
            ...(prevData[cellKey] || {}),
            value: editValue,
            formula: undefined,
            type: cellType,
          }
        }));
      }
    }
    
    setEditing(false);
    setEditValue('');
  }, [activeCell, editing, editValue, data]);

  // Handle cell selection
  const selectCell = useCallback((position: CellPosition, isShiftKey: boolean = false) => {
    if (editing) {
      stopEditing(true);
    }
    
    if (isShiftKey && activeCell) {
      // Create a selection range
      setSelectedRange({
        start: activeCell,
        end: position,
      });
    } else {
      setActiveCell(position);
      setSelectedRange(null);
    }
  }, [activeCell, editing, stopEditing]);

  // Get cell data by position
  const getCellData = useCallback((row: number, col: number): CellData | undefined => {
    const cellKey = indicesToCellRef(row, col);
    return data[cellKey];
  }, [data]);

  // Format a cell
  const formatCell = useCallback((action: CellFormatAction) => {
    if (!activeCell) return;
    
    const cellKey = indicesToCellRef(activeCell.row, activeCell.col);
    const cellData = data[cellKey] || { value: '' };
    
    const currentFormat = cellData.format || {};
    let newFormat = { ...currentFormat };
    
    switch (action.type) {
      case 'bold':
        newFormat.bold = !newFormat.bold;
        break;
      case 'italic':
        newFormat.italic = !newFormat.italic;
        break;
      case 'underline':
        newFormat.underline = !newFormat.underline;
        break;
      case 'align':
        newFormat.align = action.value as CellTextAlign;
        break;
      case 'color':
        newFormat.color = action.value as string;
        break;
      case 'bgColor':
        newFormat.bgColor = action.value as string;
        break;
    }
    
    setData((prevData) => ({
      ...prevData,
      [cellKey]: {
        ...cellData,
        format: newFormat,
      }
    }));
  }, [activeCell, data]);

  // Check if a cell is selected
  const isCellSelected = useCallback((row: number, col: number): boolean => {
    if (!selectedRange) return false;
    
    const { start, end } = selectedRange;
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);
    
    return (row >= minRow && row <= maxRow && col >= minCol && col <= maxCol);
  }, [selectedRange]);

  // Check if a cell is active
  const isCellActive = useCallback((row: number, col: number): boolean => {
    return !!(activeCell && activeCell.row === row && activeCell.col === col);
  }, [activeCell]);

  // Handle keyboard navigation
  useEffect(() => {
    if (editing) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeCell) return;
      
      // Don't handle if Command/Ctrl key is pressed (to not interfere with browser shortcuts)
      if (e.metaKey || e.ctrlKey) return;
      
      const { row, col } = activeCell;
      
      switch (e.key) {
        case 'ArrowUp':
          if (row > 0) {
            e.preventDefault();
            selectCell({ row: row - 1, col });
          }
          break;
        case 'ArrowDown':
          if (row < config.rows - 1) {
            e.preventDefault();
            selectCell({ row: row + 1, col });
          }
          break;
        case 'ArrowLeft':
          if (col > 0) {
            e.preventDefault();
            selectCell({ row, col: col - 1 });
          }
          break;
        case 'ArrowRight':
          if (col < config.cols - 1) {
            e.preventDefault();
            selectCell({ row, col: col + 1 });
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (e.shiftKey) {
            // Shift+Enter: move up
            if (row > 0) {
              selectCell({ row: row - 1, col });
            }
          } else {
            // Enter: move down
            if (row < config.rows - 1) {
              selectCell({ row: row + 1, col });
            }
          }
          break;
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            // Shift+Tab: move left
            if (col > 0) {
              selectCell({ row, col: col - 1 });
            } else if (row > 0) {
              // Wrap to previous row
              selectCell({ row: row - 1, col: config.cols - 1 });
            }
          } else {
            // Tab: move right
            if (col < config.cols - 1) {
              selectCell({ row, col: col + 1 });
            } else if (row < config.rows - 1) {
              // Wrap to next row
              selectCell({ row: row + 1, col: 0 });
            }
          }
          break;
        case 'F2':
        case 'Enter':
          e.preventDefault();
          startEditing();
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          if (selectedRange) {
            // Clear all cells in the range
            const { start, end } = selectedRange;
            const minRow = Math.min(start.row, end.row);
            const maxRow = Math.max(start.row, end.row);
            const minCol = Math.min(start.col, end.col);
            const maxCol = Math.max(start.col, end.col);
            
            const newData = { ...data };
            
            for (let r = minRow; r <= maxRow; r++) {
              for (let c = minCol; c <= maxCol; c++) {
                const cellKey = indicesToCellRef(r, c);
                if (newData[cellKey]) {
                  delete newData[cellKey];
                }
              }
            }
            
            setData(newData);
          } else if (activeCell) {
            // Clear just the active cell
            const cellKey = indicesToCellRef(activeCell.row, activeCell.col);
            const newData = { ...data };
            
            if (newData[cellKey]) {
              delete newData[cellKey];
              setData(newData);
            }
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCell, config.cols, config.rows, data, editing, selectCell, selectedRange, startEditing]);

  return {
    data,
    setData,
    activeCell,
    selectedRange,
    selectCell,
    editing,
    editValue,
    setEditValue,
    startEditing,
    stopEditing,
    formatCell,
    columnHeaders,
    getCellData,
    isCellSelected,
    isCellActive,
    config,
  };
}
