package in.gov.grantsetu.controller;

import in.gov.grantsetu.enums.ApplicationStatus;
import in.gov.grantsetu.enums.UserRole;
import in.gov.grantsetu.model.*;
import in.gov.grantsetu.repository.*;
import in.gov.grantsetu.service.EligibilityEngineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/applications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ApplicationController {

    private final ApplicationRepository applicationRepository;
    private final SchemeRepository schemeRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final EligibilityEngineService eligibilityEngine;

    @GetMapping("/my")
    public ResponseEntity<Map<String, Object>> getMyApplications(@RequestParam(defaultValue = "1") Long userId) {
        List<Application> apps = applicationRepository.findByApplicantId(userId);
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("applications", apps);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getApplicationDetails(@PathVariable Long id) {
        return applicationRepository.findById(id)
                .map(app -> {
                    List<AuditLog> timeline = auditLogRepository.findByApplicationIdOrderByTimestampDesc(id);
                    Map<String, Object> res = new HashMap<>();
                    res.put("success", true);
                    res.put("application", app);
                    res.put("timeline", timeline);
                    return ResponseEntity.ok(res);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/submit")
    public ResponseEntity<Map<String, Object>> submitApplication(@RequestBody Application incomingApp,
                                                                 @RequestParam(defaultValue = "1") Long userId,
                                                                 @RequestParam Long schemeId) {
        User applicant = userRepository.findById(userId).orElseThrow();
        Scheme scheme = schemeRepository.findById(schemeId).orElseThrow();

        incomingApp.setApplicant(applicant);
        incomingApp.setScheme(scheme);
        incomingApp.setApplicationNumber("APP-2026-" + (System.currentTimeMillis() % 100000));
        incomingApp.setStatus(ApplicationStatus.FIELD_VERIFICATION_PENDING);
        incomingApp.setCurrentStage("FIELD_VERIFICATION");

        // Run dynamic eligibility rule evaluation
        EligibilityEngineService.EvaluationResult eval = eligibilityEngine.evaluateApplication(scheme, incomingApp);
        incomingApp.setIsEligible(eval.isEligible());
        incomingApp.setEligibilityScore(eval.getTotalScore());
        incomingApp.setMaxScore(eval.getMaxScore());
        incomingApp.setGrantAmount(eval.getCalculatedGrant());

        Application saved = applicationRepository.save(incomingApp);

        auditLogRepository.save(AuditLog.builder()
                .applicationId(saved.getId())
                .applicationNumber(saved.getApplicationNumber())
                .action("APPLICATION_SUBMITTED")
                .performedBy(applicant.getFullName())
                .role(UserRole.BENEFICIARY)
                .details("Application submitted with automated score " + eval.getTotalScore() + "/" + eval.getMaxScore())
                .build());

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("applicationId", saved.getId());
        res.put("application", saved);
        res.put("evaluation", eval);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/{id}/field-verify")
    public ResponseEntity<Map<String, Object>> fieldVerify(
            @PathVariable Long id,
            @RequestParam String decision,
            @RequestParam String remarks,
            @RequestParam String officerName) {

        Application app = applicationRepository.findById(id).orElseThrow();
        app.setFieldOfficerRemarks(remarks);
        app.setUpdatedAt(LocalDateTime.now());

        if ("APPROVE".equalsIgnoreCase(decision)) {
            app.setStatus(ApplicationStatus.DISTRICT_SCRUTINY_PENDING);
            app.setCurrentStage("DISTRICT_SCRUTINY");
        } else if ("REQUEST_REVISION".equalsIgnoreCase(decision)) {
            app.setStatus(ApplicationStatus.REAPPLICATION_REQUIRED);
            app.setCurrentStage("BENEFICIARY_REVISION");
            app.setReapplicationNotes(remarks);
        } else {
            app.setStatus(ApplicationStatus.REJECTED);
            app.setCurrentStage("REJECTED");
        }

        applicationRepository.save(app);

        auditLogRepository.save(AuditLog.builder()
                .applicationId(app.getId())
                .applicationNumber(app.getApplicationNumber())
                .action("FIELD_VERIFICATION_" + decision.toUpperCase())
                .performedBy(officerName)
                .role(UserRole.FIELD_OFFICER)
                .details(remarks)
                .build());

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("application", app);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/{id}/district-verify")
    public ResponseEntity<Map<String, Object>> districtVerify(
            @PathVariable Long id,
            @RequestParam String decision,
            @RequestParam String remarks,
            @RequestParam String officerName) {

        Application app = applicationRepository.findById(id).orElseThrow();
        app.setDistrictOfficerRemarks(remarks);
        app.setUpdatedAt(LocalDateTime.now());

        if ("APPROVE".equalsIgnoreCase(decision)) {
            app.setStatus(ApplicationStatus.DISTRICT_APPROVED);
            app.setCurrentStage("FINANCE_SANCTION");
        } else if ("SEND_BACK_TO_FIELD".equalsIgnoreCase(decision)) {
            // Reverse process: Higher officer sends back to Field Officer for re-verification
            app.setStatus(ApplicationStatus.FIELD_VERIFICATION_PENDING);
            app.setCurrentStage("FIELD_VERIFICATION");
        } else if ("REQUEST_REVISION".equalsIgnoreCase(decision)) {
            // Reverse process: District officer sends back to Beneficiary for re-application
            app.setStatus(ApplicationStatus.REAPPLICATION_REQUIRED);
            app.setCurrentStage("BENEFICIARY_REVISION");
            app.setReapplicationNotes(remarks);
        } else {
            app.setStatus(ApplicationStatus.REJECTED);
            app.setCurrentStage("REJECTED");
        }

        applicationRepository.save(app);

        auditLogRepository.save(AuditLog.builder()
                .applicationId(app.getId())
                .applicationNumber(app.getApplicationNumber())
                .action("DISTRICT_VERIFICATION_" + decision.toUpperCase())
                .performedBy(officerName)
                .role(UserRole.DISTRICT_OFFICER)
                .details(remarks)
                .build());

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("application", app);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/{id}/resubmit")
    public ResponseEntity<Map<String, Object>> resubmitApplication(
            @PathVariable Long id,
            @RequestBody Application incomingUpdates,
            @RequestParam String remarks) {

        Application app = applicationRepository.findById(id).orElseThrow();
        if (app.getStatus() != ApplicationStatus.REAPPLICATION_REQUIRED) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Application is not in REAPPLICATION_REQUIRED state.");
            return ResponseEntity.badRequest().body(err);
        }

        if (incomingUpdates.getAnnualIncome() != null) {
            app.setAnnualIncome(incomingUpdates.getAnnualIncome());
        }
        if (incomingUpdates.getProjectTitle() != null) {
            app.setProjectTitle(incomingUpdates.getProjectTitle());
        }
        if (incomingUpdates.getProjectDescription() != null) {
            app.setProjectDescription(incomingUpdates.getProjectDescription());
        }

        // Re-run dynamic eligibility evaluation
        EligibilityEngineService.EvaluationResult eval = eligibilityEngine.evaluateApplication(app.getScheme(), app);
        app.setIsEligible(eval.isEligible());
        app.setEligibilityScore(eval.getTotalScore());
        app.setMaxScore(eval.getMaxScore());
        app.setGrantAmount(eval.getCalculatedGrant());

        // Reverse completion: Application is returned to Field Verification desk
        app.setStatus(ApplicationStatus.FIELD_VERIFICATION_PENDING);
        app.setCurrentStage("FIELD_VERIFICATION");
        app.setUpdatedAt(LocalDateTime.now());

        Application saved = applicationRepository.save(app);

        auditLogRepository.save(AuditLog.builder()
                .applicationId(saved.getId())
                .applicationNumber(saved.getApplicationNumber())
                .action("APPLICATION_RESUBMITTED")
                .performedBy(saved.getApplicant().getFullName())
                .role(UserRole.BENEFICIARY)
                .details("Beneficiary rectified details and resubmitted application back to verification desk. Remarks: " + remarks)
                .build());

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Application successfully rectified and returned to verification queue.");
        res.put("application", saved);
        res.put("evaluation", eval);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/{id}/sanction-disburse")
    public ResponseEntity<Map<String, Object>> sanctionDisburse(
            @PathVariable Long id,
            @RequestParam String officerName) {

        Application app = applicationRepository.findById(id).orElseThrow();
        app.setStatus(ApplicationStatus.DISBURSED);
        app.setCurrentStage("DISBURSED");
        app.setPfmsReference("PFMS-DBT-" + System.currentTimeMillis());
        app.setUpdatedAt(LocalDateTime.now());

        applicationRepository.save(app);

        auditLogRepository.save(AuditLog.builder()
                .applicationId(app.getId())
                .applicationNumber(app.getApplicationNumber())
                .action("SANCTION_DISBURSEMENT_RELEASED")
                .performedBy(officerName)
                .role(UserRole.FINANCE_APPROVER)
                .details("DBT tranche dispatched via PFMS Ref: " + app.getPfmsReference())
                .build());

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("application", app);
        return ResponseEntity.ok(res);
    }
}
