import { Scheme, Application, EligibilityResult, EligibilityEvaluation, GrantSlab } from './db';

export function calculateAge(dobString: string): number {
  if (!dobString) return 0;
  const dob = new Date(dobString);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return isNaN(age) ? 0 : age;
}

export function evaluateApplicationEligibility(
  scheme: Scheme,
  application: Application
): EligibilityResult {
  const applicantData = application.applicantData;
  const evaluations: EligibilityEvaluation[] = [];
  const failedCriteria: string[] = [];
  let totalScore = 0;
  let maxScore = 0;
  let mandatoryPassed = true;

  const age = applicantData?.personal?.age || calculateAge(applicantData?.personal?.dateOfBirth) || 30;
  const income = Number(applicantData?.income?.annualIncome) || 0;
  const gender = applicantData?.personal?.gender?.toUpperCase() || 'FEMALE';
  const socialCategory = applicantData?.category?.socialCategory?.toUpperCase() || 'GENERAL';
  const region = applicantData?.address?.region || applicantData?.address?.district || application?.region || 'North District';
  const land = Number(applicantData?.income?.landOwnershipAcres) || 0;
  const documentCount = application?.documents?.length || 0;

  for (const criterion of scheme.criteria) {
    maxScore += criterion.points;
    let passed = false;
    let pointsAwarded = 0;
    let actualVal: any = '';

    switch (criterion.type) {
      case 'INCOME': {
        actualVal = `₹${income.toLocaleString('en-IN')}`;
        const ceiling = Number(criterion.value);
        if (income <= ceiling) {
          passed = true;
          pointsAwarded = criterion.points;
        } else if (income <= ceiling * 1.3) {
          // Partial points for near threshold
          passed = false;
          pointsAwarded = Math.round(criterion.points * 0.4);
        }
        break;
      }
      case 'AGE': {
        actualVal = `${age} years`;
        if (Array.isArray(criterion.value)) {
          const [min, max] = criterion.value;
          if (age >= min && age <= max) {
            passed = true;
            pointsAwarded = criterion.points;
          }
        } else {
          const val = Number(criterion.value);
          if (criterion.operator === '>=' && age >= val) passed = true;
          else if (criterion.operator === '<=' && age <= val) passed = true;
          if (passed) pointsAwarded = criterion.points;
        }
        break;
      }
      case 'CATEGORY': {
        actualVal = `${gender || ''} / ${socialCategory || ''}`;
        const allowed = Array.isArray(criterion.value) ? criterion.value : [criterion.value];
        const matchCategory = allowed.some(
          (c: string) => c.toUpperCase() === socialCategory || c.toUpperCase() === gender
        );
        if (matchCategory) {
          passed = true;
          pointsAwarded = criterion.points;
        }
        break;
      }
      case 'REGION': {
        actualVal = region;
        const target = criterion.value;
        if (
          target === 'All Districts' ||
          target === 'ALL' ||
          (typeof target === 'string' && region?.toLowerCase().includes(target.toLowerCase()))
        ) {
          passed = true;
          pointsAwarded = criterion.points;
        }
        break;
      }
      case 'LAND': {
        actualVal = `${land} acres`;
        const limit = Number(criterion.value);
        if (criterion.operator === '<=' && land <= limit) {
          passed = true;
          pointsAwarded = criterion.points;
        } else if (criterion.operator === '>=' && land >= limit) {
          passed = true;
          pointsAwarded = criterion.points;
        }
        break;
      }
      case 'DOCUMENTS': {
        actualVal = `${documentCount} documents`;
        const requiredCount = Number(criterion.value) || scheme.requiredDocuments.length;
        if (documentCount >= requiredCount) {
          passed = true;
          pointsAwarded = criterion.points;
        } else {
          // Award proportional score
          pointsAwarded = Math.round((documentCount / requiredCount) * criterion.points);
          passed = false;
        }
        break;
      }
      case 'PREVIOUS_SUBSIDY': {
        const received = !!applicantData.category.previousSubsidyReceived;
        actualVal = received ? 'Yes (Previous Subsidy)' : 'No (First-time Applicant)';
        if (!received) {
          passed = true;
          pointsAwarded = criterion.points;
        }
        break;
      }
      default: {
        actualVal = 'Verified';
        passed = true;
        pointsAwarded = criterion.points;
      }
    }

    if (!passed && criterion.isMandatory) {
      mandatoryPassed = false;
      failedCriteria.push(`${criterion.name} (${criterion.description}) - Actual: ${actualVal}`);
    }

    totalScore += pointsAwarded;

    evaluations.push({
      criterionId: criterion.id,
      criterionName: criterion.name,
      pointsAwarded,
      maxPoints: criterion.points,
      passed,
      actualValue: actualVal,
      ruleDescription: criterion.description,
    });
  }

  // Ensure minimum qualification percentage (50% or all mandatory passed)
  const isEligible = mandatoryPassed && totalScore >= 50;

  // Determine Grant Amount from Grant Slabs
  let calculatedGrantAmount = scheme.minGrant;
  if (isEligible && scheme.grantSlabs && scheme.grantSlabs.length > 0) {
    const sortedSlabs = [...scheme.grantSlabs].sort((a, b) => b.minScore - a.minScore);
    const matchedSlab = sortedSlabs.find(
      (slab) => totalScore >= slab.minScore && totalScore <= slab.maxScore
    );
    if (matchedSlab) {
      calculatedGrantAmount = matchedSlab.grantAmount;
    } else {
      calculatedGrantAmount = sortedSlabs[sortedSlabs.length - 1].grantAmount;
    }
  } else if (!isEligible) {
    calculatedGrantAmount = 0;
  }

  return {
    id: `el-${Date.now()}`,
    applicationId: application.id,
    totalScore,
    maxScore: maxScore || 100,
    eligible: isEligible,
    calculatedGrantAmount,
    evaluatedCriteria: evaluations,
    failedCriteria,
    evaluatedAt: new Date().toISOString(),
  };
}
