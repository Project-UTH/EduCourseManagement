package vn.edu.uth.ecms.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.io.File;

/**
 * Web Configuration

 * @author 
 * @since 
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        
        String uploadDir = new File("uploads/homework/").getAbsolutePath();
        String resourceLocation = "file:///" + uploadDir.replace("\\", "/") + "/";
        
        registry.addResourceHandler("/uploads/homework/**")
                .addResourceLocations(resourceLocation);
        
       
        String materialsDir = new File("uploads/materials/").getAbsolutePath();
        String materialsLocation = "file:///" + materialsDir.replace("\\", "/") + "/";
        
        registry.addResourceHandler("/uploads/materials/**")
                .addResourceLocations(materialsLocation);
        
        System.out.println("====================================");
        System.out.println(" Static Resource Handlers Configured");
        System.out.println("====================================");
        System.out.println("Homework:");
        System.out.println("  URL Pattern:   /uploads/homework/**");
        System.out.println("  File Location: " + resourceLocation);
        System.out.println("  Absolute Path: " + uploadDir);
        System.out.println("------------------------------------");
        System.out.println("Materials:");
        System.out.println("  URL Pattern:   /uploads/materials/**");
        System.out.println("  File Location: " + materialsLocation);
        System.out.println("  Absolute Path: " + materialsDir);
        System.out.println("====================================");
    }
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        
        // Register JavaTimeModule for LocalDateTime support
        mapper.registerModule(new JavaTimeModule());
        
        // Configure to write dates as strings (not timestamps)
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        
        return mapper;
    }
}