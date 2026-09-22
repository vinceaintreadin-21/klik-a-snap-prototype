import api from "./api";
import axios from "axios";
import type { ExportOrder } from "../components/exports/exportTypes";

export async function fetchExportOrders(): Promise<ExportOrder[]> {
  const response = await api.get<ExportOrder[]>('/api/orders/');
  return response.data;
}

export async function downloadOrderZip(orderId: string): Promise<void> {
  try {
    const response = await api.get(`/api/orders/${orderId}/download-id-cards/`, {
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