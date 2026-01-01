import React, { useState, useEffect } from 'react';
import subjectApi from '../../../services/api/subjectApi';
import './SubjectSelector.css';

interface Subject {
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
  departmentId: number;
}

interface SelectedSubject {
  subjectId: number;
  isPrimary: boolean;
  yearsOfExperience?: number;
}

interface SubjectSelectorProps {
  departmentId?: number;
  selectedSubjects: SelectedSubject[];
  onChange: (subjects: SelectedSubject[]) => void;
}

const SubjectSelector: React.FC<SubjectSelectorProps> = ({
  departmentId,
  selectedSubjects,
  onChange
}) => {
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch subjects when department changes
  useEffect(() => {
    if (departmentId) {
      fetchSubjects();
    } else {
      setAvailableSubjects([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId]);

  const fetchSubjects = async () => {
    if (!departmentId) return;

    try {
      setLoading(true);
      const response = await subjectApi.getByDepartment(departmentId);
      setAvailableSubjects(response.data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setAvailableSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const isSelected = (subjectId: number): boolean => {
    return selectedSubjects.some(s => s.subjectId === subjectId);
  };

  const handleToggleSubject = (subject: Subject) => {
    if (isSelected(subject.subjectId)) {
      // Remove subject
      const updated = selectedSubjects.filter(s => s.subjectId !== subject.subjectId);
      onChange(updated);
    } else {
      // Add subject
      const updated = [...selectedSubjects, {
        subjectId: subject.subjectId,
        isPrimary: false,
        yearsOfExperience: undefined
      }];
      onChange(updated);
    }
  };

  const handleTogglePrimary = (subjectId: number) => {
    const updated = selectedSubjects.map(s => 
      s.subjectId === subjectId 
        ? { ...s, isPrimary: !s.isPrimary }
        : s
    );
    onChange(updated);
  };

  const handleExperienceChange = (subjectId: number, years: string) => {
    const value = years ? parseInt(years) : undefined;
    const updated = selectedSubjects.map(s => 
      s.subjectId === subjectId 
        ? { ...s, yearsOfExperience: value }
        : s
    );
    onChange(updated);
  };

  const getSubjectInfo = (subjectId: number): Subject | undefined => {
    return availableSubjects.find(s => s.subjectId === subjectId);
  };

  return (
    <div className="subject-selector">
      <label className="subject-selector-label">
        Các môn có thể dạy
        {selectedSubjects.length > 0 && (
          <span className="selected-count">({selectedSubjects.length} môn)</span>
        )}
      </label>

      {!departmentId && (
        <div className="info-message">
          Vui lòng chọn khoa trước
        </div>
      )}

      {departmentId && (
        <>
          {/* Selected subjects list */}
          {selectedSubjects.length > 0 && (
            <div className="selected-subjects-list">
              {selectedSubjects.map(selected => {
                const subject = getSubjectInfo(selected.subjectId);
                if (!subject) return null;

                return (
                  <div key={selected.subjectId} className="selected-subject-item">
                    <div className="subject-info">
                      <span className="subject-code">{subject.subjectCode}</span>
                      <span className="subject-name">{subject.subjectName}</span>
                      <span className="subject-credits">({subject.credits} TC)</span>
                    </div>

                    <div className="subject-controls">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={selected.isPrimary}
                          onChange={() => handleTogglePrimary(selected.subjectId)}
                        />
                        <span>Môn chủ đạo</span>
                      </label>

                      <input
                        type="number"
                        placeholder="Số năm kinh nghiệm"
                        value={selected.yearsOfExperience || ''}
                        onChange={(e) => handleExperienceChange(selected.subjectId, e.target.value)}
                        className="experience-input"
                        min="0"
                        max="50"
                      />

                      <button
                        type="button"
                        className="btn-remove-subject"
                        onClick={() => handleToggleSubject(subject)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add subject dropdown */}
          <div className="add-subject-section">
            <button
              type="button"
              className="btn-add-subject"
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={loading}
            >
              <span className="icon">+</span>
              Thêm môn học
            </button>

            {showDropdown && (
              <div className="subject-dropdown">
                {loading ? (
                  <div className="loading-message">Đang tải...</div>
                ) : availableSubjects.length === 0 ? (
                  <div className="empty-message">Không có môn học nào</div>
                ) : (
                  <div className="subject-list">
                    {availableSubjects.map(subject => (
                      <div
                        key={subject.subjectId}
                        className={`subject-option ${isSelected(subject.subjectId) ? 'selected' : ''}`}
                        onClick={() => handleToggleSubject(subject)}
                      >
                        <span className="subject-code">{subject.subjectCode}</span>
                        <span className="subject-name">{subject.subjectName}</span>
                        <span className="subject-credits">({subject.credits} TC)</span>
                        {isSelected(subject.subjectId) && (
                          <span className="checkmark">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SubjectSelector;