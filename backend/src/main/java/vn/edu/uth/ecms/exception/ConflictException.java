package vn.edu.uth.ecms.exception;

/**
 * Exception thrown when there is a schedule conflict
 *
 * USE CASES:
 * - Teacher has class at same time
 * - Room is occupied at same time
 * - Session reschedule conflicts
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }

    public ConflictException(String message, Throwable cause) {
        super(message, cause);
    }
}