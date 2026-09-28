import Papa from 'papaparse';

export const parseCSV = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error),
    });
  });
};

export const validateStudentRow = (row: any) => {
  const errors: string[] = [];
  if (!row.name?.trim()) errors.push("Missing Name");
  if (!row.student_id?.trim()) errors.push("Missing ID");
  if (!row.grade?.trim()) errors.push("Missing Grade");
  return {
    isValid: errors.length === 0,
    errors,
    data: {
      name: row.name?.trim(),
      student_id: row.student_id?.trim(),
      grade: row.grade?.trim(),
    }
  };
};