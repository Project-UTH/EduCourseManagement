import apiClient from './apiClient';

/**
 * Material API Service
 * 
 * API calls for class materials
 */

export interface MaterialResponse {
  materialId: number;
  classId: number;
  classCode: string;
  title: string;
  description?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  fileSizeDisplay: string;
  uploadedById: number;
  uploadedByName: string;
  uploadedAt: string;
  updatedAt?: string;
}

class MaterialApi {
  /**
   * Teacher: Upload material
   */
  async uploadMaterial(
    classId: number,
    title: string,
    description: string,
    file: File
  ): Promise<MaterialResponse> {
    const formData = new FormData();
    formData.append('classId', classId.toString());
    formData.append('title', title);
    if (description) {
      formData.append('description', description);
    }
    formData.append('file', file);

    const response = await apiClient.post('/api/teacher/materials', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  }

  /**
   * Teacher: Get materials for class
   */
  async getTeacherMaterials(classId: number): Promise<MaterialResponse[]> {
    const response = await apiClient.get(`/api/teacher/materials/class/${classId}`);
    return response.data.data;
  }

  /**
   * Teacher: Delete material
   */
  async deleteMaterial(materialId: number): Promise<void> {
    await apiClient.delete(`/api/teacher/materials/${materialId}`);
  }

  /**
   * Student: Get materials for class
   */
  async getStudentMaterials(classId: number): Promise<MaterialResponse[]> {
    const response = await apiClient.get(`/api/student/materials/class/${classId}`);
    return response.data.data;
  }

  /**
   * Student: Get material detail
   */
  async getMaterialById(materialId: number): Promise<MaterialResponse> {
    const response = await apiClient.get(`/api/student/materials/${materialId}`);
    return response.data.data;
  }
}

export default new MaterialApi();