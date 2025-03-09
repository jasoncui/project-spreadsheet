
import React, { useRef, useState } from 'react';
import { useSpreadsheet } from './useSpreadsheet';
import { SpreadsheetHeader } from './SpreadsheetHeader';
import { Cell } from './Cell';
import { SpreadsheetToolbar } from './SpreadsheetToolbar';
import { SpreadsheetData, CellFormatAction } from './types';
import { toast } from 'sonner';

interface SpreadsheetGridProps {
  initialData?: SpreadsheetData;
  rows?: number;
  columns?: number;
}

export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  initialData,
  rows = 50,
  columns = 26,
}) => {
  const spreadsheetRef = useRef<HTMLDivElement>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  
  const {
    data,
    setData,
    activeCell,
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
  } = useSpreadsheet(initialData, {
    rows,
    cols: columns,
    defaultColumnWidth: 100,
    defaultRowHeight: 32,
  });
  
  // Handle format actions from toolbar
  const handleFormat = (type: string, value?: any) => {
    formatCell({ type, value } as CellFormatAction);
  };
  
  // Export data as JSON
  const handleExport = () => {
    try {
      const jsonData = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'spreadsheet_data.json';
      document.body.appendChild(link);
      link.click();
      
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    }
  };
  
  // Import data from JSON
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement)?.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target?.result as string);
          setData(importedData);
          toast.success('Data imported successfully!');
        } catch (error) {
          console.error('Import failed:', error);
          toast.error('Failed to import data. Invalid file format.');
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  };
  
  return (
    <div className="flex flex-col h-full">
      <SpreadsheetToolbar
        activeCell={activeCell}
        onFormat={handleFormat}
        onExport={handleExport}
        onImport={handleImport}
      />
      
      <div 
        ref={spreadsheetRef}
        className="flex-grow overflow-auto relative"
        style={{ height: 'calc(100vh - 66px)' }}
      >
        <div className="flex">
          <SpreadsheetHeader 
            columnHeaders={columnHeaders} 
            rows={config.rows}
          />
          
          <div className="flex flex-col">
            {Array.from({ length: config.rows }, (_, rowIndex) => (
              <div key={`row-${rowIndex}`} className="flex">
                {Array.from({ length: config.cols }, (_, colIndex) => {
                  const cellData = getCellData(rowIndex, colIndex);
                  const isSelected = isCellSelected(rowIndex, colIndex);
                  const isActive = isCellActive(rowIndex, colIndex);
                  const isEditing = editing && isActive;
                  
                  return (
                    <Cell
                      key={`cell-${rowIndex}-${colIndex}`}
                      row={rowIndex}
                      col={colIndex}
                      data={cellData}
                      isSelected={isSelected}
                      isActive={isActive}
                      isEditing={isEditing}
                      editValue={editValue}
                      onSelect={(row, col, isShiftKey) => selectCell({ row, col }, isShiftKey)}
                      onDoubleClick={startEditing}
                      onEditValueChange={setEditValue}
                      onStopEditing={stopEditing}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
