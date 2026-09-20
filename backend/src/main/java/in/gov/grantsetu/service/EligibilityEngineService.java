package in.gov.grantsetu.service;

import in.gov.grantsetu.model.*;
import lombok.Builder;
import lombok.Data;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class EligibilityEngineService {

    @Data
    @Builder
    public static class EvaluationResult {
        private boolean isEligible;
        private int totalScore;
        private int maxScore;
        private double calculatedGrant;
        private String slabName;
        private List<RuleEvaluationDetail> evaluatedRules;
    }

    @Data
    @Builder
    public static class RuleEvaluationDetail {
        private String criterionName;
        private boolean passed;
        private int pointsAwarded;
        private int maxPoints;
        private boolean isMandatory;
        private String description;
    }

    public EvaluationResult evaluateApplication(Scheme scheme, Application app) {
        int totalScore = 0;
        int maxScore = 0;
        boolean failedMandatory = false;
        List<RuleEvaluationDetail> ruleDetails = new ArrayList<>();

        if (scheme.getCriteria() != null) {
            for (SchemeCriterion criterion : scheme.getCriteria()) {
                int points = criterion.getPoints() != null ? criterion.getPoints() : 0;
                maxScore += points;

                boolean rulePassed = evaluateRule(criterion, app);
                if (rulePassed) {
                    totalScore += points;
                } else if (Boolean.TRUE.equals(criterion.getIsMandatory())) {
                    failedMandatory = true;
                }

                ruleDetails.add(RuleEvaluationDetail.builder()
                        .criterionName(criterion.getName())
                        .passed(rulePassed)
                        .pointsAwarded(rulePassed ? points : 0)
                        .maxPoints(points)
                        .isMandatory(Boolean.TRUE.equals(criterion.getIsMandatory()))
                        .description(criterion.getDescription())
                        .build());
            }
        }

        // Standard Scheme Boundary Checks
        if (scheme.getMaxIncome() != null && app.getAnnualIncome() != null) {
            if (app.getAnnualIncome() > scheme.getMaxIncome()) {
                failedMandatory = true;
            }
        }

        if (scheme.getMinAge() != null && app.getApplicantAge() != null) {
            if (app.getApplicantAge() < scheme.getMinAge()) {
                failedMandatory = true;
            }
        }

        if (scheme.getMaxAge() != null && app.getApplicantAge() != null) {
            if (app.getApplicantAge() > scheme.getMaxAge()) {
                failedMandatory = true;
            }
        }

        boolean overallEligible = !failedMandatory && totalScore >= 40;

        // Calculate Grant Amount from Dynamic Scheme Slabs
        double finalGrant = 0.0;
        String slabName = "None";

        if (overallEligible) {
            if (scheme.getGrantSlabs() != null && !scheme.getGrantSlabs().isEmpty()) {
                for (GrantSlab slab : scheme.getGrantSlabs()) {
                    if (totalScore >= slab.getMinScore() && totalScore <= slab.getMaxScore()) {
                        finalGrant = slab.getGrantAmount();
                        slabName = slab.getSlabName();
                        break;
                    }
                }
            }
            if (finalGrant == 0.0 && scheme.getMaxGrant() != null) {
                finalGrant = scheme.getMaxGrant();
                slabName = "Standard Maximum Grant";
            }
        }

        return EvaluationResult.builder()
                .isEligible(overallEligible)
                .totalScore(totalScore)
                .maxScore(maxScore > 0 ? maxScore : 100)
                .calculatedGrant(finalGrant)
                .slabName(slabName)
                .evaluatedRules(ruleDetails)
                .build();
    }

    private boolean evaluateRule(SchemeCriterion cr, Application app) {
        String attr = cr.getAttribute().toLowerCase();
        String op = cr.getOperator().toUpperCase();
        String val = cr.getThresholdValue();

        try {
            if (attr.contains("income")) {
                double target = Double.parseDouble(val);
                double actual = app.getAnnualIncome() != null ? app.getAnnualIncome() : 0.0;
                return op.equals("<=") ? actual <= target : actual >= target;
            } else if (attr.contains("land")) {
                double target = Double.parseDouble(val);
                double actual = app.getLandOwnershipAcres() != null ? app.getLandOwnershipAcres() : 0.0;
                return op.equals("<=") ? actual <= target : actual >= target;
            } else if (attr.contains("age")) {
                int actual = app.getApplicantAge() != null ? app.getApplicantAge() : 0;
                if (op.equals("BETWEEN") && val.contains("-")) {
                    String[] parts = val.split("-");
                    int min = Integer.parseInt(parts[0].trim());
                    int max = Integer.parseInt(parts[1].trim());
                    return actual >= min && actual <= max;
                }
            } else if (attr.contains("gender")) {
                return app.getGender() != null && app.getGender().equalsIgnoreCase(val);
            } else if (attr.contains("category") || attr.contains("social")) {
                return app.getSocialCategory() != null && val.toUpperCase().contains(app.getSocialCategory().toUpperCase());
            }
        } catch (Exception e) {
            return false;
        }

        return true;
    }
}
