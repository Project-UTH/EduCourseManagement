package vn.edu.uth.ecms.exception;

/**
 * Exception thrown when a requested resource is not found
 * Phase 3 Sprint 3.1
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}