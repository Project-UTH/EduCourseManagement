import { useState, useEffect } from 'react';
import gradeApi, { GradeResponse, GradeRequest } from '../../../services/api/gradeApi';
import classApi from '../../../services/api/classApi';
import './TeacherGrading.css';
import ChatList from '../../../components/chat/ChatList';
import { useAuthStore } from '@/store/authStore';

/**
 * TeacherGrading Component - Namespaced (tgr-)
 * * Grade management page for teachers
 * - Inline editing
 * - Auto-calculation
 * - Bulk save
 */

interface EditingCell {
  gradeId: number;
  field: 'midtermScore' | 'finalScore' | 'attendanceRate' | 'teacherComment';
  value: string;
}

interface GradeRow extends GradeResponse {
  isModified?: boolean;
}

const TeacherGrading = () => {
  // State
  const [classes, setClasses] = useState<any[]>([]);
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
    } catch (err: any) {
      showError('Không thể tải danh sách lớp');
    }
  };
  
  const loadGrades = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    setError(null);
    
    try {
      const data = await gradeApi.getGradesByClass(selectedClassId);
      setGrades(data.map(g => ({ ...g, isModified: false })));
    } catch (err: any) {
      if (err.response?.status === 404) {
        setGrades([]);
        showError('Chưa có dữ liệu điểm. Hãy khởi tạo bảng điểm trước.');
      } else {
        showError('Không thể tải dữ liệu điểm');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleInitializeGrades = async () => {
    if (!selectedClassId) return;
    if (!window.confirm('Khởi tạo bảng điểm cho tất cả sinh viên?')) return;
    
    setLoading(true);
    try {
      await gradeApi.initializeGrades(selectedClassId);
      showSuccess('✅ Đã khởi tạo bảng điểm!');
      await loadGrades();
    } catch (err: any) {
      showError('Không thể khởi tạo bảng điểm');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCellClick = (grade: GradeRow, field: 'midtermScore' | 'finalScore' | 'attendanceRate' | 'teacherComment') => {
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
      if (value !== '' && (isNaN(numValue) || numValue < 0 || numValue > 10)) {
        showError('Điểm phải từ 0 đến 10');
        // Don't close input if invalid
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
        
        // Auto-calculate total
        if (field === 'midtermScore' || field === 'finalScore') {
          updated.totalScore = calculateTotal(
            updated.regularScore,
            updated.midtermScore,
            updated.finalScore
          );
          // TODO: Letter grade calculation logic should ideally be on backend or duplicated here
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
  
  const calculateTotal = (
    regularScore?: number,
    midtermScore?: number,
    finalScore?: number
  ): number | undefined => {
    if (regularScore !== undefined && midtermScore !== undefined && finalScore !== undefined) {
      return Math.round((regularScore * 0.3 + midtermScore * 0.3 + finalScore * 0.4) * 100) / 100;
    }
    return undefined;
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
      showSuccess(`✅ Đã lưu thành công ${modifiedGrades.length} điểm!`);
      await loadGrades(); // Reload to get fresh data (including backend calculated letter grades)
    } catch (err: any) {
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
  const user = useAuthStore((state: any) => state.user);

  
  return (
    <div className="tgr-container">
      {/* Header */}
      <div className="tgr-header">
        <div className="tgr-header-content">
          <h1>📝 Quản lý Điểm</h1>
          <p>Nhập và chỉnh sửa điểm số sinh viên</p>
        </div>
        {selectedClassId && (
          <div className="tgr-header-actions">
            <button 
              className="tgr-btn tgr-btn-secondary" 
              onClick={handleInitializeGrades} 
              disabled={loading}
            >
              🔥 Khởi tạo bảng điểm
            </button>
            <button 
              className="tgr-btn tgr-btn-primary" 
              onClick={handleSaveAll} 
              disabled={saving || modifiedCount === 0}
            >
              {saving ? '💾 Đang lưu...' : `💾 Lưu tất cả (${modifiedCount})`}
            </button>
          </div>
        )}
      </div>
      
      {/* Alerts */}
      {error && (
        <div className="tgr-alert tgr-alert-error">
          <span>❌</span> {error}
        </div>
      )}
      {successMessage && (
        <div className="tgr-alert tgr-alert-success">
          <span>✅</span> {successMessage}
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
            placeholder="🔍 Tìm theo tên hoặc MSSV..." 
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
                    <div className="tgr-header-hint tgr-hint-edit">Edit</div>
                  </th>
                  <th style={{ width: '100px' }}>
                    CK (40%)
                    <div className="tgr-header-hint tgr-hint-edit">Edit</div>
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
                    
                    {/* TX - READ ONLY */}
                    <td className="tgr-cell-score tgr-cell-readonly">
                      {grade.regularScore?.toFixed(2) ?? '--'}
                      <span className="tgr-lock-icon">🔒</span>
                    </td>
                    
                    {/* GK */}
                    <td 
                      className="tgr-cell-score tgr-cell-editable" 
                      onClick={() => handleCellClick(grade, 'midtermScore')}
                    >
                      {editingCell?.gradeId === grade.gradeId && editingCell.field === 'midtermScore' ? (
                        <input 
                          type="number" step="0.01" min="0" max="10" 
                          value={editingCell.value} 
                          onChange={(e) => handleCellChange(e.target.value)} 
                          onBlur={handleCellSave} 
                          onKeyDown={handleKeyDown} 
                          autoFocus 
                          className="tgr-input" 
                        />
                      ) : (
                        <span>{grade.midtermScore?.toFixed(2) ?? '--'}</span>
                      )}
                    </td>
                    
                    {/* CK */}
                    <td 
                      className="tgr-cell-score tgr-cell-editable" 
                      onClick={() => handleCellClick(grade, 'finalScore')}
                    >
                      {editingCell?.gradeId === grade.gradeId && editingCell.field === 'finalScore' ? (
                        <input 
                          type="number" step="0.01" min="0" max="10" 
                          value={editingCell.value} 
                          onChange={(e) => handleCellChange(e.target.value)} 
                          onBlur={handleCellSave} 
                          onKeyDown={handleKeyDown} 
                          autoFocus 
                          className="tgr-input" 
                        />
                      ) : (
                        <span>{grade.finalScore?.toFixed(2) ?? '--'}</span>
                      )}
                    </td>
                    
                    {/* TOTAL */}
                    <td className="tgr-cell-score tgr-cell-total">
                      {grade.totalScore?.toFixed(2) ?? '--'}
                    </td>
                    
                    {/* LETTER */}
                    <td className="tgr-center">
                      <span className={`tgr-badge ${getLetterGradeClass(grade.letterGrade)}`}>
                        {grade.letterGrade || '-'}
                      </span>
                    </td>
                    
                    {/* ATTENDANCE */}
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
                    
                    {/* COMMENT */}
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
              <span className="tgr-legend-icon tgr-icon-readonly">🔒</span>
              <span>TX - Tự động từ bài tập (Read-only)</span>
            </div>
            <div className="tgr-legend-item">
              <span className="tgr-legend-icon tgr-icon-edit">✏️</span>
              <span>GK, CK - Click vào ô để sửa</span>
            </div>
            <div className="tgr-legend-item">
              <span className="tgr-legend-icon tgr-icon-total">⚡</span>
              <span>Tổng = TX×30% + GK×30% + CK×40%</span>
            </div>
            <div className="tgr-legend-item">
              <span className="tgr-legend-icon tgr-icon-modified">🔥</span>
              <span>Dòng màu vàng - Dữ liệu chưa lưu</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {!loading && selectedClassId && filteredGrades.length === 0 && (
        <div className="tgr-empty">
          <p>📭 Chưa có dữ liệu điểm cho lớp này</p>
          <button onClick={handleInitializeGrades} className="tgr-btn tgr-btn-primary">
            Khởi tạo bảng điểm
          </button>
        </div>
      )}
      
      {!selectedClassId && (
        <div className="tgr-empty">
          <p>🎯 Vui lòng chọn một lớp học để bắt đầu nhập điểm</p>
        </div>
      )}
      <ChatList currentUsername={user?.username || 'teacher'} currentRole="TEACHER" />
    </div>
  );
};

export default TeacherGrading;