package vn.edu.uth.ecms.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import vn.edu.uth.ecms.entity.enums.KnowledgeType;

@Entity
@Table(name = "department")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Department extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "department_id")
    private Long departmentId;

    @NotBlank(message = "Department code is required")
    @Size(max = 10, message = "Department code must not exceed 10 characters")
    @Column(name = "department_code", unique = true, nullable = false, length = 10)
    private String departmentCode;

    @NotBlank(message = "Department name is required")
    @Size(max = 100, message = "Department name must not exceed 100 characters")
    @Column(name = "department_name", nullable = false, length = 100)
    private String departmentName;

    @Enumerated(EnumType.STRING)
    @Column(name = "knowledge_type", nullable = false)
    private KnowledgeType knowledgeType;

    @Column(columnDefinition = "TEXT")
    private String description;
}