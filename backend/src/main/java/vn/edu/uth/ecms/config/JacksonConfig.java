package vn.edu.uth.ecms.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateSerializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

import java.time.format.DateTimeFormatter;

/**
 * Jackson Configuration
 * 
 * Ensures proper serialization of Java 8 date/time types
 * 
 * ✅ CRITICAL: LocalDate always serializes as "yyyy-MM-dd" (ISO format)
 * ✅ NO timezone issues in frontend
 * 
 * @author ECMS Team
 * @since 2026-01-15
 */
@Configuration
public class JacksonConfig {
    
    private static final String DATE_FORMAT = "yyyy-MM-dd";
    
    @Bean
    public Jackson2ObjectMapperBuilder jackson2ObjectMapperBuilder() {
        return new Jackson2ObjectMapperBuilder()
                .serializers(new LocalDateSerializer(DateTimeFormatter.ofPattern(DATE_FORMAT)))
                .featuresToDisable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }
}