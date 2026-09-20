package in.gov.grantsetu.repository;

import in.gov.grantsetu.enums.ApplicationStatus;
import in.gov.grantsetu.model.Application;
import in.gov.grantsetu.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByApplicant(User applicant);
    List<Application> findByApplicantId(Long applicantId);
    List<Application> findByStatus(ApplicationStatus status);
    List<Application> findByRegion(String region);
    Optional<Application> findByApplicationNumber(String applicationNumber);
}
