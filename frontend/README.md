# GrantSetu - React Frontend Client

This directory contains the complete **React 19 + TypeScript + Tailwind CSS** frontend for the **GrantSetu Digital Subsidy & Grant Administration Platform**.

---

## 🏗️ Architecture & Features

- **Portals & Role Workspaces**:
  - **Beneficiary**: Dynamic scheme catalog, multi-step application modal with real-time scoring, milestone progress tracker.
  - **Field Officer**: Ground verification queue, field inspection checklists, geotagged evidence review, rejection/revision workflow.
  - **District Officer**: Scrutiny desk, merit review, district-level quota validation.
  - **Finance Approver**: Sanction generation, tranche release authorization, PFMS direct benefit transfer (DBT) execution.
  - **Administrator**: Analytics dashboard, budget utilization, dynamic scheme and criteria configuration.
- **Dynamic Criteria Handling**:
  - Automatically loads each scheme's specific criteria matrix, mandatory conditions, document requirements, and grant slabs.

---

## 🚀 Running the Frontend

### Standalone (against Spring Boot Backend on :8080)

```bash
cd frontend
npm install
npm run dev
```

### Configuration
In `src/services/api.ts`:
```typescript
const API_BASE_URL = 'http://localhost:8080/api';
```
