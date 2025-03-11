
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
  const [skipEditOnNextSelection, setSkipEditOnNextSelection] = useState<boolean>(false);

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

  const startEditing = useCallback(() => {
    if (!activeCell || skipEditOnNextSelection) {
      setSkipEditOnNextSelection(false);
      return;
    }
    
    const cellKey = indicesToCellRef(activeCell.row, activeCell.col);
    const cellData = data[cellKey];
    
    setEditing(true);
    setEditValue(cellData?.formula || cellData?.value || '');
  }, [activeCell, data, skipEditOnNextSelection]);

  const stopEditing = useCallback((save: boolean = true) => {
    if (!activeCell || !editing) return;
    
    if (save) {
      const cellKey = indicesToCellRef(activeCell.row, activeCell.col);
      
      if (editValue.startsWith('=')) {
        // Check for circular references directly in the current cell's context
        if (hasCircularReference(editValue, data, cellKey)) {
          toast.error('Circular reference detected!');
          // Don't save the formula if it has circular references,
          // but still exit editing mode
          setEditing(false);
          setEditValue('');
          return;
        }
        
        const newData = { ...data };
        
        try {
          const formulaResult = evaluateFormula(editValue, newData);
          
          newData[cellKey] = {
            ...(newData[cellKey] || {}),
            value: String(formulaResult),
            formula: editValue,
            type: 'formula',
          };
          
          // Recalculate dependent cells
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
          
          setData(newData);
        } catch (error) {
          console.error('Formula evaluation error:', error);
          toast.error('Invalid formula');
          
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

  const selectCell = useCallback((position: CellPosition, isShiftKey: boolean = false) => {
    if (editing) {
      stopEditing(true);
    }
    
    if (isShiftKey && activeCell) {
      setSelectedRange({
        start: activeCell,
        end: position,
      });
    } else {
      setActiveCell(position);
      setSelectedRange(null);
    }
  }, [activeCell, editing, stopEditing]);

  const moveSelection = useCallback((direction: 'up' | 'down') => {
    if (!activeCell) return;
    
    const { row, col } = activeCell;
    
    setSkipEditOnNextSelection(true);
    
    if (direction === 'up' && row > 0) {
      selectCell({ row: row - 1, col });
    } else if (direction === 'down' && row < config.rows - 1) {
      selectCell({ row: row + 1, col });
    }
  }, [activeCell, config.rows, selectCell]);

  const getCellData = useCallback((row: number, col: number): CellData | undefined => {
    const cellKey = indicesToCellRef(row, col);
    return data[cellKey];
  }, [data]);

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

  const isCellSelected = useCallback((row: number, col: number): boolean => {
    if (!selectedRange) return false;
    
    const { start, end } = selectedRange;
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);
    
    return (row >= minRow && row <= maxRow && col >= minCol && col <= maxCol);
  }, [selectedRange]);

  const isCellActive = useCallback((row: number, col: number): boolean => {
    return !!(activeCell && activeCell.row === row && activeCell.col === col);
  }, [activeCell]);

  useEffect(() => {
    if (editing) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeCell) return;
      
      if (e.metaKey || e.ctrlKey) return;
      
      const { row, col } = activeCell;
      
      if (e.key.length === 1 && !editing) {
        e.preventDefault();
        setEditValue(e.key);
        startEditing();
        return;
      }
      
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
            if (row > 0) {
              setSkipEditOnNextSelection(true);
              selectCell({ row: row - 1, col });
            }
          } else {
            startEditing();
          }
          break;
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            if (col > 0) {
              selectCell({ row, col: col - 1 });
            } else if (row > 0) {
              selectCell({ row: row - 1, col: config.cols - 1 });
            }
          } else {
            if (col < config.cols - 1) {
              selectCell({ row, col: col + 1 });
            } else if (row < config.rows - 1) {
              selectCell({ row: row + 1, col: 0 });
            }
          }
          break;
        case 'F2':
          e.preventDefault();
          startEditing();
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          if (selectedRange) {
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
    moveSelection,
  };
}
