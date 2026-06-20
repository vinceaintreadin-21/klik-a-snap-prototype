import api from "./api";

export interface ParsedStudent {
    name: string;
    student_id: string;
    grade: string;
    section: string;
}

export interface ParseFileResponse {
    rows: ParsedStudent[]
    sheets: string[]
    total_rows: number;
    file_name: string;
}

export const parseOrderFile = async (file: File): Promise<ParseFileResponse> => {
    const formData = new FormData()
    formData.append('file', file)

    const res = await api.post('/orders/parse-file/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })

    return res.data
}

export const parseOrderFileWithSheet = async (file: File, sheetName: string): Promise<ParseFileResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('sheet_name', sheetName)

    const res = await api.post('/orders/parse-file/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })

    return res.data
}

export const isValidFileType = (file: File): boolean => {
  const validTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  const validExtensions = /\.(csv|xlsx|xls)$/i;

  return validTypes.includes(file.type) || validExtensions.test(file.name);
};