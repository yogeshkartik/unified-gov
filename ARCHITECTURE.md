# Unified Government Services — Architecture

## 1. Project Purpose

This project is a hackathon prototype for a citizen-facing unified government-service portal.

The core problem:

Citizens repeatedly enter the same personal, contact, education, and document information when using different government services such as examinations, scholarships, licences, certificates, and schemes.

The proposed solution:

- A citizen creates a reusable profile once.
- Government services define what information and documents they require.
- The citizen clicks **Apply**.
- The system asks only for additional service-specific information when required.
- The citizen gives explicit consent for the service to use profile data and/or documents.
- The citizen reviews the complete application.
- Payment is simulated when applicable.
- The application is submitted to a mocked government submission service.
- The citizen can track the application.

DigiLocker is treated as the document/credential layer. For this hackathon, DigiLocker is mocked. Do not access or interfere with live government systems.

---

## 2. Hackathon Constraints

This is a prototype, not an official government product.

### Must follow

- Use only synthetic/mock citizen data.
- Do not use real Aadhaar numbers, PAN details, bank details, OTPs, payment details, health data, or other sensitive personal data.
- Do not scrape government websites.
- Do not reverse-engineer private systems.
- Do not call undocumented/private government APIs.
- Do not claim government approval, partnership, or official status.
- Clearly label mock integrations in the UI where appropriate.
- The main citizen journey must work end-to-end.

### Explicitly mocked

- DigiLocker
- Government service submission
- Payment
- OTP/authentication where required
- Any external government API

---

# 3. Product Scope

## 3.1 Core Citizen Journey

```text
Login
  ↓
Dashboard
  ↓
Browse Government Services
  ↓
Select Service
  ↓
Apply
  ↓
Check eligibility / requirements
  ↓
Collect additional service-specific information
  ↓
Consent
  ↓
Generate final preview
  ↓
Mock payment if applicable
  ↓
Submit
  ↓
Application number
  ↓
Application tracking
```

## 3.2 Main prototype services

Seed at least these demo services:

1. Government Recruitment Exam — Demo
2. Post-Matric Scholarship — Demo
3. Driving Licence Application — Demo

Optional fourth service:

4. Government Welfare Scheme — Demo

The architecture must remain generic enough to support additional service types without creating new frontend form implementations.

---

# 4. Technical Stack

## Frontend

- Next.js
- React
- TypeScript
- App Router
- Tailwind CSS
- shadcn/ui
- React Aria where appropriate for accessibility
- React Hook Form
- Zod
- lucide-react

## Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- Alembic

## Database

- SQLite for hackathon development
- Keep the SQL/data model compatible with PostgreSQL

## Development

- pnpm for JavaScript package management
- uv for Python environment/dependencies
- Git
- Codex as a meaningful part of implementation

## No need initially

- Microservices
- Kubernetes
- Kafka
- Redis
- Celery
- GraphQL
- Separate authentication server
- Real payment gateway
- Real DigiLocker integration

---

# 5. Repository Structure

```text
unified-gov/
│
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── login/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── profile/
│   │   │   │   ├── services/
│   │   │   │   │   └── [serviceId]/
│   │   │   │   ├── applications/
│   │   │   │   │   └── [applicationId]/
│   │   │   │   └── settings/
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── ui/
│   │   │   │   ├── layout/
│   │   │   │   ├── profile/
│   │   │   │   ├── services/
│   │   │   │   ├── application/
│   │   │   │   ├── consent/
│   │   │   │   ├── documents/
│   │   │   │   └── accessibility/
│   │   │   │
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   ├── schemas/
│   │   │   ├── types/
│   │   │   └── i18n/
│   │   │
│   │   └── package.json
│   │
│   └── api/
│       ├── app/
│       │   ├── main.py
│       │   ├── api/
│       │   ├── core/
│       │   ├── models/
│       │   ├── schemas/
│       │   ├── services/
│       │   └── integrations/
│       │       ├── digilocker/
│       │       ├── payment/
│       │       └── government/
│       │
│       ├── alembic/
│       ├── tests/
│       ├── pyproject.toml
│       └── alembic.ini
│
├── packages/
│   └── shared/
│
├── seed/
│   ├── users.json
│   ├── profiles.json
│   └── services.json
│
├── docs/
│
├── ARCHITECTURE.md
├── README.md
├── package.json
└── pnpm-workspace.yaml
```

---

# 6. Architectural Style

Use a **modular monolith**.

Do not create microservices.

```text
Browser
   ↓
Next.js
   ↓ REST/JSON
FastAPI
   ↓
PostgreSQL/SQLite

FastAPI modules:
- profile
- services
- application
- consent
- documents
- eligibility
- payment
- submission
```

The backend should be modular internally while remaining one deployable application.

---

# 7. High-Level System Architecture

```text
                      CITIZEN
                         │
                         ▼
                ┌────────────────┐
                │    Next.js     │
                │     React      │
                └───────┬────────┘
                        │ HTTPS/REST
                        ▼
                ┌────────────────┐
                │    FastAPI     │
                │                │
                │ Profile        │
                │ Service        │
                │ Application    │
                │ Consent        │
                │ Documents      │
                │ Eligibility    │
                │ Payment        │
                └───────┬────────┘
                        │
         ┌──────────────┼───────────────┐
         ▼              ▼               ▼
     Database       Mock Services    File Storage
    SQLite/PG       DigiLocker       Documents
                    Payment
                    Government
```

---

# 8. Core Domain Concepts

The core domain entities are:

```text
User
Profile
Address
Education
Document
Service
ServiceField
ServiceDocumentRequirement
EligibilityRule
Application
ApplicationAnswer
ApplicationDocument
Consent
Payment
ApplicationSnapshot
AuditLog
```

## 8.1 User

Represents account/auth identity.

Important fields:

- id
- email/mobile
- auth state
- created_at
- updated_at

Do not store passwords manually if real authentication is added later.

For the prototype, demo login is acceptable.

---

## 8.2 Profile

Reusable citizen information.

Suggested fields:

```text
full_name
date_of_birth
gender
nationality
father_name
mother_name
mobile
email
category
disability_status
```

Address and education should be separate related records rather than making one huge profile table.

---

## 8.3 Address

Support:

- permanent address
- current/correspondence address

Suggested fields:

```text
id
user_id
type
line1
line2
city
district
state
pincode
```

---

## 8.4 Education

Store education records separately.

Examples:

```text
10TH
12TH
DIPLOMA
GRADUATION
POSTGRADUATION
```

Suggested fields:

```text
id
user_id
level
board_or_university
institution
year
marks_or_percentage
certificate_document_id
```

---

## 8.5 Document

Represents a document known to the platform.

Examples:

```text
photograph
signature
10th marksheet
12th marksheet
degree certificate
income certificate
caste certificate
domicile certificate
driving licence
```

Document source must be explicit:

```text
PROFILE_UPLOAD
DIGILOCKER
SYSTEM_GENERATED
```

For this hackathon, DigiLocker documents are synthetic.

---

# 9. Service Model

Do NOT create separate code for every form.

Everything should be data-driven.

A `Service` represents any public-service application.

Possible service types:

```text
EXAM
SCHOLARSHIP
LICENCE
CERTIFICATE
SCHEME
RECRUITMENT
ADMISSION
OTHER
```

Suggested service fields:

```text
id
name
department
description
category
status
fee
currency
start_date
end_date
instructions
created_at
updated_at
```

---

# 10. Service Requirements

Each service specifies what it needs.

## Required profile data

Example:

```text
full_name
date_of_birth
address
education
category
```

## Required documents

Example:

```text
income_certificate
marksheet
photograph
```

## Additional fields

Example:

```text
course
institution
academic_year
exam_city
post_preference
```

---

# 11. Dynamic Form Schema

The service-specific form must be driven by JSON data.

Example:

```json
{
  "service_id": "SCHOLARSHIP_001",
  "fields": [
    {
      "key": "course",
      "label": "Current Course",
      "type": "text",
      "required": true
    },
    {
      "key": "institution",
      "label": "Institution",
      "type": "text",
      "required": true
    },
    {
      "key": "academic_year",
      "label": "Academic Year",
      "type": "select",
      "required": true,
      "options": [
        "2026-27",
        "2027-28"
      ]
    }
  ]
}
```

Supported field types for MVP:

```text
text
number
date
select
radio
checkbox
textarea
file
```

Later additions:

```text
multiselect
conditional fields
repeatable fields
```

The frontend must render fields from the schema.

Do not hard-code individual service forms.

---

# 12. Application Lifecycle

Use the following application states:

```text
DRAFT
ADDITIONAL_INFO_REQUIRED
CONSENT_REQUIRED
READY_FOR_REVIEW
PAYMENT_REQUIRED
SUBMITTED
PROCESSING
COMPLETED
REJECTED
CANCELLED
```

Typical flow:

```text
DRAFT
  ↓
ADDITIONAL_INFO_REQUIRED
  ↓
CONSENT_REQUIRED
  ↓
READY_FOR_REVIEW
  ↓
PAYMENT_REQUIRED
  ↓
SUBMITTED
```

For free services:

```text
READY_FOR_REVIEW
  ↓
SUBMITTED
```

---

# 13. Application Engine

When the citizen clicks Apply:

1. Load service definition.
2. Load citizen profile.
3. Check required documents.
4. Evaluate eligibility if rules exist.
5. Determine missing additional fields.
6. Create a draft application.
7. Return required additional fields.

Example response:

```json
{
  "application_id": "APP-DEMO-001",
  "status": "ADDITIONAL_INFO_REQUIRED",
  "missing_fields": [
    "course",
    "institution"
  ],
  "missing_documents": []
}
```

---

# 14. Consent Engine

Consent is a first-class domain concept.

The citizen must see:

- what data is requested
- which documents are requested
- why the data is required
- which service receives it
- when consent is given

Example:

```text
Data requested:
- Name
- Date of Birth
- Address
- Education
- Income Certificate
- 12th Marksheet

Purpose:
Post-Matric Scholarship Application
```

Store:

```text
user_id
application_id
service_id
data_categories
document_ids
purpose
status
granted_at
```

Possible status:

```text
GRANTED
DENIED
REVOKED
```

---

# 15. Final Application Preview

Preview must combine:

```text
Profile data
+
Education
+
Selected documents
+
Additional answers
+
Service information
```

The citizen must be able to review before payment/submission.

Example:

```text
Personal Information
Name: Rahul Kumar
DOB: 15/03/2005

Education
12th: 87%
Graduation: B.Tech CSE

Additional Information
College: ABC Engineering College
Course: Computer Science
Academic Year: 2026-27

Documents
12th Marksheet
Income Certificate
```

Do not mutate the current profile when storing service-specific answers.

---

# 16. Application Snapshot

When the user confirms the final preview, create an immutable snapshot.

Purpose:

The user's profile may change later, but the submitted application must preserve the exact values the citizen approved.

Store:

```text
application_snapshot
application_id
snapshot_json
created_at
```

The submitted application must use the snapshot as its source of truth.

---

# 17. Payment

Payment is mocked.

Architecture:

```text
PaymentProvider
    │
    └── MockPaymentProvider
```

Interface:

```python
create_payment(application)
get_payment_status(transaction_id)
```

For the demo:

```text
DEMO-TXN-12345
SUCCESS
```

Never connect to real payment processing for this hackathon.

---

# 18. DigiLocker Integration

Use the adapter pattern.

```text
DocumentProvider
    │
    ├── MockDigiLockerProvider
    │
    └── RealDigiLockerProvider (future)
```

For the hackathon only:

```text
MockDigiLockerProvider
```

Required conceptual methods:

```python
get_documents(user_id)
get_document(document_id)
request_consent(user_id, document_ids)
```

The rest of the system must depend on the `DocumentProvider` interface, not on mock-specific code.

The mock should return synthetic documents such as:

```text
Class 10 Marksheet
Class 12 Marksheet
Income Certificate
Caste Certificate
Driving Licence
Degree Certificate
```

---

# 19. Government Submission

Use another adapter.

```text
GovernmentSubmissionProvider
    │
    └── MockGovernmentSubmissionProvider
```

Method:

```python
submit(application_snapshot)
```

The mock should produce:

```text
government_reference_number
submission_timestamp
status = SUBMITTED
```

Do not call real government systems.

---

# 20. Eligibility Engine

Eligibility must be deterministic.

Do not use an LLM to make the actual eligibility decision.

Represent rules as structured data.

Example:

```json
{
  "all": [
    {
      "field": "age",
      "operator": ">=",
      "value": 18
    },
    {
      "field": "education.level",
      "operator": "==",
      "value": "GRADUATE"
    }
  ]
}
```

Supported MVP operators:

```text
==
!=
>
>=
<
<=
IN
NOT_IN
```

Supported logical groups:

```text
all
any
```

AI may later explain eligibility results, but the backend rule engine remains authoritative.

---

# 21. Profile + Service Data Separation

Important rule:

The unified profile stores reusable citizen data.

Service-specific answers belong to the application.

Do NOT modify:

```text
profile.course
```

when a scholarship asks for:

```text
course
```

Instead:

```text
application.answers.course
```

This avoids contaminating the citizen profile with temporary service-specific information.

---

# 22. API Design

Use REST and JSON.

Base URL:

```text
/api
```

## Profile

```http
GET    /api/profile
PUT    /api/profile
```

## Education

```http
GET    /api/profile/education
POST   /api/profile/education
PUT    /api/profile/education/{id}
DELETE /api/profile/education/{id}
```

## Documents

```http
GET    /api/documents
GET    /api/documents/{id}
```

## DigiLocker

```http
GET    /api/digilocker/documents
POST   /api/digilocker/consent
GET    /api/digilocker/documents/{id}
```

## Services

```http
GET    /api/services
GET    /api/services/{id}
GET    /api/services/{id}/requirements
```

## Applications

```http
POST   /api/services/{service_id}/applications
GET    /api/applications
GET    /api/applications/{id}

PUT    /api/applications/{id}/additional-data
POST   /api/applications/{id}/consent
GET    /api/applications/{id}/preview
POST   /api/applications/{id}/finalize
POST   /api/applications/{id}/payment
POST   /api/applications/{id}/submit
```

## Eligibility

```http
GET /api/services/{service_id}/eligibility
```

---

# 23. Frontend Architecture

Use Next.js App Router.

Suggested routes:

```text
/login
/dashboard
/profile
/services
/services/[serviceId]
/applications
/applications/[applicationId]
/applications/[applicationId]/additional
/applications/[applicationId]/consent
/applications/[applicationId]/preview
/applications/[applicationId]/payment
/applications/[applicationId]/success
/settings
```

---

# 24. Frontend Components

Reusable components:

```text
ProfileCard
ServiceCard
ServiceList
RequirementList
DynamicForm
DynamicField
ConsentDialog
DocumentCard
DocumentSelector
ApplicationSummary
ApplicationProgress
PaymentCard
StatusBadge
AccessibilitySettings
LanguageSwitcher
```

The `DynamicForm` component is especially important.

It receives a service schema and renders fields dynamically.

---

# 25. State Management

Do not introduce Redux initially.

Use:

- React local state
- React Hook Form for forms
- Server requests through a small API client
- URL state where appropriate

Only introduce a global state library if a concrete need appears.

---

# 26. API Client

Create a single frontend API helper.

Example:

```typescript
api("/api/services")
api("/api/profile")
api("/api/applications/APP-001/preview")
```

Avoid scattering raw `fetch()` calls throughout components.

---

# 27. Validation

Frontend:

```text
React Hook Form
+
Zod
```

Backend:

```text
Pydantic
```

Validation must happen on the backend even if frontend validation exists.

Never trust the browser.

---

# 28. Database Rules

Use SQLAlchemy models.

Use Alembic for schema migrations.

Do not directly write SQL throughout route files.

Preferred structure:

```text
Router
  ↓
Service layer
  ↓
Repository/database operations
```

For a small MVP, repositories can remain lightweight. Do not over-engineer repository abstractions that provide no value.

---

# 29. Backend Layer Responsibilities

## API/routers

Responsible for:

- HTTP
- request/response
- authentication dependency
- status codes

Not business logic.

## Schemas

Responsible for:

- request models
- response models
- validation

## Models

Responsible for:

- database representation

## Services

Responsible for:

- business rules
- application lifecycle
- eligibility
- consent
- document selection
- payment orchestration

## Integrations

Responsible for:

- mock/real external provider interfaces

---

# 30. Error Handling

Use consistent API errors.

Example:

```json
{
  "detail": {
    "code": "MISSING_REQUIRED_FIELD",
    "message": "Institution is required."
  }
}
```

Frontend should display human-readable messages.

Do not expose stack traces to users.

---

# 31. Accessibility Requirements

Accessibility is part of the product, not a future patch.

MVP requirements:

- semantic HTML
- keyboard navigation
- visible focus state
- labels for every form control
- accessible error messages
- sufficient contrast
- large enough click/touch targets
- no color-only status indicators
- reduced-motion support
- text-size setting
- screen-reader-friendly structure

Avoid unnecessary animation.

---

# 32. Language Support

Do not hard-code UI text.

Use translation files:

```text
src/i18n/
├── en.json
├── hi.json
└── ta.json
```

For the hackathon, fully support:

- English
- Hindi
- one regional language

The architecture should support more languages later.

---

# 33. Mock Data

Use synthetic data only.

Example demo citizen:

```text
Name: Rahul Kumar
Email: rahul.demo@example.com
DOB: 2005-03-15
```

Never use real personal information.

Seed:

- 1–3 demo users
- 3–4 services
- synthetic documents
- synthetic applications

---

# 34. Demo Services

## Service 1: Government Recruitment Exam

Required profile:

```text
name
dob
gender
address
category
education
```

Documents:

```text
photograph
signature
degree_certificate
```

Additional fields:

```text
exam_city
post_preference
```

Fee:

```text
100
```

---

## Service 2: Post-Matric Scholarship

Required profile:

```text
name
dob
address
category
education
```

Documents:

```text
income_certificate
marksheet
```

Additional fields:

```text
course
institution
academic_year
```

Fee:

```text
0
```

---

## Service 3: Driving Licence Application

Required profile:

```text
name
dob
address
```

Documents:

```text
photograph
identity_document
```

Additional fields:

```text
licence_type
vehicle_class
```

Fee:

```text
200
```

---

# 35. Demo UX

The most important interaction is:

```text
Service
  ↓
Apply
  ↓
Additional information (only if required)
  ↓
Consent
  ↓
Preview
  ↓
Mock payment
  ↓
Submitted
```

Do not add unnecessary forms between these steps.

Do not make the user re-enter existing profile information.

---

# 36. Application Tracking

Dashboard should show:

```text
My Applications

Government Recruitment Exam
Status: Submitted
Reference: GOV-DEMO-0001

Post-Matric Scholarship
Status: Processing
Reference: GOV-DEMO-0002

Driving Licence
Status: Draft
```

Possible statuses:

```text
Draft
Awaiting Consent
Ready for Review
Payment Pending
Submitted
Processing
Completed
Rejected
```

---

# 37. Audit Log

Create an audit trail for important application actions.

Examples:

```text
APPLICATION_CREATED
DOCUMENT_ACCESSED
CONSENT_GRANTED
PREVIEW_CONFIRMED
PAYMENT_COMPLETED
APPLICATION_SUBMITTED
```

Suggested fields:

```text
id
user_id
application_id
action
metadata
created_at
```

Do not store unnecessary sensitive values in logs.

---

# 38. Security Principles

Even though this is a prototype:

- least privilege
- server-side authorization
- input validation
- no sensitive real data
- explicit consent
- immutable submitted snapshot
- audit trail
- environment variables for secrets
- no secrets committed to Git
- no government credentials in source code

---

# 39. Environment Variables

Frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Backend:

```env
APP_NAME=Unified Government Services API
DATABASE_URL=sqlite:///./unified_gov.db
FRONTEND_URL=http://localhost:3000
```

Any future secrets must be environment variables and must never be committed.

---

# 40. Development Commands

## Frontend

```bash
pnpm dev:web
pnpm build:web
pnpm lint:web
```

## Backend

```bash
pnpm api
```

Equivalent backend command:

```bash
cd apps/api
uv run uvicorn app.main:app --reload
```

## Backend tests

```bash
pnpm api:test
```

---

# 41. Implementation Order

Follow this order.

## Phase 1 — Foundation

- Next.js setup
- FastAPI setup
- SQLite
- CORS
- API client
- base layout

## Phase 2 — Profile

- demo login
- profile model
- profile page
- education
- documents

## Phase 3 — Services

- service model
- service seed data
- service listing
- service details
- requirements

## Phase 4 — Application Engine

- Apply endpoint
- draft application
- additional field schema
- dynamic form renderer
- save answers

## Phase 5 — Consent

- consent screen
- consent record
- access summary

## Phase 6 — Preview

- merge profile + documents + answers
- final preview
- finalize snapshot

## Phase 7 — Mock Payment

- payment screen
- mock payment
- transaction record

## Phase 8 — Submission

- mock government submission
- application number
- application status

## Phase 9 — Mock DigiLocker

- document listing
- synthetic consent
- document selection
- application document attachment

## Phase 10 — Accessibility and Language

- keyboard navigation
- focus management
- font-size controls
- contrast
- language switcher

## Phase 11 — Polish

- responsive mobile UI
- empty states
- loading states
- errors
- application tracking
- demo seed data
- final deployment

---

# 42. Codex Instructions

Codex must treat this file as the architectural source of truth.

Before implementing any significant feature:

1. Read `ARCHITECTURE.md`.
2. Inspect the existing repository.
3. Reuse existing components and patterns.
4. Do not rewrite working modules without a clear reason.
5. Do not introduce a new library when the existing stack can solve the problem.
6. Keep changes focused.
7. Preserve type safety.
8. Add or update tests for backend business logic.
9. Keep external integrations behind interfaces/adapters.
10. Never access live government systems.

### Codex should NOT

- invent undocumented APIs
- scrape government websites
- add real Aadhaar/PAN/OTP/payment functionality
- add real DigiLocker credentials
- build microservices
- introduce Redux without a concrete requirement
- hard-code service-specific forms
- put business logic in React components
- put business logic directly in API route functions
- use AI for authoritative eligibility decisions
- replace working architecture just for stylistic reasons

---

# 43. AI Development Workflow

Codex should implement one vertical slice at a time.

Recommended order:

```text
Profile
  ↓
Service listing
  ↓
Apply
  ↓
Additional fields
  ↓
Consent
  ↓
Preview
  ↓
Mock payment
  ↓
Submit
  ↓
Tracking
  ↓
Mock DigiLocker
  ↓
Accessibility/language
```

After each slice:

- run frontend lint/build
- run backend tests
- verify the main user flow
- keep the diff focused

---

# 44. Testing Strategy

## Backend

Test:

- profile creation/update
- service retrieval
- application creation
- missing-field detection
- consent
- preview generation
- snapshot creation
- payment
- submission
- eligibility rules

## Frontend

At minimum manually verify:

- mobile layout
- keyboard navigation
- forms
- error states
- consent flow
- preview
- payment
- success page

Automated frontend tests can be added if time permits.

---

# 45. Production Extension (Not Part of MVP)

A future production architecture could replace mocks:

```text
MockDigiLockerProvider
       ↓
DigiLockerProvider

MockPaymentProvider
       ↓
PaymentProvider

MockGovernmentSubmissionProvider
       ↓
OfficialGovernmentSubmissionProvider
```

The application core should remain unchanged.

Possible future additions:

- real DigiLocker integration
- department APIs
- stronger identity/authentication
- government-side service configuration portal
- real notification services
- multilingual expansion
- AI assistance
- voice interface
- advanced eligibility explanation

These are explicitly out of scope for the current hackathon prototype.

---

# 46. Product Architecture Summary

```text
                    CITIZEN
                       │
                       ▼
                ┌───────────────┐
                │    Next.js    │
                │     React     │
                └───────┬───────┘
                        │
                      REST
                        │
                        ▼
                ┌───────────────┐
                │    FastAPI    │
                │               │
                │ Profile       │
                │ Services      │
                │ Applications  │
                │ Consent       │
                │ Eligibility   │
                │ Documents     │
                │ Payment       │
                └───────┬───────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
      Database      Mock Providers   Storage
          │             │
          │        ┌────┼─────────────┐
          │        ▼    ▼             ▼
          │   DigiLocker Payment   Government
          │
          ▼
   Application Snapshot
   + Audit Log
```

Core experience:

```text
ONE PROFILE
     ↓
MANY SERVICES
     ↓
ONLY ADDITIONAL DATA WHEN NEEDED
     ↓
EXPLICIT CONSENT
     ↓
FINAL PREVIEW
     ↓
PAYMENT
     ↓
SUBMISSION
     ↓
TRACKING
```

---

# 47. Definition of Done for Hackathon MVP

The MVP is considered complete when a reviewer can:

1. Log in using a demo account.
2. See a citizen profile.
3. Browse government services.
4. Open a service.
5. Click Apply.
6. Enter only the service-specific additional information.
7. View a clear consent request.
8. Confirm consent.
9. See a complete final application preview.
10. Complete a mock payment where applicable.
11. Submit the application.
12. Receive a synthetic application/reference number.
13. Track the application afterwards.
14. See mock DigiLocker documents used by an application.
15. Change the language.
16. Use the main flow with keyboard navigation.
17. Complete the flow on a mobile-sized viewport.

The reviewer must never be led to believe that the prototype is an official government system or that the prototype is connected to live government infrastructure.
