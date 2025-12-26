package vn.edu.uth.ecms.exception;

/**
 * Exception thrown when trying to create a duplicate resource
 */
public class DuplicateException extends RuntimeException {

    public DuplicateException(String message) {
        super(message);
    }

    public DuplicateException(String message, Throwable cause) {
        super(message, cause);
    }
}