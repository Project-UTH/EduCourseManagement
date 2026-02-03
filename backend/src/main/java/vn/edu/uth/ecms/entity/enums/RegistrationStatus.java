package vn.edu.uth.ecms.entity;

/**
 * Registration status of a student in a class
 */
public enum RegistrationStatus {
    REGISTERED,     // Đang học
    DROPPED,        // Đã hủy (trong thời gian cho phép)
    COMPLETED       // Hoàn thành (sau khi học kỳ kết thúc)
}   