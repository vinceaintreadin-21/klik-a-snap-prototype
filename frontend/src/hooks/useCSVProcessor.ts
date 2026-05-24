import { useState } from 'react';
import { parseCSV, validateStudentRow } from '../utils/csvHelpers';

export const useCSVProcessor = () => {
  const [validData, setValidData] = useState<any[]>([]);
  const [errorList, setErrorList] = useState<string[]>([]);

  const processFile = async (file: File) => {
    try {
      const rawData = await parseCSV(file);
      const cleanRows: any[] = [];
      const validationErrors: string[] = [];

      rawData.forEach((row, index) => {
        const result = validateStudentRow(row);
        if (result.isValid) {
          cleanRows.push(result.data);
        } else {
          validationErrors.push(`Row ${index + 1}: ${result.errors.join(', ')}`);
        }
      });

      setValidData(cleanRows);
      setErrorList(validationErrors);
    } catch (err) {
      setErrorList(["Failed to read file format."]);
    }
  };

  return { processFile, validData, errorList, reset: () => setValidData([]) };
};