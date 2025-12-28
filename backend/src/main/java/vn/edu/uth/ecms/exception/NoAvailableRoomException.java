package vn.edu.uth.ecms.exception;

/**
 * NoAvailableRoomException
 *
 * Thrown when no room is available for the requested schedule
 */
public class NoAvailableRoomException extends RuntimeException {

    public NoAvailableRoomException(String message) {
        super(message);
    }

    public NoAvailableRoomException(String message, Throwable cause) {
        super(message, cause);
    }
}