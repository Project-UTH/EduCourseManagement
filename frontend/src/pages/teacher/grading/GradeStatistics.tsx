import { useState, useEffect } from 'react';
import gradeApi, { GradeStatsResponse, GradeResponse } from '../../../services/api/gradeApi';
import classApi from '../../../services/api/classApi';
import './GradeStatistics.css';

/**
 * GradeStatistics Component
 * 
 * Statistics and analytics page for class grades:
 * - Overall statistics cards
 * - Score distribution charts
 * - Letter grade distribution
 * - Top students ranking
 * - Pass/fail analysis
 * - Export to Excel
 * 
 * @author Phase 4 - Teacher Features
 */

const GradeStatistics = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [stats, setStats] = useState<GradeStatsResponse | null>(null);
  const [grades, setGrades] = useState<GradeResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadTeacherClasses();
  }, []);
  
  useEffect(() => {
    if (selectedClassId) {
      loadStatistics();
      loadGrades();
    } else {
      setStats(null);
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
  
  const handleExportExcel = () => {
    // TODO: Implement Excel export
    alert('Tính năng xuất Excel đang phát triển');
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
    return { range: `${i}-${i}.9`, count };
  });
  
  return (
    <div className="grade-statistics-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>📊 Thống kê điểm</h1>
          <p>Phân tích và thống kê kết quả học tập</p>
        </div>
        <button className="btn-export" onClick={handleExportExcel}>
          📥 Xuất Excel
        </button>
      </div>
      
      {/* Error */}
      {error && (
        <div className="alert alert-error">
          ❌ {error}
        </div>
      )}
      
      {/* Class Selector */}
      <div className="class-selector-wrapper">
        <select
          value={selectedClassId || ''}
          onChange={(e) => setSelectedClassId(Number(e.target.value))}
          className="class-selector"
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
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải thống kê...</p>
        </div>
      )}
      
      {/* Statistics Content */}
      {!loading && stats && (
        <>
          {/* Overall Stats Cards */}
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-content">
                <div className="stat-label">Tổng sinh viên</div>
                <div className="stat-value">{stats.overall.totalStudents}</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-label">Đã chấm điểm</div>
                <div className="stat-value">{stats.overall.gradedStudents}</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <div className="stat-label">Đang chờ</div>
                <div className="stat-value">{stats.overall.inProgress}</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <div className="stat-label">Tỷ lệ hoàn thành</div>
                <div className="stat-value">{stats.overall.completionRate?.toFixed(1) ?? '0.0'}%</div>
              </div>
            </div>
          </div>
          
          {/* Charts Row */}
          <div className="charts-row">
            {/* Score Distribution */}
            <div className="chart-card">
              <h3>📊 Phân bố điểm số</h3>
              <div className="bar-chart">
                {scoreDistribution.map((item, index) => (
                  <div key={index} className="bar-item">
                    <div 
                      className="bar" 
                      style={{ 
                        height: `${(item.count / stats.overall.totalStudents) * 100}%`,
                        minHeight: item.count > 0 ? '20px' : '0'
                      }}
                    >
                      {item.count > 0 && <span className="bar-label">{item.count}</span>}
                    </div>
                    <div className="bar-axis">{item.range.split('-')[0]}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Letter Grade Distribution */}
            <div className="chart-card">
              <h3>🎯 Phân bố điểm chữ</h3>
              <div className="letter-distribution">
                <div className="letter-item">
                  <div className="letter-badge grade-A">A</div>
                  <div className="letter-count">{stats.distribution.countA}</div>
                  <div className="letter-percent">
                    {stats.overall.gradedStudents > 0 
                      ? ((stats.distribution.countA / stats.overall.gradedStudents) * 100).toFixed(1)
                      : '0.0'}%
                  </div>
                </div>
                
                <div className="letter-item">
                  <div className="letter-badge grade-B-plus">B+</div>
                  <div className="letter-count">{stats.distribution.countBPlus}</div>
                  <div className="letter-percent">
                    {stats.overall.gradedStudents > 0
                      ? ((stats.distribution.countBPlus / stats.overall.gradedStudents) * 100).toFixed(1)
                      : '0.0'}%
                  </div>
                </div>
                
                <div className="letter-item">
                  <div className="letter-badge grade-B">B</div>
                  <div className="letter-count">{stats.distribution.countB}</div>
                  <div className="letter-percent">
                    {stats.overall.gradedStudents > 0
                      ? ((stats.distribution.countB / stats.overall.gradedStudents) * 100).toFixed(1)
                      : '0.0'}%
                  </div>
                </div>
                
                <div className="letter-item">
                  <div className="letter-badge grade-C-plus">C+</div>
                  <div className="letter-count">{stats.distribution.countCPlus}</div>
                  <div className="letter-percent">
                    {stats.overall.gradedStudents > 0
                      ? ((stats.distribution.countCPlus / stats.overall.gradedStudents) * 100).toFixed(1)
                      : '0.0'}%
                  </div>
                </div>
                
                <div className="letter-item">
                  <div className="letter-badge grade-C">C</div>
                  <div className="letter-count">{stats.distribution.countC}</div>
                  <div className="letter-percent">
                    {stats.overall.gradedStudents > 0
                      ? ((stats.distribution.countC / stats.overall.gradedStudents) * 100).toFixed(1)
                      : '0.0'}%
                  </div>
                </div>
                
                <div className="letter-item">
                  <div className="letter-badge grade-D-plus">D+</div>
                  <div className="letter-count">{stats.distribution.countDPlus}</div>
                  <div className="letter-percent">
                    {stats.overall.gradedStudents > 0
                      ? ((stats.distribution.countDPlus / stats.overall.gradedStudents) * 100).toFixed(1)
                      : '0.0'}%
                  </div>
                </div>
                
                <div className="letter-item">
                  <div className="letter-badge grade-D">D</div>
                  <div className="letter-count">{stats.distribution.countD}</div>
                  <div className="letter-percent">
                    {stats.overall.gradedStudents > 0
                      ? ((stats.distribution.countD / stats.overall.gradedStudents) * 100).toFixed(1)
                      : '0.0'}%
                  </div>
                </div>
                
                <div className="letter-item">
                  <div className="letter-badge grade-F">F</div>
                  <div className="letter-count">{stats.distribution.countF}</div>
                  <div className="letter-percent">
                    {stats.overall.gradedStudents > 0
                      ? ((stats.distribution.countF / stats.overall.gradedStudents) * 100).toFixed(1)
                      : '0.0'}%
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Top Students */}
          {topStudents.length > 0 && (
            <div className="top-students-card">
              <h3>🏆 Top {topStudents.length} sinh viên xuất sắc</h3>
              <table className="top-students-table">
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
                      <td className="rank-cell">
                        {index === 0 && <span className="medal gold">🥇</span>}
                        {index === 1 && <span className="medal silver">🥈</span>}
                        {index === 2 && <span className="medal bronze">🥉</span>}
                        {index > 2 && <span className="rank-number">{index + 1}</span>}
                      </td>
                      <td>{grade.studentInfo.studentCode}</td>
                      <td>{grade.studentInfo.fullName}</td>
                      <td className="score-cell">{grade.totalScore?.toFixed(2)}</td>
                      <td>
                        <span className={`letter-badge ${grade.letterGrade}`}>
                          {grade.letterGrade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Bottom Stats Row */}
          <div className="bottom-stats-row">
            {/* Pass/Fail Stats */}
            <div className="info-card">
              <h3>📊 Thống kê đạt/rớt</h3>
              <div className="pass-fail-stats">
                <div className="pass-stat">
                  <span className="pass-icon">✅</span>
                  <span className="pass-label">Đạt:</span>
                  <span className="pass-value">{stats.passFail.passedCount}</span>
                  <span className="pass-percent">({stats.passFail.passRate?.toFixed(1) ?? '0.0'}%)</span>
                </div>
                <div className="fail-stat">
                  <span className="fail-icon">❌</span>
                  <span className="fail-label">Rớt:</span>
                  <span className="fail-value">{stats.passFail.failedCount}</span>
                  <span className="fail-percent">
                    ({stats.passFail.passRate ? (100 - stats.passFail.passRate).toFixed(1) : '0.0'}%)
                  </span>
                </div>
              </div>
            </div>
            
            {/* Score Statistics */}
            <div className="info-card">
              <h3>📈 Điểm thống kê</h3>
              <div className="score-statistics">
                <div className="score-stat-item">
                  <span className="score-stat-label">Trung bình:</span>
                  <span className="score-stat-value">{stats.scores.average?.toFixed(2) ?? '--'}</span>
                </div>
                <div className="score-stat-item">
                  <span className="score-stat-label">Cao nhất:</span>
                  <span className="score-stat-value highlight-green">
                    {stats.scores.highest?.toFixed(2) ?? '--'}
                  </span>
                </div>
                <div className="score-stat-item">
                  <span className="score-stat-label">Thấp nhất:</span>
                  <span className="score-stat-value highlight-red">
                    {stats.scores.lowest?.toFixed(2) ?? '--'}
                  </span>
                </div>
                <div className="score-stat-item">
                  <span className="score-stat-label">Trung vị:</span>
                  <span className="score-stat-value">{stats.scores.median?.toFixed(2) ?? '--'}</span>
                </div>
                <div className="score-stat-item">
                  <span className="score-stat-label">Độ lệch chuẩn:</span>
                  <span className="score-stat-value">
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
        <div className="empty-state">
          <p>📭 Chưa có dữ liệu thống kê</p>
          <p className="empty-hint">Hãy nhập điểm cho sinh viên trước</p>
        </div>
      )}
      
      {!selectedClassId && (
        <div className="empty-state">
          <p>🎯 Vui lòng chọn lớp học để xem thống kê</p>
        </div>
      )}
    </div>
  );
};

export default GradeStatistics;