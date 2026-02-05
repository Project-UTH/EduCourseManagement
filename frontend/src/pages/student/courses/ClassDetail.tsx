import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import studentClassApi  from '../../../services/api/studentClassApi';
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
  description?: string; //  NEW: Subject description
}
interface ClassDetailResponse {
  classId: number;
  classCode: string;
  enrolledCount: number;
  maxStudents: number;

  subject?: {
    subjectName: string;
    credits: number;
    description?: string;
  };

  teacher?: {
    fullName: string;
  };

  semester?: {
    semesterName: string;
  };

  room?: {
    roomName: string;
  };

  schedule?: {
    dayOfWeek: number;
    timeSlotName: string;
  }[];

  // fallback fields (flat)
  subjectName?: string;
  teacherName?: string;
  semesterName?: string;
  roomName?: string;
  credits?: number;
  subjectDescription?: string;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const loadClassInfo = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[ClassDetail] Loading class info for ID:', classId);
      
      //  FIX: Use getClassDetail for full data
      const classDetail: ClassDetailResponse = await studentClassApi.getClassDetail(Number(classId!));
      
      console.log('[ClassDetail] FULL Response:', JSON.stringify(classDetail, null, 2));
      console.log('[ClassDetail] subject:', classDetail.subject);
      console.log('[ClassDetail] teacher:', classDetail.teacher);
      console.log('[ClassDetail] semester:', classDetail.semester);
      console.log('[ClassDetail] room:', classDetail.room);
      console.log('[ClassDetail] enrolledCount:', classDetail.enrolledCount);
      console.log('[ClassDetail] maxStudents:', classDetail.maxStudents);

      if (!classDetail) {
        setError('Không tìm thấy lớp học');
        return;
      }

      // Helper to convert day number to Vietnamese
      const getDayName = (dayNum: number) => {
        const days: Record<number, string> = {
          2: 'Thứ 2', 3: 'Thứ 3', 4: 'Thứ 4',
          5: 'Thứ 5', 6: 'Thứ 6', 7: 'Thứ 7', 8: 'Chủ nhật'
        };
        return days[dayNum] || 'Không xác định';
      };

      //  FIX: Handle both flat and nested structures
     const info: ClassInfo = {
  classId: classDetail.classId,
  classCode: classDetail.classCode,

  subjectName:
    classDetail.subject?.subjectName ??
    classDetail.subjectName ??
    'Không rõ',

  teacherName:
    classDetail.teacher?.fullName ??
    classDetail.teacherName ??
    'Không rõ',

  schedule:
    classDetail.schedule && classDetail.schedule.length > 0
      ? `${getDayName(classDetail.schedule[0].dayOfWeek)}, ${classDetail.schedule[0].timeSlotName}`
      : 'Chưa xếp lịch',

  room:
    classDetail.room?.roomName ??
    classDetail.roomName ??
    'Chưa có phòng',

  semesterName:
    classDetail.semester?.semesterName ??
    classDetail.semesterName ??
    'Chưa xác định',

  credits:
    classDetail.subject?.credits ??
    classDetail.credits ??
    3,

  maxStudents: classDetail.maxStudents ?? 50,
  enrolledCount: classDetail.enrolledCount ?? 0,

  description:
    classDetail.subject?.description ??
    classDetail.subjectDescription
};


      console.log(' [ClassDetail] Description:', info.description); // Debug log

      setClassInfo(info);
      console.log('[ClassDetail]  Class info loaded:', info);
      console.log(' [ClassDetail] FINAL Sĩ số:', info.enrolledCount, '/', info.maxStudents);

    } catch (err: unknown) {
      console.error('[ClassDetail]  Failed to load class info:', err);
      console.error('[ClassDetail]  Error details:', err instanceof Error ? err.message : 'Unknown error');
      setError('Không thể tải thông tin lớp học');
    } finally {
      setLoading(false);
    }
  };

  const user = useAuthStore((state) => state.user);

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
          <h3>{error || 'Không tìm thấy lớp học'}</h3>
          <button 
            className="btn-back"
            onClick={() => navigate('/student/dashboard')}
          >
            ← Quay lại 
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
              <div className="info-content">
                <span className="info-label">Giảng viên</span>
                <span className="info-value">{classInfo.teacherName}</span>
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