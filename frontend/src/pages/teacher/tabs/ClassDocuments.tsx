import { useState, useEffect } from 'react';
import materialApi, { MaterialResponse } from '../../../services/api/materialApi';
import './ClassDocuments.css'; // Đã đổi import sang file CSS độc lập mới

interface Props {
  classId: number;
}

const ClassDocuments: React.FC<Props> = ({ classId }) => {
  // --- LOGIC GIỮ NGUYÊN ---
  const [materials, setMaterials] = useState<MaterialResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload form state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadMaterials();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const loadMaterials = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await materialApi.getTeacherMaterials(classId);
      setMaterials(data);
    } catch (err: any) {
      console.error(err);
      setError('Không thể tải danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('File vượt quá 10MB!');
      e.target.value = '';
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedFile) return;

    setUploading(true);
    try {
      await materialApi.uploadMaterial(classId, title, description, selectedFile);
      alert('✅ Upload tài liệu thành công!');
      
      // Reset form
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setShowUploadForm(false);
      loadMaterials();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert('❌ Upload thất bại: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId: number, title: string) => {
    if (!confirm(`Xóa tài liệu "${title}"?`)) return;
    try {
      await materialApi.deleteMaterial(materialId);
      loadMaterials();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert('❌ Xóa thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  const getFileIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    switch (lowerType) {
      case 'pdf': return '📄';
      case 'pptx': case 'ppt': return '📊';
      case 'zip': case 'rar': return '📦';
      case 'docx': case 'doc': return '📝';
      case 'xlsx': case 'xls': return '📈';
      default: return '📁';
    }
  };

  if (loading) {
    return (
      <div className="class-documents-tab">
        <div className="cd-loading">⏳ Đang tải tài liệu...</div>
      </div>
    );
  }

  // --- RENDER (Class Names Updated) ---
  return (
    <div className="class-documents-tab">
      
      {/* HEADER */}
      <div className="cd-header">
        <h2 className="cd-title">📁 Tài liệu lớp học</h2>
        <button 
          className="cd-btn cd-btn-primary"
          onClick={() => setShowUploadForm(!showUploadForm)}
        >
          {showUploadForm ? 'Đóng form' : 'Upload mới'}
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="cd-error">
          <span>⚠️ {error}</span>
          <button onClick={loadMaterials} className="cd-btn cd-btn-secondary" style={{padding:'4px 8px', fontSize:'12px'}}>Thử lại</button>
        </div>
      )}

      {/* UPLOAD FORM */}
      {showUploadForm && (
        <form onSubmit={handleUpload} className="cd-upload-form">
          <div className="cd-form-group">
            <label className="cd-label">Tiêu đề <span style={{color:'red'}}>*</span></label>
            <input
              className="cd-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Bài giảng tuần 1"
              maxLength={255}
              required
            />
          </div>

          <div className="cd-form-group">
            <label className="cd-label">Mô tả</label>
            <textarea
              className="cd-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả nội dung tài liệu..."
              rows={3}
            />
          </div>

          <div className="cd-form-group">
            <label className="cd-label">File đính kèm (Max 10MB) <span style={{color:'red'}}>*</span></label>
            <input
              className="cd-file-input"
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar"
              required
            />
          </div>

          <div className="cd-form-actions">
            <button 
              type="button" 
              onClick={() => setShowUploadForm(false)}
              className="cd-btn cd-btn-secondary"
              disabled={uploading}
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className="cd-btn cd-btn-primary"
              disabled={uploading}
            >
              {uploading ? 'Đang tải lên...' : 'Xác nhận Upload'}
            </button>
          </div>
        </form>
      )}

      {/* MATERIALS LIST */}
      {materials.length === 0 ? (
        <div className="cd-empty">
          <div className="cd-empty-icon">📂</div>
          <h3>Chưa có tài liệu nào</h3>
          <p>Giảng viên chưa tải lên tài liệu cho lớp học này.</p>
        </div>
      ) : (
        <div className="cd-materials-list">
          {materials.map(material => (
            <div key={material.materialId} className="cd-material-card">
              <div className="cd-file-icon">
                {getFileIcon(material.fileType)}
              </div>
              
              <div className="cd-file-info">
                <h4 className="cd-file-title">{material.title}</h4>
                {material.description && (
                  <p className="cd-file-desc">{material.description}</p>
                )}
                <div className="cd-file-meta">
                  <span className="cd-badge">{material.fileType}</span>
                  <span>•</span>
                  <span>{material.fileSizeDisplay}</span>
                  <span>•</span>
                  <span>{new Date(material.uploadedAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>

              <div className="cd-file-actions">
                <button 
                  className="cd-btn cd-btn-download"
                  onClick={() => window.open(material.fileUrl, '_blank')}
                  title="Tải xuống"
                >
                  📥 Tải
                </button>
                <button 
                  className="cd-btn cd-btn-delete"
                  onClick={() => handleDelete(material.materialId, material.title)}
                  title="Xóa tài liệu"
                >
                  🗑️ Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FOOTER HINT */}
      <div className="cd-info-box">
        <span>💡</span>
        <strong>Hỗ trợ:</strong> PDF, Word, Excel, PowerPoint, ZIP (Tối đa 10MB/file)
      </div>
    </div>
  );
};

export default ClassDocuments;