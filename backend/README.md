# GrantSetu - Spring Boot 3 Backend Service

This directory contains the standalone, production-ready **Java 17+ / Spring Boot 3.2.x RESTful Backend Service** for the **GrantSetu Digital Subsidy & Grant Administration Platform**.

---

## 🏗️ Architecture & Features

- **Dynamic Criteria Scoring Engine (`EligibilityEngineService.java`)**:
  - Dynamically evaluates applicant parameters against criteria defined per scheme (`<=`, `>=`, `BETWEEN`, `IN`, `EQUALS`).
  - Enforces mandatory criteria checks, age limits, and income ceilings.
  - Automatically matches scores to `GrantSlab` definitions to calculate exact DBT sanction amounts.
- **Role-Based Access Control (RBAC)**:
  - 5 Distinct Roles: `BENEFICIARY`, `FIELD_OFFICER`, `DISTRICT_OFFICER`, `FINANCE_APPROVER`, `ADMIN`.
- **Entity Model & Repositories**:
  - `User`, `Scheme`, `SchemeCriterion`, `GrantSlab`, `Application`, `AuditLog`.
- **Spring Data JPA & Hibernate**:
  - Preconfigured with H2 (in-memory with file persistence for rapid testing) and fully compatible with PostgreSQL.
- **Audit & Compliance**:
  - Chronological transaction logging across officer verification decisions, remarks, and PFMS disbursement references.

---

## 🚀 How to Run Locally

### Prerequisites
- **Java 17 or Java 21** (`java -version`)
- **Apache Maven 3.8+** (`mvn -version`)

### Running the Application

```bash
# Navigate to backend folder
cd backend

# Build with Maven
mvn clean package

# Run Spring Boot
mvn spring-boot:run
```

The Spring Boot backend will start on **http://localhost:8080/api**.

### H2 Database Console
- **URL**: `http://localhost:8080/api/h2-console`
- **JDBC URL**: `jdbc:h2:mem:grantsetudb`
- **User**: `sa`
- **Password**: *(leave blank)*

---

## 🌐 API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Citizen & Officer login authentication |
| `POST` | `/api/auth/switch-role` | Demo one-click switch between the 5 portal roles |
| `GET` | `/api/schemes` | Fetch all active subsidy schemes & criteria |
| `GET` | `/api/schemes/{id}` | Fetch scheme details, criteria rules & slabs |
| `POST` | `/api/schemes` | Admin create new scheme with rules |
| `GET` | `/api/applications/my` | Get applications for logged-in citizen |
| `GET` | `/api/applications/{id}` | Get application details & chronological audit trail |
| `POST` | `/api/applications/submit` | Submit application with dynamic scoring calculation |
| `POST` | `/api/applications/{id}/field-verify` | Field Officer physical verification & remarks |
| `POST` | `/api/applications/{id}/sanction-disburse` | Finance Approver DBT release with PFMS reference |
