import { useState, useEffect } from 'react';
// IMPORT FILE CSS ĐỘC LẬP
import './StudentGrades.css';

interface Props {
  classId: number;
}

interface DisplayGrade {
  regularScore: number | null;
  midtermScore: number | null;
  finalScore: number | null;
  totalScore: number | null;
  letterGrade: string;
}

const GradesTab: React.FC<Props> = ({ classId }) => {
  const [grade, setGrade] = useState<DisplayGrade | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateGradesFromHomeworks();
  }, [classId]);

  const calculateGradesFromHomeworks = async () => {
    setLoading(true);
    try {
      // 1. Gọi API lấy danh sách bài tập
      const response = await fetch(`http://localhost:8080/api/student/classes/${classId}/homeworks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to load homeworks');

      const result = await response.json();
      
      // API returns: { success, message, data: [...] }
      const homeworks = result.data || [];
      
      console.log('✅ Loaded homeworks:', homeworks);
      
      // 2. Tách điểm theo loại
      const regularScores: number[] = [];
      let midtermScore: number | null = null;
      let finalScore: number | null = null;

      homeworks.forEach((hw: any) => {
        if (hw.grade !== null && hw.grade !== undefined) {
          // Quy đổi về thang 10
          const normalized = (hw.grade / hw.maxScore) * 10;
          
          if (hw.homeworkType === 'REGULAR') {
            regularScores.push(normalized);
          } else if (hw.homeworkType === 'MIDTERM') {
            midtermScore = normalized;
          } else if (hw.homeworkType === 'FINAL') {
            finalScore = normalized;
          }
        }
      });

      // 3. Tính toán trung bình TX
      const tx = regularScores.length > 0
        ? regularScores.reduce((a, b) => a + b, 0) / regularScores.length
        : null;

      // 4. Tính tổng kết (20-30-50)
      let total: number | null = null;
      if (tx !== null && midtermScore !== null && finalScore !== null) {
        total = (tx * 0.2) + (midtermScore * 0.3) + (finalScore * 0.5);
      }

      // 5. Cập nhật state
      setGrade({
        regularScore: tx,
        midtermScore: midtermScore,
        finalScore: finalScore,
        totalScore: total,
        letterGrade: total !== null ? getLetterGrade(total) : '--'
      });

    } catch (err) {
      console.error('❌ Failed to calculate grades:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLetterGrade = (score: number): string => {
    if (score >= 8.5) return 'A';
    if (score >= 8.0) return 'B+';
    if (score >= 7.0) return 'B';
    if (score >= 6.5) return 'C+';
    if (score >= 5.5) return 'C';
    if (score >= 5.0) return 'D+';
    if (score >= 4.0) return 'D';
    return 'F';
  };

  const getLetterGradeColor = (letter?: string) => {
    if (!letter || letter === '--') return '#9ca3af';
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
          <p className="state-message">Đang tính toán điểm...</p>
        </div>
      </div>
    );
  }

  if (!grade) {
    return (
      <div className="student-grades-container">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>Chưa có dữ liệu điểm</h3>
          <p className="state-message">Giảng viên chưa chấm bài tập nào.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-grades-container">
      <div className="grades-header">
        <h2>📊 Bảng điểm tổng kết</h2>
        <p className="grades-subtitle">
          Điểm được tính tự động từ các bài tập đã chấm
        </p>
      </div>

      {/* Scores Grid */}
      <div className="scores-grid">
        <div className="score-card">
          <div className="score-header">
            <span className="score-icon">📝</span>
            <span className="score-label">TX - Thường xuyên</span>
          </div>
          <div className="score-weight">Trọng số: 20%</div>
          <div className="score-value">
            {grade.regularScore !== null ? grade.regularScore.toFixed(2) : '--'}
          </div>
        </div>

        <div className="score-card">
          <div className="score-header">
            <span className="score-icon">📖</span>
            <span className="score-label">GK - Giữa kỳ</span>
          </div>
          <div className="score-weight">Trọng số: 30%</div>
          <div className="score-value">
            {grade.midtermScore !== null ? grade.midtermScore.toFixed(2) : '--'}
          </div>
        </div>

        <div className="score-card">
          <div className="score-header">
            <span className="score-icon">📕</span>
            <span className="score-label">CK - Cuối kỳ</span>
          </div>
          <div className="score-weight">Trọng số: 50%</div>
          <div className="score-value">
            {grade.finalScore !== null ? grade.finalScore.toFixed(2) : '--'}
          </div>
        </div>
      </div>

      {/* Total Score Card */}
      <div className="total-score-card">
        <div className="total-score-content">
          <div className="total-score-info">
            <h3>Điểm tổng kết môn học</h3>
            <p className="total-score-formula">
              Công thức: TX×20% + GK×30% + CK×50%
            </p>
          </div>
          <div className="total-score-display">
            <div className="total-score-number">
              {grade.totalScore !== null ? grade.totalScore.toFixed(2) : '--'}
            </div>
            <div 
              className="letter-grade-badge"
              style={{ 
                // Logic màu nền badge dựa trên điểm chữ, đè lên gradient của card
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: grade.totalScore ? '#ffffff' : 'rgba(255,255,255,0.7)',
                border: `2px solid ${getLetterGradeColor(grade.letterGrade)}`
              }}
            >
              {grade.letterGrade}
            </div>
          </div>
        </div>
      </div>

      {/* Grade Scale Reference */}
      <div className="grade-scale">
        <h4>Thang điểm chữ tham khảo</h4>
        <div className="grade-scale-grid">
          <div className="scale-item">
            <span className="scale-letter" style={{ color: '#10b981' }}>A</span>
            <span className="scale-range">8.5 - 10</span>
          </div>
          <div className="scale-item">
            <span className="scale-letter" style={{ color: '#3b82f6' }}>B+</span>
            <span className="scale-range">8.0 - 8.4</span>
          </div>
          <div className="scale-item">
            <span className="scale-letter" style={{ color: '#3b82f6' }}>B</span>
            <span className="scale-range">7.0 - 7.9</span>
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

export default GradesTab;