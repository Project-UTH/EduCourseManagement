import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api/apiClient';
import './SubjectSelection.css';

interface Subject {
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
  departmentName: string;
  departmentKnowledgeType?: string;
  majorName?: string;
}

interface Semester {
  semesterId: number;
  semesterCode: string;
  semesterName: string;
  status: string;
}

const SubjectSelection: React.FC = () => {
  const navigate = useNavigate();
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  // Load semesters when component mounts
  useEffect(() => {
    fetchSemesters();
  }, []);

  // Load all subjects when component mounts (NO DEPENDENCY ON SEMESTER)
  useEffect(() => {
    fetchSubjects();
  }, []);
  useEffect(() => {
  if (selectedSemesterId !== null) {
    fetchSubjects();
  }
}, [selectedSemesterId]);

  const fetchSemesters = async () => {
    try {
      console.log('🔍 Fetching semesters...');
      const response = await apiClient.get('/api/student/semesters');
      console.log('📅 Semesters response:', response.data);
      
      if (response.data && response.data.success) {
        const sems = response.data.data || [];
        setSemesters(sems);
        
        // Auto-select first active semester
        const activeSem = sems.find((s: Semester) => s.status === 'ACTIVE');
        if (activeSem) {
          setSelectedSemesterId(activeSem.semesterId);
        } else if (sems.length > 0) {
          setSelectedSemesterId(sems[0].semesterId);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching semesters:', error);
      // Not critical - can still show subjects
    }
  };

  const fetchSubjects = async () => {
  setLoading(true);
  try {
    console.log('🔍 Fetching subjects for semester:', selectedSemesterId);
    
    // Gửi semesterId nếu có
    const url = selectedSemesterId 
      ? `/api/student/subjects/available?semesterId=${selectedSemesterId}`
      : '/api/student/subjects/available';
    
    const response = await apiClient.get(url);
    
    console.log('📚 Subjects response:', response.data);
    
    if (response.data && response.data.success) {
      const subjectList = response.data.data || [];
      console.log(`✅ Received ${subjectList.length} subjects`);
      setSubjects(subjectList);
    }
  } catch (error: any) {
    console.error('❌ Error fetching subjects:', error);
    setSubjects([]);
  } finally {
    setLoading(false);
  }
};
  const handleViewClasses = () => {
    if (!selectedSubjectId) {
      alert('⚠️ Vui lòng chọn môn học!');
      return;
    }
    
    // Navigate to class selection with selected semester
    const url = selectedSemesterId 
      ? `/student/classes/${selectedSubjectId}?semesterId=${selectedSemesterId}`
      : `/student/classes/${selectedSubjectId}`;
    
    navigate(url);
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.subjectCode.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    subject.subjectName.toLowerCase().includes(searchKeyword.toLowerCase())
  );

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
      <div className="page-header">
        <h1>Học phần đang chờ đăng ký</h1>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        {/* Semester Dropdown */}
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
                {sem.status === 'ACTIVE' && ' (Đang diễn ra)'}
              </option>
            ))}
          </select>
        </div>

        {/* Search Box */}
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
              <th style={{ width: '200px' }}>Điều kiện đăng ký</th>
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
                      <span className="no-data-icon">📚</span>
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
                  <td className="prerequisites">
                    {subject.departmentKnowledgeType === 'BASIC' ? (
                      <span className="all-students">Tất cả sinh viên</span>
                    ) : subject.majorName ? (
                      <span className="major-tag">{subject.majorName}</span>
                    ) : (
                      <span className="text-muted">--</span>
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

      {/* Info Section */}
      <div className="info-section">
        <div className="info-box">
          <h3>Lớp học phần đang chờ đăng ký</h3>
          <div className="info-stats">
            <p>
              📚 Tổng số môn học: <strong>{filteredSubjects.length}</strong>
            </p>
            {selectedSemesterId && (
              <p>
                🎓 Học kỳ: <strong>
                  {semesters.find(s => s.semesterId === selectedSemesterId)?.semesterName || 
                   semesters.find(s => s.semesterId === selectedSemesterId)?.semesterCode}
                </strong>
              </p>
            )}
            {selectedSubjectId && (
              <p>
                ✅ Đã chọn: <strong>
                  {subjects.find(s => s.subjectId === selectedSubjectId)?.subjectName}
                </strong>
              </p>
            )}
          </div>
          <div className="checkbox-group">
            <label>
              <input type="checkbox" defaultChecked />
              Lọc tất cả lịch trùng
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectSelection;