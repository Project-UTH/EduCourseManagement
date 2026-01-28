import { useState, useEffect } from 'react';
import gradeApi, { GradeStatsResponse, GradeResponse } from '../../../services/api/gradeApi';
import classApi from '../../../services/api/classApi';
import teacherApi from '../../../services/api/teacherApi';
import { message } from 'antd';
import './GradeStatistics.css';
import ChatList from '../../../components/chat/ChatList';
import { useAuthStore } from '@/store/authStore';


/**
 * GradeStatistics Component - Namespaced (tgs-)
 * Statistics and analytics page for class grades
 * 
 * @updated 2026-01-28 - Added Excel export functionality
 */

const GradeStatistics = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [stats, setStats] = useState<GradeStatsResponse | null>(null);
  const [grades, setGrades] = useState<GradeResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadTeacherClasses();
  }, []);
  
  useEffect(() => {
    if (selectedClassId) {
      loadStatistics();
      loadGrades();
      
      // Update selected class object
      const cls = classes.find(c => c.classId === selectedClassId);
      setSelectedClass(cls);
    } else {
      setStats(null);
      setGrades([]);
      setSelectedClass(null);
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
      console.error('Failed to load classes:', err);
      showError('Không thể tải danh sách lớp');
    }
  };
  
  const loadStatistics = async () => {
    if (!selectedClassId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await gradeApi.getClassStats(selectedClassId);
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load statistics:', err);
      showError('Không thể tải thống kê');
    } finally {
      setLoading(false);
    }
  };
  
  const loadGrades = async () => {
    if (!selectedClassId) return;
    
    try {
      const data = await gradeApi.getGradesByClass(selectedClassId);
      setGrades(data);
    } catch (err: any) {
      console.error('Failed to load grades:', err);
    }
  };
  
  /**
   * Handle Excel export
   * Downloads grade statistics as Excel file
   */
  const handleExportExcel = async () => {
    if (!selectedClassId) {
      message.warning('Vui lòng chọn lớp học trước!');
      return;
    }

    try {
      setExportingExcel(true);
      
      // Call API to get Excel file
      const response = await teacherApi.exportGradeStatisticsExcel(selectedClassId);
      
      // Create blob from response
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // Generate filename
      const filename = `ThongKeDiem_${selectedClass?.classCode || 'Class'}_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;
      
      link.setAttribute("download", filename);
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Show success message
      message.success('Xuất Excel thành công!');
    } catch (error: any) {
      console.error('Error exporting Excel:', error);
      message.error(
        error.response?.data?.message || 'Không thể xuất Excel. Vui lòng thử lại!'
      );
    } finally {
      setExportingExcel(false);
    }
  };
  
  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };
  
  // Get top 10 students
  const topStudents = grades
    .filter(g => g.totalScore !== null && g.totalScore !== undefined)
    .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
    .slice(0, 10);
  
  // Calculate score distribution (0-10 range, 1-point intervals)
  const scoreDistribution = Array.from({ length: 11 }, (_, i) => {
    const min = i;
    const max = i + 0.99;
    const count = grades.filter(g => {
      const score = g.totalScore;
      return score !== null && score !== undefined && score >= min && score < max + 0.01;
    }).length;
    return { range: `${i}-${i === 10 ? 10 : i + 0.9}`, count };
  });
  
  // Helper to calculate height safely
  const getBarHeight = (count: number, total: number) => {
    if (total === 0) return '0%';
    const pct = (count / total) * 100;
    return `${Math.max(pct, 2)}%`; // Min 2% height for visibility
  };
  const user = useAuthStore((state: any) => state.user);
  
  return (
    <div className="tgs-container">
      {/* Header */}
      <div className="tgs-header">
        <div className="tgs-header-content">
          <h1>📊 Thống kê điểm</h1>
          <p>Phân tích và thống kê kết quả học tập</p>
        </div>
        <button 
          className="tgs-btn-export" 
          onClick={handleExportExcel}
          disabled={exportingExcel || !selectedClassId}
        >
          {exportingExcel ? '⏳ Đang xuất...' : '📥 Xuất Excel'}
        </button>
      </div>
      
      {/* Error */}
      {error && (
        <div className="tgs-alert tgs-alert-error">
          <span>❌ {error}</span>
        </div>
      )}
      
      {/* Filters */}
      <div className="tgs-filters">
        <select
          value={selectedClassId || ''}
          onChange={(e) => setSelectedClassId(Number(e.target.value))}
          className="tgs-select"
        >
          <option value="">-- Chọn lớp học --</option>
          {classes.map(cls => (
            <option key={cls.classId} value={cls.classId}>
              {cls.classCode} - {cls.subjectName}
            </option>
          ))}
        </select>
      </div>
      
      {/* Loading */}
      {loading && (
        <div className="tgs-loading">
          <div className="tgs-spinner"></div>
          <p>Đang tải thống kê...</p>
        </div>
      )}
      
      {/* Content */}
      {!loading && stats && (
        <>
          {/* Stats Cards */}
          <div className="tgs-stats-grid">
            <div className="tgs-stat-card">
              <div className="tgs-stat-icon">📚</div>
              <div className="tgs-stat-content">
                <div className="tgs-stat-label">Tổng sinh viên</div>
                <div className="tgs-stat-value">{stats.overall.totalStudents}</div>
              </div>
            </div>
            
            <div className="tgs-stat-card">
              <div className="tgs-stat-icon">✅</div>
              <div className="tgs-stat-content">
                <div className="tgs-stat-label">Đã chấm điểm</div>
                <div className="tgs-stat-value">{stats.overall.gradedStudents}</div>
              </div>
            </div>
            
            <div className="tgs-stat-card">
              <div className="tgs-stat-icon">⏳</div>
              <div className="tgs-stat-content">
                <div className="tgs-stat-label">Đang chờ</div>
                <div className="tgs-stat-value">{stats.overall.inProgress}</div>
              </div>
            </div>
            
            <div className="tgs-stat-card">
              <div className="tgs-stat-icon">📈</div>
              <div className="tgs-stat-content">
                <div className="tgs-stat-label">Tỷ lệ hoàn thành</div>
                <div className="tgs-stat-value">{stats.overall.completionRate?.toFixed(1) ?? '0.0'}%</div>
              </div>
            </div>
          </div>
          
          {/* Charts Row */}
          <div className="tgs-charts-row">
            {/* Score Distribution */}
            <div className="tgs-chart-card">
              <h3>📊 Phân bố điểm số</h3>
              <div className="tgs-bar-chart">
                {scoreDistribution.map((item, index) => (
                  <div key={index} className="tgs-bar-item">
                    <div 
                      className="tgs-bar" 
                      style={{ 
                        height: getBarHeight(item.count, stats.overall.totalStudents)
                      }}
                    >
                      {item.count > 0 && <span className="tgs-bar-label">{item.count}</span>}
                    </div>
                    <div className="tgs-bar-axis">{item.range.split('-')[0]}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Letter Grade Distribution */}
            <div className="tgs-chart-card">
              <h3>🎯 Phân bố điểm chữ</h3>
              <div className="tgs-letter-grid">
                {[
                  { grade: 'A', count: stats.distribution.countA, class: 'tgs-grade-A' },
                  { grade: 'B+', count: stats.distribution.countBPlus, class: 'tgs-grade-B-plus' },
                  { grade: 'B', count: stats.distribution.countB, class: 'tgs-grade-B' },
                  { grade: 'C+', count: stats.distribution.countCPlus, class: 'tgs-grade-C-plus' },
                  { grade: 'C', count: stats.distribution.countC, class: 'tgs-grade-C' },
                  { grade: 'D+', count: stats.distribution.countDPlus, class: 'tgs-grade-D-plus' },
                  { grade: 'D', count: stats.distribution.countD, class: 'tgs-grade-D' },
                  { grade: 'F', count: stats.distribution.countF, class: 'tgs-grade-F' }
                ].map((item) => (
                  <div key={item.grade} className="tgs-letter-item">
                    <div className={`tgs-badge ${item.class}`}>{item.grade}</div>
                    <div className="tgs-letter-count">{item.count}</div>
                    <div className="tgs-letter-percent">
                      {stats.overall.gradedStudents > 0 
                        ? ((item.count / stats.overall.gradedStudents) * 100).toFixed(1)
                        : '0.0'}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Top Students */}
          {topStudents.length > 0 && (
            <div className="tgs-top-card">
              <h3>🏆 Top {topStudents.length} sinh viên xuất sắc</h3>
              <div className="tgs-table-wrapper">
                <table className="tgs-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>#</th>
                      <th style={{ width: '120px' }}>MSSV</th>
                      <th>Họ tên</th>
                      <th style={{ width: '100px' }}>Điểm TB</th>
                      <th style={{ width: '80px' }}>Xếp loại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topStudents.map((grade, index) => (
                      <tr key={grade.gradeId}>
                        <td className="tgs-rank-cell">
                          {index === 0 && <span className="tgs-medal">🥇</span>}
                          {index === 1 && <span className="tgs-medal">🥈</span>}
                          {index === 2 && <span className="tgs-medal">🥉</span>}
                          {index > 2 && <span className="tgs-rank-num">{index + 1}</span>}
                        </td>
                        <td>{grade.studentInfo.studentCode}</td>
                        <td>{grade.studentInfo.fullName}</td>
                        <td className="tgs-score-val">{grade.totalScore?.toFixed(2)}</td>
                        <td>
                          <span className={`tgs-badge tgs-grade-${grade.letterGrade?.replace('+', '-plus') || 'F'}`}>
                            {grade.letterGrade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Bottom Stats Row */}
          <div className="tgs-bottom-row">
            {/* Pass/Fail Stats */}
            <div className="tgs-info-card">
              <h3>📊 Thống kê đạt/rớt</h3>
              <div className="tgs-pf-list">
                <div className="tgs-pf-item tgs-pass">
                  <span className="tgs-pf-icon">✅</span>
                  <span className="tgs-pf-label">Đạt:</span>
                  <span className="tgs-pf-val">{stats.passFail.passedCount}</span>
                  <span className="tgs-pf-pct">({stats.passFail.passRate?.toFixed(1) ?? '0.0'}%)</span>
                </div>
                <div className="tgs-pf-item tgs-fail">
                  <span className="tgs-pf-icon">❌</span>
                  <span className="tgs-pf-label">Rớt:</span>
                  <span className="tgs-pf-val">{stats.passFail.failedCount}</span>
                  <span className="tgs-pf-pct">
                    ({stats.passFail.passRate ? (100 - stats.passFail.passRate).toFixed(1) : '0.0'}%)
                  </span>
                </div>
              </div>
            </div>
            
            {/* Score Statistics */}
            <div className="tgs-info-card">
              <h3>📈 Điểm thống kê</h3>
              <div className="tgs-score-list">
                <div className="tgs-score-item">
                  <span className="tgs-score-label">Trung bình:</span>
                  <span className="tgs-score-num">{stats.scores.average?.toFixed(2) ?? '--'}</span>
                </div>
                <div className="tgs-score-item">
                  <span className="tgs-score-label">Cao nhất:</span>
                  <span className="tgs-score-num tgs-high-green">
                    {stats.scores.highest?.toFixed(2) ?? '--'}
                  </span>
                </div>
                <div className="tgs-score-item">
                  <span className="tgs-score-label">Thấp nhất:</span>
                  <span className="tgs-score-num tgs-high-red">
                    {stats.scores.lowest?.toFixed(2) ?? '--'}
                  </span>
                </div>
                <div className="tgs-score-item">
                  <span className="tgs-score-label">Trung vị:</span>
                  <span className="tgs-score-num">{stats.scores.median?.toFixed(2) ?? '--'}</span>
                </div>
                <div className="tgs-score-item">
                  <span className="tgs-score-label">Độ lệch chuẩn:</span>
                  <span className="tgs-score-num">
                    {stats.scores.standardDeviation?.toFixed(2) ?? '--'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Empty State */}
      {!loading && !stats && selectedClassId && (
        <div className="tgs-empty">
          <p>📭 Chưa có dữ liệu thống kê</p>
          <span className="tgs-hint">Hãy nhập điểm cho sinh viên trước</span>
        </div>
      )}
      
      {!selectedClassId && (
        <div className="tgs-empty">
          <p>🎯 Vui lòng chọn lớp học để xem thống kê</p>
        </div>
      )}
      <ChatList currentUsername={user?.username || 'teacher'} currentRole="TEACHER" />
    </div>
  );
};

export default GradeStatistics;