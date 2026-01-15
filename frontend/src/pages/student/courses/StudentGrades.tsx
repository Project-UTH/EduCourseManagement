import { useState, useEffect } from 'react';
import './StudentGrades.css';

/**
 * StudentGrades Component
 * 
 * Display grades for current student in a class
 * Shows: TX (30%), GK (30%), CK (40%), Total, Letter Grade
 * Only shows student's OWN grades
 */

interface Props {
  classId: number;
}

interface GradeData {
  gradeId: number;
  className: string;
  classCode: string;
  subjectName: string;
  credits: number;
  semesterCode: string;
  regularScore?: number;
  midtermScore?: number;
  finalScore?: number;
  totalScore?: number;
  letterGrade?: string;
  attendanceRate?: number;
  teacherComment?: string;
  teacherName: string;
}

const StudentGrades: React.FC<Props> = ({ classId }) => {
  const [grade, setGrade] = useState<GradeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGrade();
  }, [classId]);

  const loadGrade = async () => {
    setLoading(true);
    setError(null);

    try {
      // ✅ API endpoint for student's own grade
      const response = await fetch(`http://localhost:8080/api/student/grades/class/${classId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.status === 404) {
        // No grade yet
        setGrade(null);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load grade');
      }

      const data = await response.json();
      setGrade(data);

      console.log('[StudentGrades] ✅ Loaded grade:', data);
    } catch (err: any) {
      console.error('[StudentGrades] ❌ Failed to load grade:', err);
      setError('Không thể tải điểm số');
    } finally {
      setLoading(false);
    }
  };

  const getLetterGradeColor = (letter?: string) => {
    if (!letter) return '#9ca3af';
    if (letter === 'A') return '#10b981';
    if (letter.startsWith('B')) return '#3b82f6';
    if (letter.startsWith('C')) return '#f59e0b';
    if (letter.startsWith('D')) return '#f97316';
    return '#ef4444';
  };

  if (loading) {
    return (
      <div className="student-grades-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải điểm...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-grades-container">
        <div className="error-state">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!grade) {
    return (
      <div className="student-grades-container">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>Chưa có điểm</h3>
          <p>Giảng viên chưa chấm điểm cho lớp học này</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-grades-container">
      <div className="grades-header">
        <h2>📊 Điểm số của bạn</h2>
        <p className="grades-subtitle">
          Xem điểm các thành phần và kết quả tổng kết
        </p>
      </div>

      {/* Class Info Card */}
      <div className="class-info-card">
        <div className="class-info-row">
          <span className="info-label">Môn học:</span>
          <span className="info-value">{grade.subjectName}</span>
        </div>
        <div className="class-info-row">
          <span className="info-label">Mã lớp:</span>
          <span className="info-value">{grade.classCode}</span>
        </div>
        <div className="class-info-row">
          <span className="info-label">Số tín chỉ:</span>
          <span className="info-value">{grade.credits}</span>
        </div>
        <div className="class-info-row">
          <span className="info-label">Giảng viên:</span>
          <span className="info-value">{grade.teacherName}</span>
        </div>
      </div>

      {/* Scores Grid */}
      <div className="scores-grid">
        <div className="score-card">
          <div className="score-header">
            <span className="score-icon">📝</span>
            <span className="score-label">TX - Thường xuyên</span>
          </div>
          <div className="score-weight">Trọng số: 30%</div>
          <div className="score-value">
            {grade.regularScore !== null && grade.regularScore !== undefined
              ? grade.regularScore.toFixed(2)
              : '--'}
          </div>
        </div>

        <div className="score-card">
          <div className="score-header">
            <span className="score-icon">📖</span>
            <span className="score-label">GK - Giữa kỳ</span>
          </div>
          <div className="score-weight">Trọng số: 30%</div>
          <div className="score-value">
            {grade.midtermScore !== null && grade.midtermScore !== undefined
              ? grade.midtermScore.toFixed(2)
              : '--'}
          </div>
        </div>

        <div className="score-card">
          <div className="score-header">
            <span className="score-icon">📕</span>
            <span className="score-label">CK - Cuối kỳ</span>
          </div>
          <div className="score-weight">Trọng số: 40%</div>
          <div className="score-value">
            {grade.finalScore !== null && grade.finalScore !== undefined
              ? grade.finalScore.toFixed(2)
              : '--'}
          </div>
        </div>
      </div>

      {/* Total Score Card */}
      {grade.totalScore !== null && grade.totalScore !== undefined && (
        <div className="total-score-card">
          <div className="total-score-content">
            <div className="total-score-info">
              <h3>Điểm tổng kết</h3>
              <p className="total-score-formula">
                Công thức: TX×30% + GK×30% + CK×40%
              </p>
            </div>
            <div className="total-score-display">
              <div className="total-score-number">
                {grade.totalScore.toFixed(2)}
              </div>
              <div 
                className="letter-grade-badge"
                style={{ 
                  background: `${getLetterGradeColor(grade.letterGrade)}15`,
                  color: getLetterGradeColor(grade.letterGrade)
                }}
              >
                {grade.letterGrade || '--'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="additional-info">
        {grade.attendanceRate !== null && grade.attendanceRate !== undefined && (
          <div className="info-card">
            <div className="info-card-header">
              <span className="info-card-icon">📊</span>
              <span className="info-card-title">Điểm danh</span>
            </div>
            <div className="info-card-value">{grade.attendanceRate}%</div>
          </div>
        )}

        {grade.teacherComment && (
          <div className="comment-card">
            <div className="comment-header">
              <span className="comment-icon">💬</span>
              <span className="comment-title">Nhận xét của giảng viên</span>
            </div>
            <div className="comment-content">
              {grade.teacherComment}
            </div>
          </div>
        )}
      </div>

      {/* Grade Scale Reference */}
      <div className="grade-scale">
        <h4>Thang điểm chữ</h4>
        <div className="grade-scale-grid">
          <div className="scale-item">
            <span className="scale-letter" style={{ color: '#10b981' }}>A</span>
            <span className="scale-range">8.5 - 10</span>
          </div>
          <div className="scale-item">
            <span className="scale-letter" style={{ color: '#3b82f6' }}>B+</span>
            <span className="scale-range">7.5 - 8.4</span>
          </div>
          <div className="scale-item">
            <span className="scale-letter" style={{ color: '#3b82f6' }}>B</span>
            <span className="scale-range">7.0 - 7.4</span>
          </div>
          <div className="scale-item">
            <span className="scale-letter" style={{ color: '#f59e0b' }}>C+</span>
            <span className="scale-range">6.5 - 6.9</span>
          </div>
          <div className="scale-item">
            <span className="scale-letter" style={{ color: '#f59e0b' }}>C</span>
            <span className="scale-range">5.5 - 6.4</span>
          </div>
          <div className="scale-item">
            <span className="scale-letter" style={{ color: '#f97316' }}>D+</span>
            <span className="scale-range">5.0 - 5.4</span>
          </div>
          <div className="scale-item">
            <span className="scale-letter" style={{ color: '#f97316' }}>D</span>
            <span className="scale-range">4.0 - 4.9</span>
          </div>
          <div className="scale-item">
            <span className="scale-letter" style={{ color: '#ef4444' }}>F</span>
            <span className="scale-range">&lt; 4.0</span>

          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentGrades;