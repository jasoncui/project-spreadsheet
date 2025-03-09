
export interface CellData {
  value: string;
  formula?: string;
  type?: 'text' | 'number' | 'date' | 'boolean' | 'formula';
  format?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    align?: 'left' | 'center' | 'right';
    color?: string;
    bgColor?: string;
  };
}

export interface SpreadsheetData {
  [key: string]: CellData;
}

export interface CellPosition {
  row: number;
  col: number;
}

export interface CellRange {
  start: CellPosition;
  end: CellPosition;
}

export interface SpreadsheetConfig {
  rows: number;
  cols: number;
  defaultColumnWidth: number;
  defaultRowHeight: number;
}

export type CellTextAlign = 'left' | 'center' | 'right';

export interface CellFormatAction {
  type: 'bold' | 'italic' | 'underline' | 'align' | 'color' | 'bgColor';
  value?: any;
}
