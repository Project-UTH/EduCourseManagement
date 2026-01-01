package vn.edu.uth.ecms.exception;

/**
 * Invalid Request Exception
 * Thrown when request data is invalid or violates business rules
 */
public class InvalidRequestException extends RuntimeException {

    public InvalidRequestException(String message) {
        super(message);
    }

    public InvalidRequestException(String message, Throwable cause) {
        super(message, cause);
    }
}