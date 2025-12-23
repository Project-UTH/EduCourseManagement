package vn.edu.uth.ecms.exception;

/**
 * Exception thrown when attempting to create a resource that already exists
 * Phase 3 Sprint 3.1
 */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }

    public DuplicateResourceException(String message, Throwable cause) {
        super(message, cause);
    }
}