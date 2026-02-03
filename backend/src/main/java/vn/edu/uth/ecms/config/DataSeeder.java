package vn.edu.uth.ecms.config;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import vn.edu.uth.ecms.entity.*;
import vn.edu.uth.ecms.entity.enums.RoomType;
import vn.edu.uth.ecms.repository.*;

/**
 * DataSeeder - Seeds ONLY essential data
 *
 * SEEDS:
 * 1. Admin account (username: admin, password: admin123)
 * 2. ONLINE room (for E-learning sessions)
 *
 * NOTE: All other data (departments, majors, subjects, teachers, students)
 * should be imported via Excel or created through the UI.
 */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataSeeder.class);

    private final AdminRepository adminRepository;
    private final RoomRepository roomRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        logger.info(" Starting data seeding...");

        
        seedAdmin();

        
        seedOnlineRoom();

        logger.info(" Data seeding completed!");
    }

  
    private void seedAdmin() {
        if (adminRepository.count() == 0) {
            Admin admin = Admin.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .fullName("System Administrator")
                    .email("admin@uth.edu.vn")
                    .build();

            adminRepository.save(admin);
            logger.info(" Created admin account: username=admin, password=admin123");
        } else {
            logger.info(" Admin account already exists, skipping...");
        }
    }

    
    private void seedOnlineRoom() {
        if (!roomRepository.existsByRoomCode("ONLINE")) {
            Room onlineRoom = Room.builder()
                    .roomCode("ONLINE")
                    .roomName("Phòng học trực tuyến")
                    .roomType(RoomType.ONLINE)
                    .capacity(999)  
                    .building("VIRTUAL")
                    .floor(0)
                    .isActive(true)
                    .build();

            roomRepository.save(onlineRoom);
            logger.info(" Created ONLINE room for E-learning (capacity: 999, no conflict check)");
        } else {
            logger.info(" ONLINE room already exists, skipping...");
        }
    }
}