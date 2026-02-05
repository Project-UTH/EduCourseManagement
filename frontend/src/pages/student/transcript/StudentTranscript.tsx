import React, { useState, useEffect } from 'react';
// IMPORT FILE CSS ĐỘC LẬP
import './StudentTranscript.css';
import { useAuthStore } from '@/store/authStore';
import ChatList from '../../../components/chat/ChatList';

/**
 * StudentTranscript Component
 * * Displays comprehensive academic transcript with:
 * - Overall statistics (GPA, cumulative average, classification)
 * - Grades grouped by semester
 * - Academic performance classification
 * - Credit summary
 */

interface ClassGrade {
  subjectCode: string;
  subjectName: string;
  credits: number;
  totalScore?: number; // Can be undefined
  letterGrade?: string; // Can be undefined
  status: 'PASSED' | 'FAILED' | 'IN_PROGRESS';
}

interface TranscriptData {
  student: {
    studentCode: string;
    fullName: string;
    major: string;
  };
  gpa: number;
  totalCredits: number;
  grades: Array<{
    semester: string;
    classes: ClassGrade[];
  }>;
}

interface SemesterGroup {
  semester: string;
  grades: ClassGrade[];
  averageScore: number | null; // Điểm TB hệ 10
  averageGPA: number | null; // Điểm TB hệ 4
  totalCredits: number;
  completedCredits: number;
  classification: string; // Xếp loại học lực
}
interface ApiClass {
  subjectCode: string;
  subjectName: string;
  credits: number;
  totalScore?: number;
  letterGrade?: string;
  status: 'PASSED' | 'FAILED' | 'IN_PROGRESS';
}

interface ApiSemester {
  semesterName: string;
  classes: ApiClass[]; // ✅ PHẢI LÀ ARRAY
}

interface ApiTranscriptResponse {
  student: {
    studentCode: string;
    fullName: string;
    major: string;
  };
  gpa: number;
  totalCredits: number;
  semesters: ApiSemester[]; // ✅
}




const StudentTranscript: React.FC = () => {
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTranscript();
  }, []);

  const fetchTranscript = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Fetching transcript from backend API');
      
      const response = await fetch('http://localhost:8080/api/student/transcript', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const apiData:  ApiTranscriptResponse = result.data;
      
      const transformedData: TranscriptData = {
        student: {
          studentCode: apiData.student.studentCode,
          fullName: apiData.student.fullName,
          major: apiData.student.major
        },
        gpa: apiData.gpa,
        totalCredits: apiData.totalCredits,
        grades: apiData.semesters.map((sem) => ({
  semester: sem.semesterName,
  classes: sem.classes.map((cls) => ({
    subjectCode: cls.subjectCode,
    subjectName: cls.subjectName,
    credits: cls.credits,
    totalScore: cls.totalScore,
    letterGrade: cls.letterGrade,
    status: cls.status
  }))
}))

      };
      
      setTranscript(transformedData);
    } catch (err: unknown) {
      console.error(' Failed to load transcript:', err);
      setError((err as Error).message || 'Không thể tải bảng điểm');
    } finally {
      setLoading(false);
    }
  };

  const groupBySemester = (): SemesterGroup[] => {
    if (!transcript || !transcript.grades) return [];

    return transcript.grades
      .sort((a, b) => b.semester.localeCompare(a.semester))
      .map((semesterData) => {
        const validScores = semesterData.classes
          .filter(g => g.totalScore != null && g.totalScore !== undefined)
          .map(g => ({ score: g.totalScore!, credits: g.credits }));

        const averageScore = validScores.length > 0
          ? validScores.reduce((sum, item) => sum + item.score * item.credits, 0) /
            validScores.reduce((sum, item) => sum + item.credits, 0)
          : null;

        const validGrades = semesterData.classes
          .filter(g => g.letterGrade != null && g.letterGrade !== undefined)
          .map(g => ({ 
            point: getGradePoint(g.letterGrade!), 
            credits: g.credits 
          }));

        const averageGPA = validGrades.length > 0
          ? validGrades.reduce((sum, item) => sum + item.point * item.credits, 0) /
            validGrades.reduce((sum, item) => sum + item.credits, 0)
          : null;

        const totalCredits = semesterData.classes.reduce((sum, g) => sum + g.credits, 0);
        const completedCredits = semesterData.classes
          .filter(g => g.status === 'PASSED')
          .reduce((sum, g) => sum + g.credits, 0);

        const classification = getClassification(averageScore);

        return {
          semester: semesterData.semester,
          grades: semesterData.classes,
          averageScore,
          averageGPA,
          totalCredits,
          completedCredits,
          classification
        };
      });
  };

  const getClassification = (score: number | null): string => {
    if (score === null || score === undefined) return '--';
    
    if (score >= 8.5) return 'Xuất sắc';
    if (score >= 7.9) return 'Giỏi';
    if (score >= 6.5) return 'Khá';
    if (score >= 5.0) return 'Trung bình';
    if (score >= 4.0) return 'Yếu';
    return 'Kém';
  };

  const getGradePoint = (letterGrade: string): number => {
    const gradePoints: Record<string, number> = {
      'A': 4.0, 'B+': 3.5, 'B': 3.0, 'C+': 2.5, 'C': 2.0, 'D+': 1.5, 'D': 1.0, 'F': 0.0
    };
    return gradePoints[letterGrade] || 0.0;
  };

  const calculateCumulativeAverage = (): number | null => {
    if (!transcript || !transcript.grades || transcript.grades.length === 0) return null;

    const allClasses = transcript.grades.flatMap(sem => sem.classes);
    const validGrades = allClasses.filter(g => g.totalScore != null && g.totalScore !== undefined);

    if (validGrades.length === 0) return null;

    const totalWeightedScore = validGrades.reduce((sum, g) => sum + g.totalScore! * g.credits, 0);
    const totalCredits = validGrades.reduce((sum, g) => sum + g.credits, 0);

    return totalWeightedScore / totalCredits;
  };

  const calculateCumulativeAverageUpTo = (semesterIndex: number): number | null => {
    if (!transcript || !transcript.grades) return null;
    
    const semesterGroups = groupBySemester();
    let allClasses: ClassGrade[] = [];
    for (let i = semesterGroups.length - 1; i >= semesterIndex; i--) {
      allClasses = allClasses.concat(semesterGroups[i].grades);
    }
    
    const validGrades = allClasses.filter(g => g.totalScore != null && g.totalScore !== undefined);
    if (validGrades.length === 0) return null;
    
    const totalWeighted = validGrades.reduce((sum, g) => sum + g.totalScore! * g.credits, 0);
    const totalCredits = validGrades.reduce((sum, g) => sum + g.credits, 0);
    
    return totalWeighted / totalCredits;
  };

  const calculateCumulativeCredits = (semesterIndex: number): number => {
    if (!transcript || !transcript.grades) return 0;

    const semesterGroups = groupBySemester();
    let cumulativeCredits = 0;
    
    for (let i = semesterGroups.length - 1; i >= semesterIndex; i--) {
      const semester = semesterGroups[i];
      const passedCredits = semester.grades
        .filter(g => {
          const hasGrade = g.letterGrade != null && g.letterGrade !== '';
          const notF = g.letterGrade !== 'F';
          return hasGrade && notF;
        })
        .reduce((sum, g) => sum + g.credits, 0);
      
      cumulativeCredits += passedCredits;
    }
    return cumulativeCredits;
  };

  const getClassificationColor = (classification: string): string => {
    switch (classification) {
      case 'Xuất sắc': return '#10b981';
      case 'Giỏi': return '#3b82f6';
      case 'Khá': return '#f59e0b';
      case 'Trung bình': return '#f97316';
      case 'Yếu': return '#ef4444';
      case 'Kém': return '#991b1b';
      default: return '#9ca3af';
    }
  };

  const getLetterGradeColor = (letter?: string | null): string => {
    if (!letter || letter === '--') return '#9ca3af';
    if (letter === 'A') return '#10b981';
    if (letter.startsWith('B')) return '#3b82f6';
    if (letter.startsWith('C')) return '#f59e0b';
    if (letter.startsWith('D')) return '#f97316';
    return '#ef4444';
  };

  const user = useAuthStore((state) => state.user);

  const semesterGroups = groupBySemester();
  const cumulativeAverage = calculateCumulativeAverage();
  const overallClassification = getClassification(cumulativeAverage);

  if (loading) {
    return (
      <div className="transcript-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải bảng điểm...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transcript-container">
        <div className="error-state">
          <h3>Không thể tải bảng điểm</h3>
          <p>{error}</p>
          <button onClick={fetchTranscript} className="btn-retry">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!transcript || !transcript.grades || transcript.grades.length === 0) {
    return (
      <div className="transcript-container">
        <div className="empty-state">
          <h3>Chưa có dữ liệu điểm</h3>
          <p>Bạn chưa có điểm nào được ghi nhận trong hệ thống</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transcript-container">
      {/* Header */}
      <div className="transcript-header">
        <div className="header-title">
          <h1>Bảng điểm học tập</h1>
          <p className="student-info">
            <strong>{transcript.student.fullName}</strong> - {transcript.student.studentCode}
          </p>
          <p className="major-info">
            {transcript.student.major}
          </p>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-content">
            <div className="stat-label">Điểm TB tích lũy (Hệ 10)</div>
            <div className="stat-value">
              {cumulativeAverage !== null ? cumulativeAverage.toFixed(2) : '--'}
            </div>
            <div className="stat-sublabel">
              Tính theo trọng số tín chỉ
            </div>
          </div>
        </div>

        <div className="stat-card stat-secondary">
          <div className="stat-content">
            <div className="stat-label">Điểm TB tích lũy (Hệ 4)</div>
            <div className="stat-value">
              {transcript.gpa ? transcript.gpa.toFixed(2) : '--'}
            </div>
            <div className="stat-sublabel">
              GPA (Grade Point Average)
            </div>
          </div>
        </div>

        <div className="stat-card stat-accent">
          <div className="stat-content">
            <div className="stat-label">Xếp loại học lực</div>
            <div 
              className="stat-value stat-classification"
              style={{ color: getClassificationColor(overallClassification) }}
            >
              {overallClassification}
            </div>
            <div className="stat-sublabel">
              Dựa trên điểm TB hệ 10
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-label">Tổng số tín chỉ</div>
            <div className="stat-value">
              {transcript.totalCredits}
            </div>
            <div className="stat-sublabel">
              Tổng đăng ký (các kỳ)
            </div>
          </div>
        </div>
      </div>

      {/* Cumulative Average Info Card */}
      <div className="info-card">
        <div className="info-header">
          <span className="info-title">Điểm trung bình tích lũy là gì?</span>
        </div>
        <div className="info-content">
          <p>
            <strong>Điểm TB hệ 10 theo kì:</strong> Điểm trung bình của tất cả các môn trong kì đó, 
            tính theo trọng số tín chỉ.
          </p>
          <p>
            <strong>Điểm TB tích lũy:</strong> Điểm trung bình của TẤT CẢ các kì đã học, 
            bao gồm cả các môn từ HK1, HK2, HK3,... đến hiện tại.
          </p>
          <p className="formula">
            Công thức: Điểm TB tích lũy = Σ(Điểm môn × Số tín chỉ) / Σ(Số tín chỉ)
          </p>
        </div>
      </div>

      {/* Grades by Semester */}
      <div className="semesters-section">
        <h2 className="section-title">Bảng điểm theo học kỳ</h2>
        
        {semesterGroups.map((semesterGroup, index) => (
          <div key={semesterGroup.semester} className="semester-block">
            {/* Semester Header */}
            <div className="semester-header">
              <div className="semester-title">
                <h3>{semesterGroup.semester}</h3>
                <div className="semester-badges">
                  <span 
                    className="badge badge-classification"
                    style={{ 
                      backgroundColor: `${getClassificationColor(semesterGroup.classification)}15`,
                      color: getClassificationColor(semesterGroup.classification)
                    }}
                  >
                    {semesterGroup.classification}
                  </span>
                </div>
              </div>
              <div className="semester-stats">
                <div className="semester-stat">
                  <span className="stat-label">Điểm TB hệ 10:</span>
                  <span className="stat-value">
                    {semesterGroup.averageScore !== null 
                      ? semesterGroup.averageScore.toFixed(2) 
                      : '--'}
                  </span>
                </div>
                <div className="semester-stat">
                  <span className="stat-label">Điểm TB hệ 4:</span>
                  <span className="stat-value">
                    {semesterGroup.averageGPA !== null 
                      ? semesterGroup.averageGPA.toFixed(2) 
                      : '--'}
                  </span>
                </div>
              </div>
            </div>

            {/* Grades Table */}
            <div className="table-container">
              <table className="grades-table">
                <thead>
                  <tr>
                    <th className="col-stt">TT</th>
                    <th className="col-code">Mã lớp học phần</th>
                    <th className="col-subject">Tên môn học/học phần</th>
                    <th className="col-credits">Số tín chỉ</th>
                    <th className="col-score">Điểm tổng kết</th>
                    <th className="col-score">Điểm hệ 4</th>
                    <th className="col-letter">Điểm chữ</th>
                    <th className="col-note">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {semesterGroup.grades.map((grade, gradeIndex) => {
                    const gradePoint = grade.letterGrade ? getGradePoint(grade.letterGrade) : null;

                    return (
                      <tr key={`${grade.subjectCode}-${gradeIndex}`}>
                        <td className="text-center">{gradeIndex + 1}</td>
                        <td className="font-mono">{grade.subjectCode}</td>
                        <td className="font-semibold">
                          <div>{grade.subjectName}</div>
                        </td>
                        <td className="text-center">{grade.credits}</td>
                        <td className="text-center font-semibold">
                          {grade.totalScore != null ? grade.totalScore.toFixed(2) : '--'}
                        </td>
                        <td className="text-center">
                          {gradePoint != null ? gradePoint.toFixed(2) : '--'}
                        </td>
                        <td className="text-center">
                          <span 
                            className="letter-grade-badge"
                            style={{
                              backgroundColor: `${getLetterGradeColor(grade.letterGrade)}15`,
                              color: getLetterGradeColor(grade.letterGrade)
                            }}
                          >
                            {grade.letterGrade || '--'}
                          </span>
                        </td>
                        <td className="text-center">
                          
                        </td>
                        <td className="text-center text-gray-500">
                          {grade.status === 'IN_PROGRESS' ? 'Đang học' : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Semester Summary */}
            <div className="semester-summary">
              <div className="summary-item">
                <span className="summary-label">
                  Điểm trung bình học kỳ (hệ 10):
                </span>
                <span className="summary-value">
                  {semesterGroup.averageScore !== null 
                    ? semesterGroup.averageScore.toFixed(2) 
                    : '--'}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">
                  Điểm trung bình tích lũy (hệ 10):
                </span>
                <span className="summary-value">
                  {(() => {
                    const cumulativeAvgUpTo = calculateCumulativeAverageUpTo(index);
                    return cumulativeAvgUpTo !== null ? cumulativeAvgUpTo.toFixed(2) : '--';
                  })()}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">
                  Xếp loại học lực học kỳ:
                </span>
                <span 
                  className="summary-value"
                  style={{ color: getClassificationColor(semesterGroup.classification) }}
                >
                  {semesterGroup.classification}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">
                  Xếp loại học lực tích lũy:
                </span>
                <span 
                  className="summary-value"
                  style={{ color: getClassificationColor(getClassification(calculateCumulativeAverageUpTo(index))) }}
                >
                  {getClassification(calculateCumulativeAverageUpTo(index))}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">
                  Tổng số tín chỉ học kỳ:
                </span>
                <span className="summary-value">
                  {semesterGroup.totalCredits}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">
                  Số tín chỉ tích lũy:
                </span>
                <span className="summary-value">
                  {calculateCumulativeCredits(index)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grading Scale Reference */}
      <div className="reference-section">
        <h3 className="reference-title">Thang điểm tham khảo</h3>
        
        <div className="reference-grid">
          {/* Hệ 10 */}
          <div className="reference-card">
            <h4>Thang điểm hệ 10</h4>
            <div className="scale-list">
              <div className="scale-item">
                <span className="scale-range">8.5 - 10.0</span>
                <span className="scale-label" style={{ color: '#10b981' }}>
                  A (Xuất sắc)
                </span>
              </div>
              <div className="scale-item">
                <span className="scale-range">7.9 - 8.4</span>
                <span className="scale-label" style={{ color: '#3b82f6' }}>
                  Giỏi
                </span>
              </div>
              <div className="scale-item">
                <span className="scale-range">6.5 - 7.8</span>
                <span className="scale-label" style={{ color: '#f59e0b' }}>
                  Khá
                </span>
              </div>
              <div className="scale-item">
                <span className="scale-range">5.0 - 6.4</span>
                <span className="scale-label" style={{ color: '#f97316' }}>
                  Trung bình
                </span>
              </div>
              <div className="scale-item">
                <span className="scale-range">4.0 - 4.9</span>
                <span className="scale-label" style={{ color: '#ef4444' }}>
                  Yếu
                </span>
              </div>
              <div className="scale-item">
                <span className="scale-range">&lt; 4.0</span>
                <span className="scale-label" style={{ color: '#991b1b' }}>
                  Kém
                </span>
              </div>
            </div>
          </div>

          <div className="reference-card">
            <h4>Quy đổi điểm chữ và hệ 4</h4>
            <div className="scale-list">
              <div className="scale-item">
                <span className="scale-range">A (8.5-10)</span>
                <span className="scale-label">4.0</span>
              </div>
              <div className="scale-item">
                <span className="scale-range">B+ (8.0-8.4)</span>
                <span className="scale-label">3.5</span>
              </div>
              <div className="scale-item">
                <span className="scale-range">B (7.0-7.9)</span>
                <span className="scale-label">3.0</span>
              </div>
              <div className="scale-item">
                <span className="scale-range">C+ (6.5-6.9)</span>
                <span className="scale-label">2.5</span>
              </div>
              <div className="scale-item">
                <span className="scale-range">C (5.5-6.4)</span>
                <span className="scale-label">2.0</span>
              </div>
              <div className="scale-item">
                <span className="scale-range">D+ (5.0-5.4)</span>
                <span className="scale-label">1.5</span>
              </div>
              <div className="scale-item">
                <span className="scale-range">D (4.0-4.9)</span>
                <span className="scale-label">1.0</span>
              </div>
              <div className="scale-item">
                <span className="scale-range">F (&lt;4.0)</span>
                <span className="scale-label">0.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="footer-note">
        <p>
          <strong>Lưu ý:</strong> Bảng điểm này được tổng hợp từ hệ thống quản lý học tập. 
          Nếu có thắc mắc về điểm số, vui lòng liên hệ phòng Đào tạo hoặc giảng viên phụ trách môn học.
        </p>
      </div>
      <ChatList 
        currentUsername={user?.username || 'student'}
        currentRole="STUDENT"
      />
    </div>
  );
};

export default StudentTranscript;