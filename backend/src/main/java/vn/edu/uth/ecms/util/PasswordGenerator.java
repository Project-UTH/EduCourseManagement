package vn.edu.uth.ecms.util;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public class PasswordGenerator {

    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("ddMMyyyy");

    /**
     * Generate default password from date of birth
     * Format: ddMMyyyy (example: 01012000)
     */
    public static String generateDefaultPassword(LocalDate dateOfBirth) {
        if (dateOfBirth == null) {
            throw new IllegalArgumentException("Date of birth cannot be null");
        }
        return dateOfBirth.format(formatter);
    }

    /**
     * Check if password matches date of birth pattern
     */
    public static boolean isDefaultPassword(String password, LocalDate dateOfBirth) {
        if (password == null || dateOfBirth == null) {
            return false;
        }
        String defaultPassword = generateDefaultPassword(dateOfBirth);
        return password.equals(defaultPassword);
    }
}