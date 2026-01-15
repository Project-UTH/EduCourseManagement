import axios from 'axios';

const API_URL = 'http://localhost:8080/api/student/registration';

export interface RegistrationResponse {
  registrationId: number;
  status: string;
  registeredAt: string;
  droppedAt: string | null;
  
  studentId: number;
  studentCode: string;
  studentName: string;
  
  classId: number;
  classCode: string;
  
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
  
  teacherId: number;
  teacherName: string;
  
  semesterId: number;
  semesterCode: string;
  semesterName: string;
  semesterStatus?: 'UPCOMING' | 'ACTIVE' | 'COMPLETED'; // ✅ ADDED
  
  dayOfWeek: string;
  dayOfWeekDisplay: string;
  timeSlot: string;
  timeSlotDisplay: string;
  room: string;
}

const registrationApi = {
  // Đăng ký lớp học
  registerForClass: (classId: number) => {
    const token = localStorage.getItem('token');
    return axios.post(`${API_URL}/register/${classId}`, null, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Xem danh sách đăng ký
  getMyRegistrations: (semesterId?: number) => {
    const token = localStorage.getItem('token');
    const params = semesterId ? { semesterId } : {};
    return axios.get(API_URL, {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
  },

  // Hủy đăng ký
  dropClass: (registrationId: number) => {
    const token = localStorage.getItem('token');
    return axios.delete(`${API_URL}/${registrationId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Xem chi tiết đăng ký
  getRegistrationById: (registrationId: number) => {
    const token = localStorage.getItem('token');
    return axios.get(`${API_URL}/${registrationId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
};

export default registrationApi;