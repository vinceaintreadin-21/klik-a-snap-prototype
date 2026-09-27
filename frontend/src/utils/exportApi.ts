import api from "./api";
import axios from "axios";
import type { ExportOrder, ExportStudent } from "../components/exports/exportTypes";

export async function fetchExportOrders(): Promise<ExportOrder[]> {
  const response = await api.get<ExportOrder[]>('/orders/');
  return response.data;
}

export async function fetchOrderStudents(orderId: string | number): Promise<ExportStudent[]> {
  // Use existing client so auth headers and base URLs are applied automatically
  const response = await api.get(`/orders/${orderId}/students/`); 
  const data = response.data;

  return data.map((student: any) => ({
    ...student,
    processed_photo: student.processed_photo_url || student.processed_photo || null,
    section: student.section || "",
    processed_photo_back: student.processed_photo_back || null,
    qr_code_data: student.qr_code_data || null,
    qr_code_url: student.qr_code_url || null,
    is_photographed: student.is_photographed ?? true,
    created_at: student.created_at || "",
    updated_at: student.updated_at || "",
    extra_data: student.extra_data || {},
  }));
}

export async function downloadOrderZip(orderId: string): Promise<void> {
  try {
    const response = await api.get(`orders/${orderId}/id-cards/download/`, {
      responseType: 'blob',
    });

    // Extract filename from response headers or fallback
    const contentDisposition = response.headers['content-disposition'];
    let fileName = `id_cards_order_${orderId}.zip`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) fileName = match[1];
    }

    // Trigger browser file save
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    // When responseType is 'blob', Axios returns error response data as a Blob.
    // We must parse the Blob to read Django's error message JSON.
    if (error.response?.data instanceof Blob) {
      const errorText = await error.response.data.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.error || 'Failed to download ZIP archive.');
      } catch (_) {
        throw new Error(errorText || 'Failed to download ZIP archive.');
      }
    }
    throw error;
  }
}

export async function downloadStudentPhoto(photoUrl: string, filename: string): Promise<void> {
  try {
    // Standard axios call without auth header to prevent CORS issues with CDN/Cloudinary URLs
    const response = await axios.get(photoUrl, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(`Failed to download photo: ${filename}`);
  }
}