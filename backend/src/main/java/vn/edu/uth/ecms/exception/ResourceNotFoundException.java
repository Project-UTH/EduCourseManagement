
package vn.edu.uth.ecms.exception;

import lombok.Getter;

@Getter
public class ResourceNotFoundException extends RuntimeException {

    // Getters
    private String resourceName;
    private String fieldName;
    private Object fieldValue;

    // Constructor hiện tại (1 param)
    public ResourceNotFoundException(String message) {
        super(message);
    }

    // Constructor hiện tại (2 params)
    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }

    // ✅ THÊM CONSTRUCTOR MỚI (3 params)
    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s: '%s'", resourceName, fieldName, fieldValue));
        this.resourceName = resourceName;
        this.fieldName = fieldName;
        this.fieldValue = fieldValue;
    }

}