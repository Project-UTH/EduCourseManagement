import React, { useState, useEffect } from 'react';
import subjectApi, { Subject } from '../../../services/api/subjectApi';
import './PrerequisiteManager.css';

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
  const [prerequisites, setPrerequisites] = useState<Subject[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('[PrerequisiteManager] Fetching data for subject:', subject.subjectId);
        
        // Fetch prerequisites và all subjects song song
        const [prereqsRes, allSubjectsRes] = await Promise.all([
          subjectApi.getPrerequisites(subject.subjectId),
          subjectApi.getAll(0, 100, 'subjectName', 'asc')
        ]);
        
        console.log('[PrerequisiteManager] Prerequisites response:', prereqsRes);
        console.log('[PrerequisiteManager] All subjects response:', allSubjectsRes);
        
        // Set prerequisites
        const prereqList = Array.isArray(prereqsRes.data) ? prereqsRes.data : [];
        setPrerequisites(prereqList);
        
        // Set available subjects (exclude current subject and existing prerequisites)
        const allSubjects = Array.isArray(allSubjectsRes.data) 
          ? allSubjectsRes.data 
          : (typeof allSubjectsRes.data === 'object' && allSubjectsRes.data !== null && 'content' in allSubjectsRes.data ? (allSubjectsRes.data as { content: Subject[] }).content : []);
        
        const existingIds = [subject.subjectId, ...prereqList.map(p => p.subjectId)];
        const available = allSubjects.filter((s: Subject) => !existingIds.includes(s.subjectId));
        
        console.log('[PrerequisiteManager] Available subjects:', available.length);
        setAvailableSubjects(available);
        
      } catch (err) {
        console.error('[PrerequisiteManager] Failed to fetch data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Lỗi tải danh sách môn điều kiện';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [subject.subjectId]);

  const handleAdd = async () => {
    if (!selectedSubjectId) {
      alert('Vui lòng chọn môn điều kiện');
      return;
    }

    try {
      console.log('[PrerequisiteManager] Adding prerequisite:', selectedSubjectId, 'to', subject.subjectId);
      
      await subjectApi.addPrerequisite(subject.subjectId, Number(selectedSubjectId));
      
      alert('Thêm môn điều kiện thành công!');
      setSelectedSubjectId('');
      
      // Reload data by re-fetching
      const [prereqsRes, allSubjectsRes] = await Promise.all([
        subjectApi.getPrerequisites(subject.subjectId),
        subjectApi.getAll(0, 100, 'subjectName', 'asc')
      ]);
      
      const prereqList = Array.isArray(prereqsRes.data) ? prereqsRes.data : [];
      setPrerequisites(prereqList);
      
      const allSubjects = Array.isArray(allSubjectsRes.data) 
        ? allSubjectsRes.data 
        : (typeof allSubjectsRes.data === 'object' && allSubjectsRes.data !== null && 'content' in allSubjectsRes.data ? (allSubjectsRes.data as { content: Subject[] }).content : []);
      
      const existingIds = [subject.subjectId, ...prereqList.map(p => p.subjectId)];
      const available = allSubjects.filter((s: Subject) => !existingIds.includes(s.subjectId));
      setAvailableSubjects(available);
      
      onSuccess(); // Notify parent
    } catch (err: unknown) {
      console.error('[PrerequisiteManager] Failed to add prerequisite:', err);
      
      // ✅ FIX ERROR 1: Type-safe error handling
      let message = 'Lỗi thêm môn điều kiện';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        message = axiosError.response?.data?.message || message;
      }
      
      alert(message);
    }
  };

  const handleRemove = async (prerequisiteId: number) => {
    if (!confirm('Bạn có chắc muốn xóa môn điều kiện này?')) {
      return;
    }

    try {
      console.log('[PrerequisiteManager] Removing prerequisite:', prerequisiteId);
      
      await subjectApi.removePrerequisite(subject.subjectId, prerequisiteId);
      
      alert('Xóa môn điều kiện thành công!');
      
      // Reload data by re-fetching
      const [prereqsRes, allSubjectsRes] = await Promise.all([
        subjectApi.getPrerequisites(subject.subjectId),
        subjectApi.getAll(0, 100, 'subjectName', 'asc')
      ]);
      
      const prereqList = Array.isArray(prereqsRes.data) ? prereqsRes.data : [];
      setPrerequisites(prereqList);
      
      // ✅ FIX ERROR 2 & 3: Type-safe array handling
      const allSubjects = Array.isArray(allSubjectsRes.data) 
        ? allSubjectsRes.data 
        : (typeof allSubjectsRes.data === 'object' && allSubjectsRes.data !== null && 'content' in allSubjectsRes.data 
            ? (allSubjectsRes.data as { content: Subject[] }).content 
            : []);
      
      const existingIds = [subject.subjectId, ...prereqList.map(p => p.subjectId)];
      const available = allSubjects.filter((s: Subject) => !existingIds.includes(s.subjectId));
      setAvailableSubjects(available);
      
      onSuccess(); // Notify parent
    } catch (err) {
      console.error('[PrerequisiteManager] Failed to remove prerequisite:', err);
      alert('Lỗi xóa môn điều kiện');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content prerequisite-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Quản lý Môn điều kiện</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Subject Info */}
          <div className="subject-info">
            <h3>{subject.subjectName}</h3>
            <p>Mã môn: {subject.subjectCode}</p>
          </div>

          {error && (
            <div className="error-message" style={{ marginBottom: '1rem', padding: '0.75rem', background: '#fee', color: '#c00', borderRadius: '4px' }}>
              {error}
            </div>
          )}

          {/* Add Prerequisite */}
          <div className="add-prerequisite">
            <h4>Thêm môn điều kiện</h4>
            <div className="form-row">
              <select
                className="form-select"
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                disabled={loading}
              >
                <option value="">-- Chọn môn học --</option>
                {availableSubjects.map(s => (
                  <option key={s.subjectId} value={s.subjectId}>
                    {s.subjectCode} - {s.subjectName}
                  </option>
                ))}
              </select>
              <button 
                className="btn btn-primary" 
                onClick={handleAdd}
                disabled={!selectedSubjectId || loading}
              >
                Thêm
              </button>
            </div>
          </div>

          {/* Current Prerequisites */}
          <div className="current-prerequisites">
            <h4>Danh sách môn điều kiện ({prerequisites.length})</h4>
            
            {loading ? (
              <div className="loading">Đang tải...</div>
            ) : prerequisites.length === 0 ? (
              <div className="no-data">Chưa có môn điều kiện nào</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã môn</th>
                    <th>Tên môn học</th>
                    <th>Tín chỉ</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {prerequisites.map(prereq => (
                    <tr key={prereq.subjectId}>
                      <td>{prereq.subjectCode}</td>
                      <td>{prereq.subjectName}</td>
                      <td>{prereq.credits}</td>
                      <td>
                        <button
                          className="btn-delete"
                          onClick={() => handleRemove(prereq.subjectId)}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrerequisiteManager;