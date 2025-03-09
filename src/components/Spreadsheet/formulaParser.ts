import { SpreadsheetData } from './types';

// Convert A1 notation to row and column indices
export function cellRefToIndices(cellRef: string): { row: number; col: number } {
  const match = cellRef.match(/([A-Z]+)([0-9]+)/);
  if (!match) {
    throw new Error(`Invalid cell reference: ${cellRef}`);
  }
  
  const colStr = match[1];
  const rowStr = match[2];
  
  // Convert column reference (A, B, C...) to number (0, 1, 2...)
  let colNum = 0;
  for (let i = 0; i < colStr.length; i++) {
    colNum = colNum * 26 + (colStr.charCodeAt(i) - 64);
  }
  
  return {
    row: parseInt(rowStr, 10) - 1, // Rows are 1-indexed in A1 notation
    col: colNum - 1 // Cols are 0-indexed in our system
  };
}

// Convert row and column indices to A1 notation
export function indicesToCellRef(row: number, col: number): string {
  let colStr = '';
  
  let n = col + 1;
  while (n > 0) {
    const remainder = (n - 1) % 26;
    colStr = String.fromCharCode(65 + remainder) + colStr;
    n = Math.floor((n - 1) / 26);
  }
  
  return `${colStr}${row + 1}`;
}

// Parse and evaluate formula expressions
export function evaluateFormula(formula: string, data: SpreadsheetData): string | number {
  if (!formula.startsWith('=')) {
    return formula;
  }
  
  // Remove the "=" prefix
  const expression = formula.substring(1).trim();
  
  try {
    // Handle cell references like A1, B2, etc.
    const cellRefPattern = /([A-Z]+[0-9]+)/g;
    const evaluatedExpression = expression.replace(cellRefPattern, (match) => {
      const { row, col } = cellRefToIndices(match);
      const cellKey = indicesToCellRef(row, col);
      
      if (data[cellKey] && data[cellKey].value !== undefined) {
        // If the referenced cell contains a number, return it as is
        const cellValue = data[cellKey].value;
        if (!isNaN(Number(cellValue))) {
          return cellValue;
        }
        // Otherwise, wrap it in quotes for string literals
        return `"${cellValue}"`;
      }
      
      return '0'; // Return 0 for empty or undefined cells
    });
    
    // Use Function constructor to evaluate the expression
    // This is safe for a simple spreadsheet app, but would need more security in production
    const result = new Function(`return ${evaluatedExpression}`)();
    return result;
  } catch (error) {
    console.error('Formula evaluation error:', error);
    return '#ERROR!';
  }
}

// Check if a formula contains circular references
export function hasCircularReference(
  formula: string,
  data: SpreadsheetData,
  currentCellRef: string,
  visited: Set<string> = new Set()
): boolean {
  if (!formula.startsWith('=')) {
    return false;
  }
  
  if (visited.has(currentCellRef)) {
    return true;
  }
  
  visited.add(currentCellRef);
  
  const expression = formula.substring(1).trim();
  const cellRefPattern = /([A-Z]+[0-9]+)/g;
  const cellRefs = expression.match(cellRefPattern) || [];
  
  for (const cellRef of cellRefs) {
    if (cellRef === currentCellRef) {
      return true;
    }
    
    const referencedCell = data[cellRef];
    if (referencedCell && referencedCell.formula) {
      if (hasCircularReference(referencedCell.formula, data, currentCellRef, visited)) {
        return true;
      }
    }
  }
  
  visited.delete(currentCellRef);
  return false;
}
