package vn.edu.uth.ecms.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

/**
 * Web Configuration
 * 
 * Configures static resource handling for uploaded files
 * 
 * ✅ FIXED: Use ABSOLUTE path to handle E drive location
 * 
 * @author Phase 4.1 - File Upload
 * @since 2026-01-15
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // ✅ FIX: Get absolute path dynamically
        String uploadDir = new File("uploads/homework/").getAbsolutePath();
        String resourceLocation = "file:///" + uploadDir.replace("\\", "/") + "/";
        
        registry.addResourceHandler("/uploads/homework/**")
                .addResourceLocations(resourceLocation);
        
        System.out.println("====================================");
        System.out.println("✅ Static Resource Handler Configured");
        System.out.println("====================================");
        System.out.println("URL Pattern:     /uploads/homework/**");
        System.out.println("File Location:   " + resourceLocation);
        System.out.println("Absolute Path:   " + uploadDir);
        System.out.println("====================================");
    }
}