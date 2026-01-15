import { useState, useEffect } from 'react';
import materialApi, { MaterialResponse } from '../../../services/api/materialApi';

/**
 * ClassDocuments Tab (Teacher)
 * 
 * ✅ FIXED: Upload materials to API
 * ✅ FIXED: List materials from API
 * ✅ FIXED: Delete materials
 */

interface Props {
  classId: number;
}

const ClassDocuments: React.FC<Props> = ({ classId }) => {
  const [materials, setMaterials] = useState<MaterialResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload form
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadMaterials();
  }, [classId]);

  const loadMaterials = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[ClassDocuments] Loading materials for class:', classId);
      const data = await materialApi.getTeacherMaterials(classId);
      setMaterials(data);
      console.log('[ClassDocuments] ✅ Loaded', data.length, 'materials');
    } catch (err: any) {
      console.error('[ClassDocuments] ❌ Failed to load:', err);
      setError('Không thể tải danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File vượt quá 10MB!');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề!');
      return;
    }

    if (!selectedFile) {
      alert('Vui lòng chọn file!');
      return;
    }

    setUploading(true);

    try {
      console.log('[ClassDocuments] Uploading:', selectedFile.name);
      
      await materialApi.uploadMaterial(classId, title, description, selectedFile);
      
      console.log('[ClassDocuments] ✅ Upload successful');
      alert('✅ Upload tài liệu thành công!');

      // Reset form
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setShowUploadForm(false);

      // Reload materials
      loadMaterials();

    } catch (err: any) {
      console.error('[ClassDocuments] ❌ Upload failed:', err);
      alert('❌ Upload thất bại: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId: number, title: string) => {
    if (!confirm(`Xóa tài liệu "${title}"?`)) return;

    try {
      console.log('[ClassDocuments] Deleting:', materialId);
      await materialApi.deleteMaterial(materialId);
      console.log('[ClassDocuments] ✅ Deleted');
      alert('✅ Đã xóa tài liệu');
      loadMaterials();
    } catch (err: any) {
      console.error('[ClassDocuments] ❌ Delete failed:', err);
      alert('❌ Xóa thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  const getFileIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    switch (lowerType) {
      case 'pdf': return '📄';
      case 'pptx':
      case 'ppt': return '📊';
      case 'zip':
      case 'rar': return '📦';
      case 'docx':
      case 'doc': return '📝';
      case 'xlsx':
      case 'xls': return '📊';
      default: return '📁';
    }
  };

  if (loading) {
    return (
      <div className="tab-documents">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải tài liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-documents">
      <div className="tab-header">
        <h2>📁 Tài liệu lớp học</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowUploadForm(!showUploadForm)}
        >
          {showUploadForm ? '❌ Hủy' : '⬆️ Upload tài liệu'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
          <button onClick={loadMaterials} className="btn-retry">🔄 Thử lại</button>
        </div>
      )}

      {/* Upload Form */}
      {showUploadForm && (
        <form onSubmit={handleUpload} className="upload-form">
          <div className="form-group">
            <label>Tiêu đề *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Bài giảng tuần 1"
              maxLength={255}
              required
            />
          </div>

          <div className="form-group">
            <label>Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn gọn về tài liệu..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>File *</label>
            <input
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar"
              required
            />
            {selectedFile && (
              <div className="file-preview">
                📎 {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => setShowUploadForm(false)}
              className="btn-secondary"
              disabled={uploading}
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={uploading}
            >
              {uploading ? '⏳ Đang upload...' : '✅ Upload'}
            </button>
          </div>
        </form>
      )}

      {/* Materials List */}
      {materials.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <h3>Chưa có tài liệu</h3>
          <p>Upload tài liệu giảng dạy cho lớp học</p>
        </div>
      ) : (
        <div className="materials-list">
          {materials.map(material => (
            <div key={material.materialId} className="material-card">
              <div className="material-icon">
                {getFileIcon(material.fileType)}
              </div>
              
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

              <div className="material-actions">
                <button 
                  className="btn-download"
                  onClick={() => window.open(material.fileUrl, '_blank')}
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Tải
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => handleDelete(material.materialId, material.title)}
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="info-box">
        <p>💡 <strong>Hỗ trợ:</strong> PDF, Word, Excel, PowerPoint, ZIP (Max 10MB/file)</p>
      </div>
    </div>
  );
};

export default ClassDocuments;