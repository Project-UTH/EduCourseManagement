package vn.edu.uth.ecms.exception;

/**
 * Exception thrown when there is a schedule conflict
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }

    public ConflictException(String message, Throwable cause) {
        super(message, cause);
    }
}