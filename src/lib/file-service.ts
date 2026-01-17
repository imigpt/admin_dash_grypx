import { api } from './api';

// File Upload Service
export const fileService = {
  // Upload image
  async uploadImage(file: File): Promise<{ success: boolean; filename: string; fileUrl: string; fileSize: number }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${api.baseUrl}/api/files/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    return response.json();
  },

  // Get file URL
  getFileUrl(filename: string): string {
    return `${api.baseUrl}/api/files/${filename}`;
  },

  // Delete file
  async deleteFile(filename: string): Promise<{ success: boolean; message: string }> {
    return api.delete(`/api/files/${filename}`);
  }
};
