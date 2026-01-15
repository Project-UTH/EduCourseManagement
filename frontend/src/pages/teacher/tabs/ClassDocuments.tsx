import { useState } from 'react';

/**
 * ClassDocuments Tab
 * 
 * Features:
 * - Upload documents
 * - List of documents
 * - Download/Delete documents
 */

interface Props {
  classId: number;
}

const ClassDocuments: React.FC<Props> = ({ classId }) => {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // TODO: Implement file upload
    console.log('Uploading files:', files);
    alert('Tính năng upload tài liệu đang phát triển');
  };

  return (
    <div className="tab-documents">
      <div className="tab-header">
        <h2>📁 Tài liệu lớp học</h2>
        <label className="btn-primary btn-upload">
          ⬆️ Upload tài liệu
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
          />
        </label>
      </div>

      <div className="empty-state">
        <div className="empty-icon">📁</div>
        <h3>Chưa có tài liệu</h3>
        <p>Upload tài liệu giảng dạy cho lớp học</p>
        <label className="btn-secondary btn-upload">
          Upload tài liệu
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      <div className="info-box">
        <p>💡 <strong>Hỗ trợ:</strong> PDF, Word, Excel, PowerPoint (Max 10MB/file)</p>
      </div>
    </div>
  );
};

export default ClassDocuments;