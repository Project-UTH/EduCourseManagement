import React, { useState, useEffect, useCallback } from 'react';
import subjectApi, { Subject } from '../../../services/api/subjectApi';
import './PrerequisiteManager.css'; // File CSS độc lập

interface PrerequisiteManagerProps {
  subject: Subject;
  onClose: () => void;
  onSuccess: () => void;
}

const PrerequisiteManager: React.FC<PrerequisiteManagerProps> = ({
  subject,
  onClose,
  onSuccess
}) => {
  // State
  const [prerequisites, setPrerequisites] = useState<Subject[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ==================== FETCH DATA LOGIC ====================
  
  // Tách hàm fetch ra để tái sử dụng sau khi Add/Delete
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch prerequisites và all subjects song song
      const [prereqsRes, allSubjectsRes] = await Promise.all([
        subjectApi.getPrerequisites(subject.subjectId),
        subjectApi.getAll(0, 1000, 'subjectName', 'asc') // Tăng limit để lấy hết môn
      ]);
      
      // 1. Xử lý Prerequisites
      const prereqList = Array.isArray(prereqsRes.data) ? prereqsRes.data : [];
      setPrerequisites(prereqList);
      
      // 2. Xử lý Available Subjects
      // Kiểm tra kỹ cấu trúc trả về (có thể là mảng trực tiếp hoặc object phân trang)
      let allSubjects: Subject[] = [];
      if (Array.isArray(allSubjectsRes.data)) {
        allSubjects = allSubjectsRes.data;
      } else if (allSubjectsRes.data && typeof allSubjectsRes.data === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dataAny = allSubjectsRes.data as any;
        if (Array.isArray(dataAny.content)) {
          allSubjects = dataAny.content;
        }
      }

      // Lọc bỏ môn hiện tại và các môn đã là điều kiện
      const existingIds = new Set([subject.subjectId, ...prereqList.map(p => p.subjectId)]);
      const available = allSubjects.filter((s: Subject) => !existingIds.has(s.subjectId));
      
      setAvailableSubjects(available);
      
    } catch (err: unknown) {
      console.error('[PrerequisiteManager] Error:', err);
      const msg = err instanceof Error ? err.message : 'Không thể tải dữ liệu';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [subject.subjectId]);

  // Initial Load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ==================== HANDLERS ====================

  const handleAdd = async () => {
    if (!selectedSubjectId) return;

    try {
      setLoading(true); // Hiển thị loading nhẹ hoặc disable nút
      await subjectApi.addPrerequisite(subject.subjectId, Number(selectedSubjectId));
      
      // Refresh dữ liệu
      await fetchData();
      setSelectedSubjectId('');
      alert('Thêm môn điều kiện thành công!');
      onSuccess(); // Báo cho component cha cập nhật nếu cần
    } catch (err: unknown) {
      // Xử lý lỗi từ API response
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorMsg = (err as any)?.response?.data?.message || 'Lỗi khi thêm môn điều kiện';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (prerequisiteId: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa môn điều kiện này?')) return;

    try {
      setLoading(true);
      await subjectApi.removePrerequisite(subject.subjectId, prerequisiteId);
      
      // Refresh dữ liệu
      await fetchData();
      alert('Đã xóa môn điều kiện.');
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Lỗi khi xóa môn điều kiện');
    } finally {
      setLoading(false);
    }
  };

  // ==================== RENDER ====================

  return (
    <div className="prerequisite-manager modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="modal-header">
          <h2>Quản lý Tiên quyết: {subject.subjectCode}</h2>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        {/* BODY */}
        <div className="modal-body">
          {error && (
  <div className="error-message">
    {error}
  </div>
)}

          
          {/* ADD SECTION */}
          <div className="add-section">
            <h4 className="section-title">Thêm môn điều kiện</h4>
            <div className="form-row">
              <select
                className="form-select"
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                disabled={loading}
              >
                <option value="">-- Chọn môn học để thêm --</option>
                {availableSubjects.map(s => (
                  <option key={s.subjectId} value={s.subjectId}>
                    {s.subjectCode} - {s.subjectName} ({s.credits}TC)
                  </option>
                ))}
              </select>
              
              {/* Nút Thêm gọn gàng */}
              <button 
                className="btn btn-primary btn-add" 
                onClick={handleAdd}
                disabled={!selectedSubjectId || loading}
              >
                Thêm
              </button>
            </div>
          </div>

          {/* LIST SECTION */}
          <div>
            <h4 className="section-title" style={{marginBottom: '8px'}}>
              Danh sách đã chọn ({prerequisites.length})
            </h4>
            
            {loading && prerequisites.length === 0 ? (
              <div className="loading">Đang tải...</div>
            ) : prerequisites.length === 0 ? (
              <div className="no-data" style={{padding: '16px'}}>Chưa có môn điều kiện nào.</div>
            ) : (
              // Bảng Compact
              <table className="compact-table">
                {/* Định nghĩa độ rộng cột để tối ưu không gian */}
                <colgroup>
                    <col style={{ width: '20%' }} /> {/* Mã môn */}
                    <col style={{ width: 'auto' }} /> {/* Tên môn (giãn tự do) */}
                    <col style={{ width: '10%' }} /> {/* TC */}
                    <col style={{ width: '10%' }} /> {/* Action (nhỏ nhất có thể) */}
                </colgroup>
                <thead>
                  <tr>
                    <th>Mã môn</th>
                    <th>Tên môn học</th>
                    <th style={{textAlign: 'center'}}>TC</th>
                    <th style={{textAlign: 'center'}}>Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  {prerequisites.map(prereq => (
                    <tr key={prereq.subjectId}>
                      <td style={{fontWeight: 600}}>{prereq.subjectCode}</td>
                      <td>{prereq.subjectName}</td>
                      <td style={{textAlign: 'center'}}>{prereq.credits}</td>
                      <td style={{textAlign: 'center'}}>
                        <button
                          className="btn-icon-delete"
                          onClick={() => handleRemove(prereq.subjectId)}
                          disabled={loading}
                          title="Gỡ bỏ môn này"
                        >
                          &times; {/* Dấu nhân thay vì chữ "Xóa" */}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="modal-footer">
          <button className="btn btn-cancel" onClick={onClose}>
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};

export default PrerequisiteManager;