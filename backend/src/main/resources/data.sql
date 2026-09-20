-- Demo Seed Users
INSERT INTO users (username, email, password, full_name, role, phone, aadhaar_masked, region, designation, department, active, created_at)
VALUES 
('beneficiary', 'beneficiary@gov.in', '$2a$10$7Q7xY6h8K5/N0Wp9z8N2e.rN6C5y8v3e', 'Priya Sharma', 'BENEFICIARY', '9876543210', 'XXXX-XXXX-8921', 'Varanasi', 'Citizen Applicant', 'Social Welfare', true, CURRENT_TIMESTAMP),
('field_officer', 'field@gov.in', '$2a$10$7Q7xY6h8K5/N0Wp9z8N2e.rN6C5y8v3e', 'Rajesh Kumar', 'FIELD_OFFICER', '9876543211', 'XXXX-XXXX-4532', 'Varanasi', 'Senior Inspector', 'Revenue & Welfare Inspection', true, CURRENT_TIMESTAMP),
('district_officer', 'district@gov.in', '$2a$10$7Q7xY6h8K5/N0Wp9z8N2e.rN6C5y8v3e', 'Dr. Ananya Verma', 'DISTRICT_OFFICER', '9876543212', 'XXXX-XXXX-7841', 'Varanasi', 'District Welfare Officer', 'District Collectorate', true, CURRENT_TIMESTAMP),
('finance_officer', 'finance@gov.in', '$2a$10$7Q7xY6h8K5/N0Wp9z8N2e.rN6C5y8v3e', 'Vikram Sengupta', 'FINANCE_APPROVER', '9876543213', 'XXXX-XXXX-1234', 'State HQ', 'Treasury Officer', 'Department of Expenditure', true, CURRENT_TIMESTAMP),
('admin', 'admin@gov.in', '$2a$10$7Q7xY6h8K5/N0Wp9z8N2e.rN6C5y8v3e', 'Sunil Mehta, IAS', 'ADMIN', '9876543214', 'XXXX-XXXX-9999', 'National HQ', 'Principal Secretary', 'Ministry of Social Justice', true, CURRENT_TIMESTAMP);

-- Demo Seed Schemes
INSERT INTO schemes (code, name, description, category, ministry, total_budget, utilized_budget, max_grant, min_grant, max_income, min_age, max_age, target_region, active, created_at)
VALUES 
('PM-SMFIS-26', 'Pradhan Mantri Solar Micro-Irrigation Subsidy', 'Direct DBT capital grant up to 80% for small and marginal farmers installing high-efficiency 3HP to 7.5HP solar pumps.', 'Agriculture & Solar', 'Ministry of Agriculture', 50000000.0, 18450000.0, 200000.0, 75000.0, 300000.0, 21, 65, 'All Rural Districts', true, CURRENT_TIMESTAMP),
('WEMG-2026', 'Women Micro-Enterprise Development Grant', 'Seed capital grant for rural women-led self-help groups and individual women micro-enterprises.', 'Micro Enterprise', 'Ministry of MSME & Rural Development', 25000000.0, 11200000.0, 150000.0, 50000.0, 250000.0, 18, 55, 'Nationwide', true, CURRENT_TIMESTAMP),
('RATCRS-26', 'Rural Artisan & Traditional Craftsman Subsidy', 'Modern tooling kits, safety machinery procurement, and working capital assistance for registered rural artisans.', 'Dairy & Animal Husbandry', 'Ministry of Textiles & Handicrafts', 15000000.0, 4800000.0, 80000.0, 25000.0, 200000.0, 18, 60, 'Nationwide', true, CURRENT_TIMESTAMP);
