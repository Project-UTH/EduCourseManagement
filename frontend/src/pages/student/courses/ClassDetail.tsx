import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import studentClassApi from '../../../services/api/studentClassApi';
import AssignmentsTab from './AssignmentsTab';
import GradesTab from './GradesTab';
import MaterialsTab from './MaterialsTab';
import InfoTab from './InfoTab';
import './ClassDetail.css';
import { useAuthStore } from '@/store/authStore';
import ChatList from '../../../components/chat/ChatList';

/**
 * ClassDetail - Chi tiết lớp học với 4 tabs
 * 
 * URL: /student/courses/:classId
 * Tabs: Bài tập, Tài liệu, Điểm, Thông tin
 */

interface ClassInfo {
  classId: number;
  classCode: string;
  subjectName: string;
  teacherName: string;
  schedule: string;
  room: string;
  semesterName: string;
  credits: number;
  maxStudents: number;
  enrolledCount: number;
}

const ClassDetail = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('assignments');
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClassInfo();
  }, [classId]);

  const loadClassInfo = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[ClassDetail] Loading class info for ID:', classId);
      
      // Get class detail from API
      const data = await studentClassApi.getMyClasses();
      const classData = data.find((c: any) => c.classId === Number(classId));

      if (!classData) {
        setError('Không tìm thấy lớp học');
        return;
      }

      const info: ClassInfo = {
        classId: classData.classId,
        classCode: classData.classCode,
        subjectName: classData.subjectName,
        teacherName: classData.teacherName,
        schedule: classData.schedule || 'Chưa xếp lịch',
        room: classData.roomName || 'Chưa có phòng',
        semesterName: classData.semesterName || 'HK II 2025-2026',
        credits: classData.credits || 3,
        maxStudents: classData.maxStudents,
        enrolledCount: classData.currentStudents || 0
      };

      setClassInfo(info);
      console.log('[ClassDetail] ✅ Class info loaded:', info);

    } catch (err: any) {
      console.error('[ClassDetail] ❌ Failed to load class info:', err);
      setError('Không thể tải thông tin lớp học');
    } finally {
      setLoading(false);
    }
  };
  const user = useAuthStore((state: any) => state.user);

  if (loading) {
    return (
      <div className="class-detail">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải thông tin lớp học...</p>
        </div>
      </div>
    );
  }

  if (error || !classInfo) {
    return (
      <div className="class-detail">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>{error || 'Không tìm thấy lớp học'}</h3>
          <button 
            className="btn-back"
            onClick={() => navigate('/student/dashboard')}
          >
            ← Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="class-detail">
      {/* Header */}
      <div className="class-header">
        <button 
          className="btn-back"
          onClick={() => navigate('/student/dashboard')}
        >
          ← Quay lại
        </button>

        <div className="header-content">
          <div className="header-left">
            <h1>{classInfo.subjectName}</h1>
            <div className="header-meta">
              <span className="class-code">{classInfo.classCode}</span>
              <span className="separator">•</span>
              <span className="credits">{classInfo.credits} tín chỉ</span>
              <span className="separator">•</span>
              <span className="semester">{classInfo.semesterName}</span>
            </div>
          </div>

          <div className="header-right">
            <div className="info-card">
              <div className="info-icon">👨‍🏫</div>
              <div className="info-content">
                <span className="info-label">Giảng viên</span>
                <span className="info-value">{classInfo.teacherName}</span>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">📅</div>
              <div className="info-content">
                <span className="info-label">Lịch học</span>
                <span className="info-value">{classInfo.schedule}</span>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">🏫</div>
              <div className="info-content">
                <span className="info-label">Phòng học</span>
                <span className="info-value">Phòng {classInfo.room}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs-nav">
          <button
            className={`tab-btn ${activeTab === 'assignments' ? 'active' : ''}`}
            onClick={() => setActiveTab('assignments')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Bài tập
          </button>

          <button
            className={`tab-btn ${activeTab === 'materials' ? 'active' : ''}`}
            onClick={() => setActiveTab('materials')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Tài liệu
          </button>

          <button
            className={`tab-btn ${activeTab === 'grades' ? 'active' : ''}`}
            onClick={() => setActiveTab('grades')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Điểm
          </button>

          <button
            className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Thông tin
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'assignments' && (
            <AssignmentsTab classId={Number(classId)} />
          )}
          
          {activeTab === 'materials' && (
            <MaterialsTab classId={Number(classId)} />
          )}
          
          {activeTab === 'grades' && (
            <GradesTab classId={Number(classId)} />
          )}
          
          {activeTab === 'info' && (
            <InfoTab classInfo={classInfo} />
          )}
        </div>
      </div>
      <ChatList 
        currentUsername={user?.username || 'student'}
        currentRole="STUDENT"
      />
    </div>
  );
};

export default ClassDetail;