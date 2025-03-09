
import React, { useState } from 'react';
import { SpreadsheetGrid } from '@/components/Spreadsheet/SpreadsheetGrid';
import { CellTextAlign } from '@/components/Spreadsheet/types';

const Index = () => {
  // Sample initial data with properly typed align properties
  const sampleData = {
    'A1': { value: 'Product', format: { bold: true, align: 'center' as CellTextAlign } },
    'B1': { value: 'Quantity', format: { bold: true, align: 'center' as CellTextAlign } },
    'C1': { value: 'Price', format: { bold: true, align: 'center' as CellTextAlign } },
    'D1': { value: 'Total', format: { bold: true, align: 'center' as CellTextAlign } },
    'A2': { value: 'Apple' },
    'B2': { value: '5', type: 'number' as 'number' },
    'C2': { value: '1.20', type: 'number' as 'number' },
    'D2': { value: '6.00', formula: '=B2*C2', type: 'formula' as 'formula' },
    'A3': { value: 'Orange' },
    'B3': { value: '3', type: 'number' as 'number' },
    'C3': { value: '0.80', type: 'number' as 'number' },
    'D3': { value: '2.40', formula: '=B3*C3', type: 'formula' as 'formula' },
    'A4': { value: 'Banana' },
    'B4': { value: '2', type: 'number' as 'number' },
    'C4': { value: '0.60', type: 'number' as 'number' },
    'D4': { value: '1.20', formula: '=B4*C4', type: 'formula' as 'formula' },
    'D5': { value: '9.60', formula: '=D2+D3+D4', type: 'formula' as 'formula', format: { bold: true } }
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="h-screen flex flex-col">
        <h1 className="text-xl font-semibold p-4 border-b">Spreadsheet App</h1>
        <div className="flex-grow overflow-auto">
          <SpreadsheetGrid initialData={sampleData} rows={50} columns={20} />
        </div>
      </div>
    </div>
  );
};

export default Index;
