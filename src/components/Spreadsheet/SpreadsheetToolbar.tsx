
import React from 'react';
import { TooltipButton } from '@/components/ui/tooltip-button';
import { Separator } from '@/components/ui/separator';
import { 
  AlignCenter, 
  AlignLeft, 
  AlignRight, 
  Bold, 
  Italic, 
  Underline,
  Save,
  FileSpreadsheet,
  DownloadCloud,
  UploadCloud,
  Calculator
} from 'lucide-react';
import { CellPosition } from './types';
import { indicesToCellRef } from './formulaParser';

interface SpreadsheetToolbarProps {
  activeCell: CellPosition | null;
  onFormat: (type: 'bold' | 'italic' | 'underline' | 'align', value?: any) => void;
  onSave?: () => void;
  onExport?: () => void;
  onImport?: () => void;
}

export const SpreadsheetToolbar: React.FC<SpreadsheetToolbarProps> = ({
  activeCell,
  onFormat,
  onSave,
  onExport,
  onImport,
}) => {
  // Get the active cell reference (e.g., A1, B2)
  const activeCellRef = activeCell 
    ? indicesToCellRef(activeCell.row, activeCell.col) 
    : '';
  
  return (
    <div className="flex items-center p-2 border-b bg-white shadow-toolbar sticky top-0 z-30">
      <div className="flex items-center">
        <FileSpreadsheet className="w-5 h-5 text-primary mr-2" />
        <span className="font-medium text-sm">Spreadsheet</span>
      </div>

      <Separator orientation="vertical" className="toolbar-separator mx-4" />
      
      {activeCell && (
        <div className="flex items-center bg-muted/30 px-2 py-1 rounded text-sm text-muted-foreground">
          <Calculator className="w-4 h-4 mr-1" />
          <span>{activeCellRef}</span>
        </div>
      )}
      
      <div className="flex-grow"></div>
      
      <div className="flex items-center">
        <TooltipButton
          tooltip="Bold"
          onClick={() => onFormat('bold')}
          className="w-9 h-9 p-0"
        >
          <Bold className="w-4 h-4" />
        </TooltipButton>
        
        <TooltipButton
          tooltip="Italic"
          onClick={() => onFormat('italic')}
          className="w-9 h-9 p-0"
        >
          <Italic className="w-4 h-4" />
        </TooltipButton>
        
        <TooltipButton
          tooltip="Underline"
          onClick={() => onFormat('underline')}
          className="w-9 h-9 p-0"
        >
          <Underline className="w-4 h-4" />
        </TooltipButton>
        
        <Separator orientation="vertical" className="toolbar-separator" />
        
        <TooltipButton
          tooltip="Align Left"
          onClick={() => onFormat('align', 'left')}
          className="w-9 h-9 p-0"
        >
          <AlignLeft className="w-4 h-4" />
        </TooltipButton>
        
        <TooltipButton
          tooltip="Align Center"
          onClick={() => onFormat('align', 'center')}
          className="w-9 h-9 p-0"
        >
          <AlignCenter className="w-4 h-4" />
        </TooltipButton>
        
        <TooltipButton
          tooltip="Align Right"
          onClick={() => onFormat('align', 'right')}
          className="w-9 h-9 p-0"
        >
          <AlignRight className="w-4 h-4" />
        </TooltipButton>
        
        <Separator orientation="vertical" className="toolbar-separator" />
        
        {onSave && (
          <TooltipButton
            tooltip="Save"
            onClick={onSave}
            className="w-9 h-9 p-0"
          >
            <Save className="w-4 h-4" />
          </TooltipButton>
        )}
        
        {onExport && (
          <TooltipButton
            tooltip="Export"
            onClick={onExport}
            className="w-9 h-9 p-0"
          >
            <DownloadCloud className="w-4 h-4" />
          </TooltipButton>
        )}
        
        {onImport && (
          <TooltipButton
            tooltip="Import"
            onClick={onImport}
            className="w-9 h-9 p-0"
          >
            <UploadCloud className="w-4 h-4" />
          </TooltipButton>
        )}
      </div>
    </div>
  );
};
