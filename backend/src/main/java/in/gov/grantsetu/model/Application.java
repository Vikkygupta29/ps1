package in.gov.grantsetu.model;

import in.gov.grantsetu.enums.ApplicationStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "applications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String applicationNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User applicant;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "scheme_id", nullable = false)
    private Scheme scheme;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status;

    private String currentStage;

    // Evaluated dynamic scoring
    private Integer eligibilityScore;
    private Integer maxScore;
    private Boolean isEligible;
    private Double grantAmount;

    // Captured application attributes
    private Double annualIncome;
    private Double landOwnershipAcres;
    private String socialCategory;
    private String gender;
    private Integer applicantAge;
    private String region;

    // Banking Details for Direct Benefit Transfer (DBT)
    private String bankAccount;
    private String bankName;
    private String ifscCode;

    // Officer notes & remarks
    @Column(length = 2000)
    private String fieldOfficerRemarks;
    
    @Column(length = 2000)
    private String districtOfficerRemarks;

    @Column(length = 2000)
    private String reapplicationNotes;

    private String pfmsReference;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;
}
