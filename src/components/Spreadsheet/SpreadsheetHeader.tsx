
import React from 'react';

interface SpreadsheetHeaderProps {
  columnHeaders: string[];
  rows: number;
}

export const SpreadsheetHeader: React.FC<SpreadsheetHeaderProps> = ({
  columnHeaders,
  rows
}) => {
  return (
    <>
      {/* Corner cell (top-left empty cell) */}
      <div className="spreadsheet-corner sticky top-0 left-0 z-20" />
      
      {/* Column headers (A, B, C, ...) */}
      <div className="flex sticky top-0 z-10">
        {columnHeaders.map((header, index) => (
          <div key={`col-${index}`} className="spreadsheet-header-cell">
            {header}
          </div>
        ))}
      </div>
      
      {/* Row headers (1, 2, 3, ...) */}
      <div className="flex flex-col sticky left-0 z-10">
        {Array.from({ length: rows }, (_, i) => (
          <div key={`row-${i}`} className="spreadsheet-row-header">
            {i + 1}
          </div>
        ))}
      </div>
    </>
  );
};
