import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import classApi from '../../services/api/classApi';
import ClassAssignments from './tabs/ClassAssignments';
import ClassDocuments from './tabs/ClassDocuments';
import ClassGrading from './tabs/ClassGrading';
import ClassInfo from './tabs/ClassInfo';
import './TeacherClassDetail.css';

/**
 * TeacherClassDetail - Class detail page with 4 tabs
 * 
 * Tabs:
 * 1. 📝 Bài tập - Quản lý bài tập + Xem bài nộp
 * 2. 📁 Tài liệu - Upload/manage documents
 * 3. 📊 Điểm - Nhập điểm + Thống kê
 * 4. ℹ️ Thông tin - Class information
 */

type TabType = 'assignments' | 'documents' | 'grading' | 'info';

interface ClassDetail {
  classId: number;
  classCode: string;
  subjectName: string;
  subjectCode: string;
  credits: number;
  dayOfWeekDisplay: string;
  timeSlotDisplay: string;
  room: string;
  teacherName: string;
  studentCount: number;
  maxStudents: number;
  semesterCode: string;
}

const TeacherClassDetail = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<TabType>('assignments');
  const [classDetail, setClassDetail] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (classId) {
      loadClassDetail();
    }
  }, [classId]);

  const loadClassDetail = async () => {
    if (!classId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Load class detail from API
      const classes = await classApi.getMyClasses();
      console.log('[ClassDetail] ✅ Classes array:', classes);
      
      if (!Array.isArray(classes)) {
        console.error('[ClassDetail] ❌ Response is not an array:', classes);
        setError('Dữ liệu không hợp lệ');
        return;
      }
      
      console.log('[ClassDetail] Looking for classId:', classId);
      
      const classData = classes.find((c: any) => c.classId === Number(classId));
      
      console.log('[ClassDetail] Found class:', classData);
      
      if (!classData) {
        console.error('[ClassDetail] ❌ Class not found with ID:', classId);
        console.log('[ClassDetail] Available classes:', classes.map((c: any) => ({
          id: c.classId,
          code: c.classCode,
          name: c.subjectName
        })));
        setError('Không tìm thấy lớp học');
        return;
      }
      
      setClassDetail({
        classId: classData.classId,
        classCode: classData.classCode,
        subjectName: classData.subjectName,
        subjectCode: classData.subjectCode || 'N/A',
        credits: classData.credits || 3,
        dayOfWeekDisplay: classData.dayOfWeekDisplay || 'Chưa xếp lịch',
        timeSlotDisplay: classData.timeSlotDisplay || '',
        room: classData.fixedRoom || 'Chưa có phòng',
        teacherName: classData.teacherName || 'N/A',
        studentCount: (classData as any).studentCount || 0,
        maxStudents: classData.maxStudents || 40,
        semesterCode: classData.semesterCode || 'N/A'
      });
      
    } catch (err: any) {
      console.error('[ClassDetail] Failed to load:', err);
      setError('Không thể tải thông tin lớp học');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'assignments' as TabType, label: 'Bài tập', icon: '📝' },
    { id: 'documents' as TabType, label: 'Tài liệu', icon: '📁' },
    { id: 'grading' as TabType, label: 'Điểm', icon: '📊' },
    { id: 'info' as TabType, label: 'Thông tin', icon: 'ℹ️' }
  ];

  if (loading) {
    return (
      <div className="class-detail-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải thông tin lớp học...</p>
        </div>
      </div>
    );
  }

  if (error || !classDetail) {
    return (
      <div className="class-detail-container">
        <div className="error-state">
          <p>{error || 'Không tìm thấy lớp học'}</p>
          <button onClick={() => navigate('/teacher/dashboard')} className="btn-back">
            ← Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="class-detail-container">
      {/* Header */}
      <div className="class-detail-header">
        <button 
          className="btn-back-simple"
          onClick={() => navigate('/teacher/dashboard')}
        >
          ← Quay lại
        </button>
        
        <div className="class-header-content">
          <div className="class-title-section">
            <h1>{classDetail.subjectName}</h1>
            <span className="class-code-badge">{classDetail.classCode}</span>
          </div>
          
          <div className="class-meta-info">
            <div className="meta-item">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{classDetail.dayOfWeekDisplay}, {classDetail.timeSlotDisplay}</span>
            </div>
            
            <div className="meta-item">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>Phòng {classDetail.room}</span>
            </div>
            
            <div className="meta-item">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>{classDetail.studentCount}/{classDetail.maxStudents} sinh viên</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'assignments' && (
          <ClassAssignments classId={Number(classId)} />
        )}
        
        {activeTab === 'documents' && (
          <ClassDocuments classId={Number(classId)} />
        )}
        
        {activeTab === 'grading' && (
          <ClassGrading classId={Number(classId)} />
        )}
        
        {activeTab === 'info' && (
          <ClassInfo classDetail={classDetail} />
        )}
      </div>
    </div>
  );
};

export default TeacherClassDetail;