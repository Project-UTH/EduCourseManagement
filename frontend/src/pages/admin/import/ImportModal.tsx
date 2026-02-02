import React, { useState, useRef } from 'react';
import { ImportResult, ImportError } from '../../../services/api/studentApi';
import './ImportModal.css';

interface ImportModalProps {
  title: string;
  entityType: 'student' | 'teacher';
  onClose: () => void;
  onImport: (file: File) => Promise<{ data: ImportResult }>;
  onDownloadTemplate: () => Promise<Blob>;
}

const ImportModal: React.FC<ImportModalProps> = ({
  title,
  entityType,
  onClose,
  onImport,
  onDownloadTemplate,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ];
      
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls)$/)) {
        setError('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
        return;
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('Kích thước file không được vượt quá 5MB');
        return;
      }

      setFile(selectedFile);
      setError('');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Vui lòng chọn file để import');
      return;
    }

    try {
      setUploading(true);
      setError('');
      
      const response = await onImport(file);
      setResult(response.data);
      
      // Clear file after successful import
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Import error:', err);
      setError(err instanceof Error ? err.message : 'Lỗi khi import dữ liệu');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await onDownloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `template_${entityType}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Template download error:', err);
      setError('Lỗi khi tải file mẫu');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      // Create a new FileList-like object
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(droppedFile);
        input.files = dataTransfer.files;
        handleFileChange({ target: input } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  };

  const entityLabel = entityType === 'student' ? 'sinh viên' : 'giảng viên';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content import-modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        {/* BODY */}
        <div className="modal-body">
          {/* Instructions */}
          <div className="import-instructions">
            <h3> Hướng dẫn:</h3>
            <ol>
              <li>Tải file Excel mẫu về máy</li>
              <li>Điền thông tin {entityLabel} vào file mẫu</li>
              <li>Chọn file đã điền và nhấn "Import"</li>
            </ol>
          </div>

          {/* Download Template */}
          <div className="template-download">
            <button 
              className="btn btn-secondary"
              onClick={handleDownloadTemplate}
            >
              Tải file Excel mẫu
            </button>
          </div>

          {/* File Upload */}
          <div 
            className="file-upload-area"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="file-input"
            />
            <label htmlFor="file-input" className="file-upload-label">
              <p className="upload-text">
                {file ? file.name : `Kéo thả file Excel vào đây hoặc nhấn để chọn`}
              </p>
              <p className="upload-hint">
                Hỗ trợ: .xlsx, .xls (tối đa 5MB)
              </p>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {/* Import Result */}
          {result && (
            <div className="import-result">
              <div className="result-summary">
                <h3>Kết quả Import:</h3>
                <div className="result-stats">
                  <div className="stat">
                    <span className="label">Tổng số dòng:</span>
                    <span className="value">{result.totalRows}</span>
                  </div>
                  <div className="stat success">
                    <span className="label">Thành công:</span>
                    <span className="value">{result.successCount}</span>
                  </div>
                  <div className="stat error">
                    <span className="label">Thất bại:</span>
                    <span className="value">{result.failureCount}</span>
                  </div>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="error-details">
                  <h4>Chi tiết lỗi:</h4>
                  <div className="error-list">
                    {result.errors.map((err: ImportError, index: number) => (
                      <div key={index} className="error-item">
                        <span className="error-row">Dòng {err.row}:</span>
                        {err.identifier && <span className="error-field">[{err.identifier}]</span>}
                        {err.field && <span className="error-field">[{err.field}]</span>}
                        <span className="error-message">{err.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
          >
            {result ? 'Đóng' : 'Hủy'}
          </button>
          {!result && (
            <button 
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={!file || uploading}
            >
              {uploading ? (
                <>
                  <span className="spinner"></span>
                  Đang import...
                </>
              ) : (
                <>
                  Import
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;