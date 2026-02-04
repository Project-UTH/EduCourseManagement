import { useState, useEffect } from 'react';
import materialApi, { MaterialResponse } from '../../../services/api/materialApi';

/**
 * MaterialsTab - Tab tài liệu trong ClassDetail (Student)
 * 
 * FIXED: Load real materials from API
 * FIXED: Download works
 */

interface MaterialsTabProps {
  classId: number;
}

const MaterialsTab = ({ classId }: MaterialsTabProps) => {
  const [materials, setMaterials] = useState<MaterialResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMaterials();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const loadMaterials = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[MaterialsTab] Loading materials for class:', classId);
      const data = await materialApi.getStudentMaterials(classId);
      setMaterials(data);
      console.log('[MaterialsTab]  Loaded', data.length, 'materials');
    } catch (err: unknown) {
      console.error('[MaterialsTab] Failed to load materials:', err);
      setError('Không thể tải danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (material: MaterialResponse) => {
    console.log('[MaterialsTab] Downloading:', material.fileName);
    window.open(material.fileUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="materials-tab">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải tài liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="materials-tab">
        <div className="error-message">
          {error}
          <button onClick={loadMaterials} className="btn-retry">
           Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="materials-tab">
      <div className="tab-header">
        <h3> Tài liệu học tập</h3>
        <p>{materials.length} tài liệu</p>
      </div>

      {materials.length === 0 ? (
        <div className="empty-state">
          <h3>Chưa có tài liệu</h3>
          <p>Giảng viên chưa tải lên tài liệu nào</p>
        </div>
      ) : (
        <div className="materials-list">
          {materials.map(material => (
            <div key={material.materialId} className="material-card">
              
              <div className="material-info">
                <h4>{material.title}</h4>
                {material.description && (
                  <p className="material-description">{material.description}</p>
                )}
                <div className="material-meta">
                  <span className="file-type">{material.fileType.toUpperCase()}</span>
                  <span className="separator">•</span>
                  <span className="file-size">{material.fileSizeDisplay}</span>
                  <span className="separator">•</span>
                  <span className="upload-date">
                    {new Date(material.uploadedAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>

              <button 
                className="btn-download"
                onClick={() => handleDownload(material)}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Tải xuống
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MaterialsTab;