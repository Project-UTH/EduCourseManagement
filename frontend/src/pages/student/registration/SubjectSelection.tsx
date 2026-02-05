import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../services/api/apiClient';
import registrationApi, { RegistrationResponse } from '../../../services/api/registrationApi';
import { useAuthStore } from '@/store/authStore';
// CHỈNH SỬA: Import file CSS độc lập
import './SubjectSelection.css';
import ChatList from '../../../components/chat/ChatList';


interface Subject {
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
  departmentName: string;
  departmentKnowledgeType?: string;
  majorName?: string;
  prerequisites?: PrerequisiteInfo[];
}

interface PrerequisiteInfo {
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
  isCompleted: boolean;
  totalScore: number | null;
}

interface Semester {
  semesterId: number;
  semesterCode: string;
  semesterName: string;
  status: string;
}

// Inline Prerequisites Badge Component
const PrerequisitesBadge: React.FC<{ prerequisites: PrerequisiteInfo[] }> = ({ prerequisites }) => {
  if (!prerequisites || prerequisites.length === 0) {
    return <span className="text-muted">Không</span>;
  }

  const hasIncomplete = prerequisites.some(p => !p.isCompleted);

  return (
    <div className="prerequisites-inline">
      {hasIncomplete && (
        <span className="warning-icon" title="Chưa hoàn thành môn tiên quyết">
        </span>
      )}
      <div className="prereq-list">
        {prerequisites.map((prereq) => (
          <div 
            key={prereq.subjectId} 
            className={`prereq-badge ${prereq.isCompleted ? 'completed' : 'incomplete'}`}
            title={prereq.isCompleted 
              ? `Đã hoàn thành (Điểm: ${prereq.totalScore?.toFixed(1) || 'N/A'})`
              : `Chưa hoàn thành`
            }
          >
            <span className="prereq-text">
              {prereq.subjectName}
              <small> ({prereq.subjectCode})</small>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SubjectSelection: React.FC = () => {
  const navigate = useNavigate();
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  
  const [myRegistrations, setMyRegistrations] = useState<RegistrationResponse[]>([]);

  useEffect(() => {
    fetchSemesters();
    fetchSubjects();
    fetchMyRegistrations();
  }, []);

  useEffect(() => {
    if (selectedSemesterId !== null) {
      fetchSubjects();
    }
  }, [selectedSemesterId]);

  const fetchSemesters = async () => {
    try {
      console.log('Fetching semesters...');
      const response = await apiClient.get('/api/student/semesters');
      
      if (response.data && response.data.success) {
        const sems = response.data.data || [];
        setSemesters(sems);
        
        const upcomingSem = sems.find((s: Semester) => s.status === 'UPCOMING');
        if (upcomingSem) {
          setSelectedSemesterId(upcomingSem.semesterId);
        } else {
          const activeSem = sems.find((s: Semester) => s.status === 'ACTIVE');
          if (activeSem) {
            setSelectedSemesterId(activeSem.semesterId);
          } else if (sems.length > 0) {
            setSelectedSemesterId(sems[0].semesterId);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching semesters:', error);
    }
  };

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const url = selectedSemesterId 
        ? `/api/student/subjects/available?semesterId=${selectedSemesterId}`
        : '/api/student/subjects/available';
      
      const response = await apiClient.get(url);
      
      if (response.data && response.data.success) {
        const subjectList = response.data.data || [];
        setSubjects(subjectList);
      }
    } catch (error: unknown) {
      console.error('Error fetching subjects:', error);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRegistrations = async () => {
    try {
      const response = await registrationApi.getMyRegistrations();
      
      if (response.data.success) {
        const allRegs = response.data.data || [];
        
        const filteredRegs = allRegs.filter((reg: RegistrationResponse) => {
          if (reg.status !== 'REGISTERED') return false;
          if (reg.semesterStatus) {
            return reg.semesterStatus === 'UPCOMING' || reg.semesterStatus === 'ACTIVE';
          }
          return true;
        });
        
        setMyRegistrations(filteredRegs);
      }
    } catch (error: unknown) {
      console.error('Error fetching my registrations:', error);
    } 
  };

  const handleDrop = async (reg: RegistrationResponse) => {
    const canDrop = !reg.semesterStatus || reg.semesterStatus === 'UPCOMING';
    
    if (!canDrop) {
      alert('Không thể hủy đăng ký lớp đang học!\n\nChỉ có thể hủy lớp của học kỳ chưa bắt đầu.');
      return;
    }
    
    if (!window.confirm(
      `Bạn có chắc muốn hủy đăng ký?\n\n` +
      `Môn: ${reg.subjectName}\n` +
      `Lớp: ${reg.classCode}\n` +
      `Học kỳ: ${reg.semesterName}`
    )) {
      return;
    }

    try {
      const response = await registrationApi.dropClass(reg.registrationId);
      
      if (response.data.success) {
        alert('Hủy đăng ký thành công!');
        fetchMyRegistrations();
      }
    } catch (error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const err = error as {
      response?: { data?: { message?: string } };
    };

    alert( (err.response?.data?.message ?? 'Hủy đăng ký thất bại!'));
  } else {
    alert(' Hủy đăng ký thất bại!');
  }
}

  };

  const handleViewClasses = () => {
    if (!selectedSubjectId) {
      alert('Vui lòng chọn môn học!');
      return;
    }
    
    const url = selectedSemesterId 
      ? `/student/classes/${selectedSubjectId}?semesterId=${selectedSemesterId}`
      : `/student/classes/${selectedSubjectId}`;
    
    navigate(url);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSemesterBadge = (status?: string) => {
    if (!status) return null;
    const badges: Record<string, { text: string; className: string }> = {
      'UPCOMING': { text: ' Sắp diễn ra', className: 'upcoming' },
      'ACTIVE': { text: ' Đang học', className: 'active' }
    };
    const badge = badges[status] || { text: status, className: 'default' };
    return <span className={`semester-badge ${badge.className}`}>{badge.text}</span>;
  };

  const searchFilteredSubjects = subjects.filter(subject =>
    subject.subjectCode.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    subject.subjectName.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const registeredSubjectIds = new Set(
    myRegistrations
      .filter(reg => reg.status === 'REGISTERED')
      .map(reg => reg.subjectId)
  );

  const filteredSubjects = searchFilteredSubjects.filter(subject => 
    !registeredSubjectIds.has(subject.subjectId)
  );
  const user = useAuthStore((state) => state.user);

  if (loading && subjects.length === 0) {
    return (
      <div className="subject-selection-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải danh sách môn học...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="subject-selection-page">
      {/* ============ SECTION 1: SUBJECT SELECTION ============ */}
      <div className="page-header">
        <h1>Đăng ký học phần</h1>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="semester-filter">
          <label htmlFor="semester-select">Học kỳ:</label>
          <select 
            id="semester-select"
            value={selectedSemesterId || ''} 
            onChange={(e) => setSelectedSemesterId(Number(e.target.value) || null)}
            className="semester-select"
          >
            <option value="">-- Tất cả học kỳ --</option>
            {semesters.map(sem => (
              <option key={sem.semesterId} value={sem.semesterId}>
                {sem.semesterName || sem.semesterCode}
                {sem.status === 'UPCOMING' && ' (Sắp diễn ra)'}
                {sem.status === 'ACTIVE' && ' (Đang diễn ra)'}
              </option>
            ))}
          </select>
          <div className="search-filter">
          <input
            type="text"
            placeholder="Tìm kiếm theo mã hoặc tên môn học..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="search-input"
          />
        </div>
        </div>

        
      </div>

      {/* Subjects Table */}
      <div className="table-container">
        <table className="subjects-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}></th>
              <th style={{ width: '60px' }}>STT</th>
              <th style={{ width: '120px' }}>Mã học phần</th>
              <th>Tên học phần</th>
              <th style={{ width: '60px' }}>TC</th>
              <th style={{ width: '100px' }}>Bắt buộc</th>
              <th style={{ width: '250px' }}>Điều kiện đăng ký</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubjects.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-data">
                  {loading ? (
                    <>
                      <div className="spinner-small"></div>
                      Đang tải...
                    </>
                  ) : (
                    <>
                      <p>Không có môn học nào!</p>
                      <small>
                        {searchKeyword 
                          ? 'Thử tìm kiếm với từ khóa khác' 
                          : 'Vui lòng liên hệ phòng đào tạo'}
                      </small>
                    </>
                  )}
                </td>
              </tr>
            ) : (
              filteredSubjects.map((subject, index) => (
                <tr
                  key={subject.subjectId}
                  className={selectedSubjectId === subject.subjectId ? 'selected-row' : ''}
                  onClick={() => setSelectedSubjectId(subject.subjectId)}
                >
                  <td>
                    <input
                      type="radio"
                      name="subject"
                      checked={selectedSubjectId === subject.subjectId}
                      onChange={() => setSelectedSubjectId(subject.subjectId)}
                    />
                  </td>
                  <td>{index + 1}</td>
                  <td><strong>{subject.subjectCode}</strong></td>
                  <td className="subject-name">{subject.subjectName}</td>
                  <td className="text-center">{subject.credits}</td>
                  <td className="text-center">
                    {subject.departmentKnowledgeType === 'BASIC' ? (
                      <span className="badge badge-required" title="Đại cương - Bắt buộc">✓</span>
                    ) : (
                      <span className="badge badge-optional" title="Chuyên ngành">○</span>
                    )}
                  </td>
                  <td className="prerequisites-cell">
                    {subject.prerequisites && subject.prerequisites.length > 0 ? (
                      <PrerequisitesBadge prerequisites={subject.prerequisites} />
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button 
          onClick={handleViewClasses}
          disabled={!selectedSubjectId}
          className="btn-view-classes"
        >
          XEM LỚP HỌC PHẦN
        </button>
      </div>

      {/* ============ SECTION 2: MY REGISTRATIONS ============ */}
      {myRegistrations.length > 0 && (
        <div className="my-registrations-section">
          <div className="section-header">
            <h2>Lớp đã đăng ký ({myRegistrations.length})</h2>
          </div>

          <div className="registrations-grid">
            {myRegistrations.map((reg) => {
              const canDrop = !reg.semesterStatus || reg.semesterStatus === 'UPCOMING';
              
              return (
                <div key={reg.registrationId} className="registration-card">
                  <div className="card-header">
                    <h3>{reg.subjectName}</h3>
                    {getSemesterBadge(reg.semesterStatus)}
                  </div>

                  <div className="card-body">
                    <div className="info-row">
                      <span className="label">Mã lớp:</span>
                      <span className="value">{reg.classCode}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Mã môn:</span>
                      <span className="value">{reg.subjectCode}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Tín chỉ:</span>
                      <span className="value">{reg.credits} TC</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Giảng viên:</span>
                      <span className="value">{reg.teacherName}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Lịch học:</span>
                      <span className="value">{reg.dayOfWeekDisplay}, {reg.timeSlotDisplay}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Phòng:</span>
                      <span className="value">{reg.room}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Học kỳ:</span>
                      <span className="value">{reg.semesterName}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Đăng ký lúc:</span>
                      <span className="value small">{formatDate(reg.registeredAt)}</span>
                    </div>
                  </div>

                  <div className="card-footer">
                    {canDrop ? (
                      <button onClick={() => handleDrop(reg)} className="btn-drop">
                      Hủy đăng ký
                      </button>
                    ) : (
                      <div className="drop-disabled">
                      Không thể hủy lớp đang học
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">Tổng số lớp:</span>
              <span className="stat-value">{myRegistrations.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Sắp diễn ra:</span>
              <span className="stat-value upcoming">
                {myRegistrations.filter(r => r.semesterStatus === 'UPCOMING').length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Đang học:</span>
              <span className="stat-value active">
                {myRegistrations.filter(r => r.semesterStatus === 'ACTIVE').length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Tổng tín chỉ:</span>
              <span className="stat-value credits">
                {myRegistrations.reduce((sum, r) => sum + r.credits, 0)} TC
              </span>
            </div>
          </div>
        </div>
      )}
      <ChatList 
        currentUsername={user?.username || 'student'}
        currentRole="STUDENT"
      />
    </div>
  );
};

export default SubjectSelection;