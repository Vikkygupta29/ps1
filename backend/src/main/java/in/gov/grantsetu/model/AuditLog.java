package in.gov.grantsetu.model;

import in.gov.grantsetu.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long applicationId;
    private String applicationNumber;
    private String action;
    private String performedBy;

    @Enumerated(EnumType.STRING)
    private UserRole role;

    @Column(length = 1000)
    private String details;

    private String ipAddress;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
