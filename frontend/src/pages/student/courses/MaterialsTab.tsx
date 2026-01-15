import { useState } from 'react';

/**
 * MaterialsTab - Tab tài liệu trong ClassDetail
 */

interface MaterialsTabProps {
  classId: number;
}

const MaterialsTab = ({ classId: _classId }: MaterialsTabProps) => {
  const [materials] = useState([
    {
      id: 1,
      title: 'Bài giảng tuần 1 - Giới thiệu môn học',
      type: 'pdf',
      size: '2.5 MB',
      uploadedAt: '2025-12-15',
      downloadUrl: '#'
    },
    {
      id: 2,
      title: 'Slide bài giảng HTML/CSS',
      type: 'pptx',
      size: '5.8 MB',
      uploadedAt: '2025-12-20',
      downloadUrl: '#'
    },
    {
      id: 3,
      title: 'Code mẫu - JavaScript basics',
      type: 'zip',
      size: '1.2 MB',
      uploadedAt: '2026-01-05',
      downloadUrl: '#'
    }
  ]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return '📄';
      case 'pptx':
      case 'ppt':
        return '📊';
      case 'zip':
        return '📦';
      case 'docx':
      case 'doc':
        return '📝';
      default:
        return '📁';
    }
  };

  return (
    <div className="materials-tab">
      <div className="tab-header">
        <h3>Tài liệu học tập</h3>
        <p>{materials.length} tài liệu</p>
      </div>

      {materials.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>Chưa có tài liệu</h3>
          <p>Giảng viên chưa tải lên tài liệu nào</p>
        </div>
      ) : (
        <div className="materials-list">
          {materials.map(material => (
            <div key={material.id} className="material-card">
              <div className="material-icon">
                {getFileIcon(material.type)}
              </div>
              
              <div className="material-info">
                <h4>{material.title}</h4>
                <div className="material-meta">
                  <span className="file-type">{material.type.toUpperCase()}</span>
                  <span className="separator">•</span>
                  <span className="file-size">{material.size}</span>
                  <span className="separator">•</span>
                  <span className="upload-date">
                    {new Date(material.uploadedAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>

              <button 
                className="btn-download"
                onClick={() => window.open(material.downloadUrl, '_blank')}
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