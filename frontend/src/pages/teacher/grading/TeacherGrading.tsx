import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import gradeApi, { GradeResponse, GradeRequest } from '../../../services/api/gradeApi';
import classApi from '../../../services/api/classApi';
import './TeacherGrading.css';

/**
 * TeacherGrading Component
 * 
 * Grade management page for teachers
 * - Inline editing (click cell to edit)
 * - Auto-calculation: Total = TX×30% + GK×30% + CK×40%
 * - TX (Regular) is READ-ONLY
 * - Bulk save, Initialize grades
 * 
 * @author Phase 4 - Teacher Features
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
        return;
      }
    }
    
    // Update
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
      showError('Không có thay đổi');
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
      showSuccess(`✅ Đã lưu ${modifiedGrades.length} điểm!`);
      await loadGrades();
    } catch (err: any) {
      showError('Không thể lưu điểm');
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
  
  const filteredGrades = grades.filter(g => {
    if (!searchKeyword) return true;
    const keyword = searchKeyword.toLowerCase();
    return (
      g.studentInfo.studentCode.toLowerCase().includes(keyword) ||
      g.studentInfo.fullName.toLowerCase().includes(keyword)
    );
  });
  
  const modifiedCount = grades.filter(g => g.isModified).length;
  
  return (
    <div className="teacher-grading-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>📝 Nhập điểm</h1>
          <p>Quản lý điểm số sinh viên</p>
        </div>
        {selectedClassId && (
          <div className="header-actions">
            <button className="btn-secondary" onClick={handleInitializeGrades} disabled={loading}>
              🔥 Khởi tạo bảng điểm
            </button>
            <button className="btn-primary" onClick={handleSaveAll} disabled={saving || modifiedCount === 0}>
              {saving ? '💾 Đang lưu...' : `💾 Lưu tất cả (${modifiedCount})`}
            </button>
          </div>
        )}
      </div>
      
      {/* Alerts */}
      {error && <div className="alert alert-error">❌ {error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      
      {/* Filters */}
      <div className="filters">
        <select value={selectedClassId || ''} onChange={(e) => setSelectedClassId(Number(e.target.value))} className="class-selector">
          <option value="">-- Chọn lớp học --</option>
          {classes.map(cls => (
            <option key={cls.classId} value={cls.classId}>
              {cls.classCode} - {cls.subjectName}
            </option>
          ))}
        </select>
        
        {selectedClassId && (
          <input type="text" placeholder="🔍 Tìm sinh viên..." value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} className="search-input" />
        )}
      </div>
      
      {/* Loading */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      )}
      
      {/* Table */}
      {!loading && selectedClassId && filteredGrades.length > 0 && (
        <div className="table-container">
          <table className="grades-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>STT</th>
                <th style={{ width: '120px' }}>MSSV</th>
                <th style={{ minWidth: '200px' }}>Họ tên</th>
                <th style={{ width: '100px' }}>TX (30%)<div className="header-hint">Auto</div></th>
                <th style={{ width: '100px' }}>GK (30%)<div className="header-hint">Edit</div></th>
                <th style={{ width: '100px' }}>CK (40%)<div className="header-hint">Edit</div></th>
                <th style={{ width: '100px' }}>Tổng<div className="header-hint">Auto</div></th>
                <th style={{ width: '80px' }}>Điểm chữ</th>
                <th style={{ width: '100px' }}>Điểm danh (%)</th>
                <th style={{ minWidth: '200px' }}>Nhận xét</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrades.map((grade, index) => (
                <tr key={grade.gradeId} className={grade.isModified ? 'modified-row' : ''}>
                  <td className="text-center">{index + 1}</td>
                  <td>{grade.studentInfo.studentCode}</td>
                  <td>{grade.studentInfo.fullName}</td>
                  
                  {/* TX - READ ONLY */}
                  <td className="score-cell read-only">
                    {grade.regularScore?.toFixed(2) ?? '--'}
                    <span className="readonly-badge" title="Tự động tính từ bài tập">🔒</span>
                  </td>
                  
                  {/* GK */}
                  <td className="score-cell editable" onClick={() => handleCellClick(grade, 'midtermScore')}>
                    {editingCell?.gradeId === grade.gradeId && editingCell.field === 'midtermScore' ? (
                      <input type="number" step="0.01" min="0" max="10" value={editingCell.value} onChange={(e) => handleCellChange(e.target.value)} onBlur={handleCellSave} onKeyDown={handleKeyDown} autoFocus className="cell-input" />
                    ) : (
                      <span>{grade.midtermScore?.toFixed(2) ?? '--'}</span>
                    )}
                  </td>
                  
                  {/* CK */}
                  <td className="score-cell editable" onClick={() => handleCellClick(grade, 'finalScore')}>
                    {editingCell?.gradeId === grade.gradeId && editingCell.field === 'finalScore' ? (
                      <input type="number" step="0.01" min="0" max="10" value={editingCell.value} onChange={(e) => handleCellChange(e.target.value)} onBlur={handleCellSave} onKeyDown={handleKeyDown} autoFocus className="cell-input" />
                    ) : (
                      <span>{grade.finalScore?.toFixed(2) ?? '--'}</span>
                    )}
                  </td>
                  
                  {/* TOTAL */}
                  <td className="score-cell total-score">{grade.totalScore?.toFixed(2) ?? '--'}</td>
                  
                  {/* LETTER */}
                  <td className="text-center">
                    <span className={`letter-badge ${grade.letterGrade}`}>{grade.letterGrade || '--'}</span>
                  </td>
                  
                  {/* ATTENDANCE */}
                  <td className="score-cell editable" onClick={() => handleCellClick(grade, 'attendanceRate')}>
                    {editingCell?.gradeId === grade.gradeId && editingCell.field === 'attendanceRate' ? (
                      <input type="number" step="1" min="0" max="100" value={editingCell.value} onChange={(e) => handleCellChange(e.target.value)} onBlur={handleCellSave} onKeyDown={handleKeyDown} autoFocus className="cell-input" />
                    ) : (
                      <span>{grade.attendanceRate ? `${grade.attendanceRate}%` : '--'}</span>
                    )}
                  </td>
                  
                  {/* COMMENT */}
                  <td className="comment-cell editable" onClick={() => handleCellClick(grade, 'teacherComment')}>
                    {editingCell?.gradeId === grade.gradeId && editingCell.field === 'teacherComment' ? (
                      <input type="text" value={editingCell.value} onChange={(e) => handleCellChange(e.target.value)} onBlur={handleCellSave} onKeyDown={handleKeyDown} autoFocus className="cell-input" placeholder="Nhận xét..." />
                    ) : (
                      <span className="comment-text">{grade.teacherComment || '--'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Legend */}
          <div className="table-legend">
            <div className="legend-item"><span className="legend-badge read-only">🔒</span><span>TX - Tự động từ bài tập</span></div>
            <div className="legend-item"><span className="legend-badge editable">✏️</span><span>GK, CK - Click để sửa</span></div>
            <div className="legend-item"><span className="legend-badge total">⚡</span><span>Tổng = TX×30% + GK×30% + CK×40%</span></div>
            <div className="legend-item"><span className="legend-badge modified">🔥</span><span>Dòng vàng - Chưa lưu</span></div>
          </div>
        </div>
      )}
      
      {/* Empty */}
      {!loading && selectedClassId && filteredGrades.length === 0 && (
        <div className="empty-state">
          <p>📭 Chưa có dữ liệu điểm</p>
          <button onClick={handleInitializeGrades} className="btn-primary">Khởi tạo bảng điểm</button>
        </div>
      )}
      
      {!selectedClassId && <div className="empty-state"><p>🎯 Chọn lớp học để bắt đầu</p></div>}
    </div>
  );
};

export default TeacherGrading;