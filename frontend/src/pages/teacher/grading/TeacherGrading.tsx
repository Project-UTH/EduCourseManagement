import { useState, useEffect } from 'react';
import gradeApi, { GradeResponse, GradeRequest } from '../../../services/api/gradeApi';
import classApi from '../../../services/api/classApi';
import './TeacherGrading.css';
import ChatList from '../../../components/chat/ChatList';
import { useAuthStore } from '@/store/authStore';

/**
 * TeacherGrading Component - Namespaced (tgr-)
 * Grade management page for teachers
 * - Inline editing
 * - Auto-calculation
 * - Bulk save
 * 
 * @updated 2026-01-28 - Changed GK and CK to Auto (readonly) like TX
 */

interface EditingCell {
  gradeId: number;
  field: 'attendanceRate' | 'teacherComment'; //  REMOVED: midtermScore, finalScore
  value: string;
}
interface TeacherClass {
  classId: number;
  classCode: string;
  subjectName: string;
}


interface GradeRow extends GradeResponse {
  isModified?: boolean;
}

const TeacherGrading = () => {
  // State
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  useEffect(() => {
    loadTeacherClasses();
  }, []);
  
  useEffect(() => {
    if (selectedClassId) {
      loadGrades();
    } else {
      setGrades([]);
    }
  }, [selectedClassId]);
  
  const loadTeacherClasses = async () => {
    try {
      const response = await classApi.getMyClasses();
      setClasses(response);
      if (response.length > 0) {
        setSelectedClassId(response[0].classId);
      }
    } catch (err: unknown) {
      console.error(err);
      showError('Không thể tải danh sách lớp');
    }
  };
  const isHttpError = (err: unknown): err is { response?: { status?: number } } => {
  return typeof err === 'object' && err !== null && 'response' in err;
};

  
  const loadGrades = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    setError(null);
    
    try {
      const data = await gradeApi.getGradesByClass(selectedClassId);
      setGrades(data.map(g => ({ ...g, isModified: false })));
    } catch (err: unknown) {
  if (isHttpError(err) && err.response?.status === 404) {
    setGrades([]);
    showError('Chưa có dữ liệu điểm. Hãy khởi tạo bảng điểm trước.');
  } else {
    console.error(err);
    showError('Không thể tải dữ liệu điểm');
  }
}
 finally {
      setLoading(false);
    }
  };
  
  const handleInitializeGrades = async () => {
    if (!selectedClassId) return;
    if (!window.confirm('Khởi tạo bảng điểm cho tất cả sinh viên?')) return;
    
    setLoading(true);
    try {
      await gradeApi.initializeGrades(selectedClassId);
      showSuccess('Đã khởi tạo bảng điểm!');
      await loadGrades();
    } catch (err: unknown) {
      console.error(err);
      showError('Không thể khởi tạo bảng điểm');
    } finally {
      setLoading(false);
    }
  };
  
  // UPDATED: Only allow editing attendanceRate and teacherComment
  const handleCellClick = (grade: GradeRow, field: 'attendanceRate' | 'teacherComment') => {
    setEditingCell({
      gradeId: grade.gradeId,
      field,
      value: String(grade[field] ?? '')
    });
  };
  
  const handleCellChange = (value: string) => {
    if (editingCell) {
      setEditingCell({ ...editingCell, value });
    }
  };
  
  const handleCellSave = () => {
    if (!editingCell) return;
    
    const { gradeId, field, value } = editingCell;
    
    // Validate
    if (field !== 'teacherComment') {
      const numValue = parseFloat(value);
      if (value !== '' && (isNaN(numValue) || numValue < 0 || numValue > 100)) {
        showError('Điểm danh phải từ 0 đến 100');
        return; 
      }
    }
    
    // Update local state
    setGrades(prev => prev.map(g => {
      if (g.gradeId === gradeId) {
        const updated = { ...g, isModified: true };
        
        if (field === 'teacherComment') {
          updated[field] = value;
        } else {
          updated[field] = value === '' ? undefined : parseFloat(value);
        }
        
        return updated;
      }
      return g;
    }));
    
    setEditingCell(null);
  };
  
  const handleCellCancel = () => {
    setEditingCell(null);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCellSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCellCancel();
    }
  };
  
  const handleSaveAll = async () => {
    const modifiedGrades = grades.filter(g => g.isModified);
    
    if (modifiedGrades.length === 0) {
      showError('Không có thay đổi nào để lưu');
      return;
    }
    
    if (!window.confirm(`Lưu ${modifiedGrades.length} thay đổi?`)) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const requests: GradeRequest[] = modifiedGrades.map(g => ({
        studentId: g.studentInfo.studentId,
        classId: g.classInfo.classId,
        regularScore: g.regularScore,
        midtermScore: g.midtermScore,
        finalScore: g.finalScore,
        attendanceRate: g.attendanceRate,
        teacherComment: g.teacherComment
      }));
      
      await gradeApi.bulkUpdateGrades(requests);
      showSuccess(`Đã lưu thành công ${modifiedGrades.length} điểm!`);
      await loadGrades(); // Reload to get fresh data
    } catch (err: unknown) {
      console.error(err);
      showError('Không thể lưu điểm. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };
  
  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };
  
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };
  
  // Safe class name generator for letter grades (handles B+, C+)
  const getLetterGradeClass = (grade?: string) => {
    if (!grade) return '';
    return `tgr-grade-${grade.replace('+', '_PLUS')}`;
  };
  
  const filteredGrades = grades.filter(g => {
    if (!searchKeyword) return true;
    const keyword = searchKeyword.toLowerCase();
    return (
      g.studentInfo.studentCode.toLowerCase().includes(keyword) ||
      g.studentInfo.fullName.toLowerCase().includes(keyword)
    );
  });
  
  const modifiedCount = grades.filter(g => g.isModified).length;
  const user = useAuthStore((state) => state.user);

  
  return (
    <div className="tgr-container">
      {/* Header */}
      <div className="tgr-header">
        <div className="tgr-header-content">
          <h1>Quản lý Điểm</h1>
          <p>Nhập và chỉnh sửa điểm số sinh viên</p>
        </div>
        {selectedClassId && (
          <div className="tgr-header-actions">
            <button 
              className="tgr-btn tgr-btn-secondary" 
              onClick={handleInitializeGrades} 
              disabled={loading}
            >
              Khởi tạo bảng điểm
            </button>
            <button 
              className="tgr-btn tgr-btn-primary" 
              onClick={handleSaveAll} 
              disabled={saving || modifiedCount === 0}
            >
              {saving ? 'Đang lưu...' : `Lưu tất cả (${modifiedCount})`}
            </button>
          </div>
        )}
      </div>
      
      {/* Alerts */}
      {error && (
        <div className="tgr-alert tgr-alert-error">
          <span></span> {error}
        </div>
      )}
      {successMessage && (
        <div className="tgr-alert tgr-alert-success">
          <span></span> {successMessage}
        </div>
      )}
      
      {/* Filters */}
      <div className="tgr-filters">
        <select 
          value={selectedClassId || ''} 
          onChange={(e) => setSelectedClassId(Number(e.target.value))} 
          className="tgr-select"
        >
          <option value="">-- Chọn lớp học --</option>
          {classes.map(cls => (
            <option key={cls.classId} value={cls.classId}>
              {cls.classCode} - {cls.subjectName}
            </option>
          ))}
        </select>
        
        {selectedClassId && (
          <input 
            type="text" 
            placeholder="Tìm theo tên hoặc MSSV..." 
            value={searchKeyword} 
            onChange={(e) => setSearchKeyword(e.target.value)} 
            className="tgr-search" 
          />
        )}
      </div>
      
      {/* Loading */}
      {loading && (
        <div className="tgr-loading">
          <div className="tgr-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      )}
      
      {/* Table */}
      {!loading && selectedClassId && filteredGrades.length > 0 && (
        <div className="tgr-table-wrapper">
          <div className="tgr-table-container">
            <table className="tgr-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>STT</th>
                  <th style={{ width: '120px' }}>MSSV</th>
                  <th style={{ minWidth: '200px' }}>Họ tên</th>
                  <th style={{ width: '100px' }}>
                    TX (30%)
                    <div className="tgr-header-hint tgr-hint-auto">Auto</div>
                  </th>
                  <th style={{ width: '100px' }}>
                    GK (30%)
                    <div className="tgr-header-hint tgr-hint-auto">Auto</div>
                  </th>
                  <th style={{ width: '100px' }}>
                    CK (40%)
                    <div className="tgr-header-hint tgr-hint-auto">Auto</div>
                  </th>
                  <th style={{ width: '100px' }}>
                    Tổng
                    <div className="tgr-header-hint tgr-hint-auto">Auto</div>
                  </th>
                  <th style={{ width: '80px' }}>Điểm chữ</th>
                  <th style={{ width: '100px' }}>Điểm danh</th>
                  <th style={{ minWidth: '200px' }}>Nhận xét</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrades.map((grade, index) => (
                  <tr key={grade.gradeId} className={grade.isModified ? 'tgr-row-modified' : ''}>
                    <td className="tgr-center">{index + 1}</td>
                    <td><b>{grade.studentInfo.studentCode}</b></td>
                    <td>{grade.studentInfo.fullName}</td>
                    
                    {/* TX - READ ONLY (AUTO) */}
                    <td className="tgr-cell-score tgr-cell-readonly">
                      {grade.regularScore?.toFixed(2) ?? '--'}
                    </td>
                    
                    {/* GK - READ ONLY (AUTO) -  CHANGED FROM EDITABLE */}
                    <td className="tgr-cell-score tgr-cell-readonly">
                      {grade.midtermScore?.toFixed(2) ?? '--'}
                    </td>
                    
                    {/* CK - READ ONLY (AUTO) - CHANGED FROM EDITABLE */}
                    <td className="tgr-cell-score tgr-cell-readonly">
                      {grade.finalScore?.toFixed(2) ?? '--'}
                    </td>
                    
                    {/* TOTAL - AUTO */}
                    <td className="tgr-cell-score tgr-cell-total">
                      {grade.totalScore?.toFixed(2) ?? '--'}
                    </td>
                    
                    {/* LETTER GRADE */}
                    <td className="tgr-center">
                      <span className={`tgr-badge ${getLetterGradeClass(grade.letterGrade)}`}>
                        {grade.letterGrade || '-'}
                      </span>
                    </td>
                    
                    {/* ATTENDANCE - EDITABLE */}
                    <td 
                      className="tgr-cell-score tgr-cell-editable" 
                      onClick={() => handleCellClick(grade, 'attendanceRate')}
                    >
                      {editingCell?.gradeId === grade.gradeId && editingCell.field === 'attendanceRate' ? (
                        <input 
                          type="number" step="1" min="0" max="100" 
                          value={editingCell.value} 
                          onChange={(e) => handleCellChange(e.target.value)} 
                          onBlur={handleCellSave} 
                          onKeyDown={handleKeyDown} 
                          autoFocus 
                          className="tgr-input" 
                        />
                      ) : (
                        <span>{grade.attendanceRate ? `${grade.attendanceRate}%` : '--'}</span>
                      )}
                    </td>
                    
                    {/* COMMENT - EDITABLE */}
                    <td 
                      className="tgr-cell-comment" 
                      onClick={() => handleCellClick(grade, 'teacherComment')}
                    >
                      {editingCell?.gradeId === grade.gradeId && editingCell.field === 'teacherComment' ? (
                        <input 
                          type="text" 
                          value={editingCell.value} 
                          onChange={(e) => handleCellChange(e.target.value)} 
                          onBlur={handleCellSave} 
                          onKeyDown={handleKeyDown} 
                          autoFocus 
                          className="tgr-input-comment" 
                          placeholder="Nhập nhận xét..." 
                        />
                      ) : (
                        <span className="tgr-comment-text" title={grade.teacherComment}>
                          {grade.teacherComment || 'Chưa có nhận xét'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Legend */}
          <div className="tgr-legend">
            <div className="tgr-legend-item">
              <span>TX, GK, CK - Tự động từ bài tập/kiểm tra (Read-only)</span>
            </div>
            <div className="tgr-legend-item">
              <span>Điểm danh, Nhận xét - Click vào ô để sửa</span>
            </div>
            <div className="tgr-legend-item">
              <span>Tổng = TX×20% + GK×30% + CK×50%</span>
            </div>
            <div className="tgr-legend-item">
              <span>Dòng màu vàng - Dữ liệu chưa lưu</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {!loading && selectedClassId && filteredGrades.length === 0 && (
        <div className="tgr-empty">
          <p>Chưa có dữ liệu điểm cho lớp này</p>
          <button onClick={handleInitializeGrades} className="tgr-btn tgr-btn-primary">
            Khởi tạo bảng điểm
          </button>
        </div>
      )}
      
      {!selectedClassId && (
        <div className="tgr-empty">
          <p>Vui lòng chọn một lớp học để bắt đầu nhập điểm</p>
        </div>
      )}
      <ChatList currentUsername={user?.username || 'teacher'} currentRole="TEACHER" />
    </div>
  );
};

export default TeacherGrading;