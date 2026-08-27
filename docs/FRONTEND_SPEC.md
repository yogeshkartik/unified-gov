# Codex Prompt — Build the Frontend

You are working on the **Unified Government Services** hackathon prototype.

Before making any changes:

1. Read `ARCHITECTURE.md` completely.
2. Inspect the existing `apps/web` project.
3. Preserve the current stack and repository structure.
4. Do not modify the backend in this task.
5. Do not add unnecessary libraries.
6. Use the existing shadcn/ui setup with **React Aria**, plus Tailwind, React Hook Form, Zod, and Lucide.

## Goal

Build the citizen-facing frontend for a unified government-service portal.

The citizen should create/use one profile and then apply to different services without re-entering common information.

The application flow must be:

**Service → Apply → Additional Information if required → Consent → Final Preview → Payment if required → Submitted**

Do not show common profile data as editable form fields during application. The profile is reused internally.

## Build These Routes

Create these pages using Next.js App Router:

```text
/
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

## Landing Page

Create a clean public landing page.

It should communicate:

- One citizen profile
- Multiple government services
- Reuse documents through DigiLocker
- Only provide additional information when required
- Explicit consent before sharing information
- Accessible and multilingual experience

Use a clear CTA:

```text
Explore Services
Continue as Demo Citizen
```

Clearly display:

> Prototype only — not an official government website.

Do not use government logos or designs that imply official approval.

## Demo Login

Build a simple demo login.

No real authentication is required yet.

Example:

```text
Demo Citizen

Rahul Kumar
rahul.demo@example.com

[Continue as Demo Citizen]
```

Do not use real Aadhaar, PAN, phone numbers, OTPs, passwords, or sensitive information.

## Main Layout

Create a responsive citizen dashboard layout.

Desktop:

```text
Sidebar
+
Top Header
+
Main Content
```

Mobile:

```text
Top Header
+
Mobile navigation / drawer
+
Main Content
```

Sidebar/navigation items:

```text
Dashboard
My Profile
Government Services
My Applications
My Documents
Settings
```

Include:

```text
Language switcher
Accessibility controls
Demo Citizen profile menu
```

## Dashboard

Build a polished dashboard with:

### Welcome section

```text
Good morning, Rahul

Access government services using your reusable citizen profile.
```

### Profile completion

Example:

```text
Profile Complete
92%

Personal details     ✓
Address              ✓
Education            ✓
Documents            3 available
```

### Service categories

Show cards for:

```text
Government Exams
Scholarships
Licences
Government Schemes
Certificates
```

### Recommended / Available Services

Use seeded mock data for now:

1. Government Recruitment Exam — Demo
2. Post-Matric Scholarship — Demo
3. Driving Licence Application — Demo

Each service card should show:

```text
Service name
Department
Category
Deadline
Fee
Short description
View Details
Apply Now
```

### My Applications

Show recent applications with statuses:

```text
Submitted
Draft
Processing
Payment Pending
```

## Profile Page

Build a reusable citizen profile interface.

Sections:

```text
Personal Information
Contact Information
Address
Education
Documents
```

Use React Hook Form + Zod.

Profile fields may include synthetic values such as:

```text
Full Name
Date of Birth
Gender
Email
Mobile
Category
Permanent Address
Current Address
Education
```

Do not include real sensitive government IDs.

Use a profile completion indicator.

## Government Services Page

Create:

```text
/services
```

Features:

- search
- category filters
- service cards
- fee indicator
- application deadline
- eligibility status
- clear Apply button

Categories:

```text
Exam
Scholarship
Licence
Scheme
Certificate
Recruitment
```

Use mock service data initially, but structure components so they can later consume the FastAPI API.

## Service Details Page

Example:

```text
/services/SCHOLARSHIP_001
```

Show:

```text
Service Name
Department
Description
Eligibility
Required Profile Information
Required Documents
Additional Information Required
Application Fee
Deadline
```

Important:

Do NOT show existing profile information as fields the user needs to refill.

Instead display:

```text
Information reused from your profile

✓ Name
✓ Date of Birth
✓ Address
✓ Education
```

Documents:

```text
✓ 12th Marksheet — DigiLocker
✓ Income Certificate — DigiLocker
```

Additional information:

```text
Course
Institution
Academic Year
```

Primary CTA:

```text
Apply Now
```

## Application Progress

All application pages should have a consistent progress indicator.

Example:

```text
1. Additional Info
2. Consent
3. Preview
4. Payment
5. Submitted
```

For free services, payment can be skipped.

## Additional Information Page

Route:

```text
/applications/[applicationId]/additional
```

This page should render only service-specific fields.

Example scholarship:

```text
Current Course
Institution Name
Academic Year
```

Example recruitment exam:

```text
Exam City
Post Preference
```

Example driving licence:

```text
Vehicle Class
Licence Type
```

Do NOT create three separate hard-coded forms.

Build a reusable:

```text
DynamicForm
DynamicField
```

The form should consume a schema such as:

```json
[
  {
    "key": "course",
    "label": "Current Course",
    "type": "text",
    "required": true
  },
  {
    "key": "academic_year",
    "label": "Academic Year",
    "type": "select",
    "required": true,
    "options": ["2026-27", "2027-28"]
  }
]
```

Support initially:

```text
text
number
date
select
radio
checkbox
textarea
```

Use React Hook Form and Zod validation.

## Consent Page

Route:

```text
/applications/[applicationId]/consent
```

Build a clear consent experience.

Show:

```text
This service wants to use:

Profile information
✓ Name
✓ Date of Birth
✓ Address
✓ Education

Documents
✓ Class 12 Marksheet
✓ Income Certificate

Purpose
Post-Matric Scholarship Application
```

Explain clearly:

> Only the information listed above will be used for this application.

Actions:

```text
Cancel
Give Consent & Continue
```

Do not use a pre-checked consent checkbox.

Consent must be an explicit action.

## Final Preview Page

Route:

```text
/applications/[applicationId]/preview
```

This is a critical screen.

Combine visually:

```text
Profile data
Documents
Additional answers
Service information
Fee
```

Sections:

```text
Personal Information
Address
Education
Documents
Additional Information
Application Fee
```

Display source badges where useful:

```text
Profile
DigiLocker
Application
```

Example:

```text
Name
Rahul Kumar
Profile

12th Marksheet
Available
DigiLocker

Course
B.Tech Computer Science
Application
```

Actions:

```text
Back
Confirm & Continue
```

The user should be able to clearly understand exactly what will be submitted.

## Payment Page

Route:

```text
/applications/[applicationId]/payment
```

This is mock payment only.

Clearly label:

> Demo Payment — No real money will be charged.

Display:

```text
Application Fee
₹100

Total
₹100
```

Button:

```text
Pay ₹100 — Demo
```

Simulate:

```text
Processing...
Payment Successful
```

Generate a synthetic transaction ID such as:

```text
DEMO-TXN-12345
```

For free services, skip this page.

## Success Page

Route:

```text
/applications/[applicationId]/success
```

Display:

```text
Application Submitted Successfully

Application Number
GOV-DEMO-2026-000123

Service
Government Recruitment Exam — Demo

Status
Submitted
```

Actions:

```text
View Application
Go to Dashboard
```

Clearly state:

> This is a prototype submission and was not sent to a live government system.

## My Applications

Route:

```text
/applications
```

Show application cards/table with:

```text
Service
Application Number
Date
Status
Fee
Action
```

Statuses:

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

Use badges, but never rely on color alone.

## Application Details

Route:

```text
/applications/[applicationId]
```

Show:

```text
Application number
Service
Submitted data
Documents
Consent
Payment
Current status
Timeline
```

Timeline example:

```text
Application created
Additional details completed
Consent granted
Payment completed
Application submitted
```

## My Documents

Create a reusable component/page section displaying mock DigiLocker-style documents.

Examples:

```text
Class 10 Marksheet
Class 12 Marksheet
Income Certificate
Degree Certificate
Driving Licence
```

Show source:

```text
Mock DigiLocker
```

Do not imply a real DigiLocker connection.

## Settings

Route:

```text
/settings
```

Build:

### Language

Implement architecture-ready localization.

Support initially:

```text
English
Hindi
Tamil
```

Create translation files such as:

```text
src/i18n/en.json
src/i18n/hi.json
src/i18n/ta.json
```

Do not hard-code repeated UI strings when practical.

### Accessibility

Implement:

```text
Text size
High contrast
Reduce motion
```

Persist preferences locally for the prototype.

No voice assistant.

No AI chatbot.

## Accessibility Requirements

The frontend must be usable with:

- keyboard navigation
- visible focus indicators
- screen readers
- mobile touch
- large text
- reduced motion

Use:

- semantic HTML
- `<label>` relationships
- accessible error text
- ARIA only when semantic HTML is insufficient
- sufficient contrast
- minimum practical touch targets

Do not use color alone to communicate state.

## Mobile-First Requirements

The hackathon explicitly values real Indian users on mobile and slower connections.

Optimize for:

- 360px width
- 390px width
- 768px
- desktop

Avoid:

- giant hero graphics
- unnecessary images
- heavy animation
- video backgrounds
- large client-side dependencies

Prefer simple cards and text.

## Loading / Empty / Error States

Implement reusable UI for:

```text
Loading
No services available
No applications yet
API unavailable
Validation error
Payment failed
Document missing
```

Do not leave blank screens.

## Mock Data Architecture

Do not scatter mock objects across pages.

Create a dedicated location such as:

```text
src/lib/mock-data/
```

or:

```text
src/data/
```

Example:

```text
services.ts
profile.ts
applications.ts
documents.ts
```

Later these should be easy to replace with API calls.

## API Layer

Create one API abstraction:

```text
src/lib/api.ts
```

Components should not contain repeated raw fetch logic.

Keep the frontend ready for FastAPI endpoints such as:

```text
GET /api/profile
GET /api/services
GET /api/services/{id}
POST /api/services/{id}/applications
PUT /api/applications/{id}/additional-data
POST /api/applications/{id}/consent
GET /api/applications/{id}/preview
POST /api/applications/{id}/payment
POST /api/applications/{id}/submit
GET /api/applications
```

If these endpoints are not implemented yet, use typed mock adapters without blocking the frontend.

## TypeScript Requirements

Avoid `any`.

Create reusable types:

```text
CitizenProfile
GovernmentService
ServiceField
Document
Application
Consent
Payment
ApplicationStatus
```

Prefer unions/enums for:

```text
ServiceType
FieldType
ApplicationStatus
DocumentSource
```

## Component Design

Prefer small reusable components over giant page files.

Suggested components:

```text
AppShell
Sidebar
MobileNav
PageHeader
ProfileCompletion
ServiceCard
ServiceCategoryCard
ServiceRequirements
DynamicForm
DynamicField
ConsentSummary
DocumentCard
ApplicationProgress
ApplicationPreview
ApplicationStatusBadge
ApplicationTimeline
MockPaymentCard
LanguageSwitcher
AccessibilityMenu
EmptyState
ErrorState
LoadingState
PrototypeBanner
```

## Visual Direction

The visual style should be:

- simple
- trustworthy
- neutral
- modern
- spacious
- accessible
- mobile friendly

Avoid making it look like a fintech startup or flashy SaaS dashboard.

Prefer:

- white/light surfaces
- restrained borders
- readable typography
- clear hierarchy
- simple icons
- strong action buttons

Do not copy an existing government portal visually.

## Important Prototype Banner

Display a small persistent notice such as:

> Demo Prototype — Not an official government service. All data and integrations shown are synthetic.

This can appear near the top of the application or footer without becoming visually distracting.

## Do Not Implement

Do NOT add:

- voice assistance
- AI chatbot
- real DigiLocker
- real Aadhaar
- real PAN
- real OTP
- real payment
- real government APIs
- admin portal
- Redux
- GraphQL
- complex animations
- government logos

## Development Rules

1. Read `ARCHITECTURE.md` first.
2. Inspect existing components before creating new ones.
3. Reuse shadcn/ui components.
4. Keep files reasonably small.
5. Keep service forms schema-driven.
6. Keep business logic outside presentation components.
7. Keep mock integration details isolated.
8. Preserve strict TypeScript.
9. Do not alter backend files.
10. Do not replace the existing architecture.

## Validation Before Finishing

Run:

```bash
pnpm lint
pnpm build
```

Fix all errors.

Also inspect the main journey manually:

```text
Demo Login
→ Dashboard
→ Services
→ Scholarship
→ Apply
→ Additional information
→ Consent
→ Preview
→ Mock payment / skip if free
→ Success
→ My Applications
```

Check:

- desktop
- mobile
- keyboard navigation
- form validation
- loading/error states

## Final Response

When finished, report:

1. Pages created
2. Components created
3. Mock data created
4. Application flow implemented
5. Accessibility features implemented
6. Localization implemented
7. Any assumptions
8. Anything intentionally left for backend integration
9. Results of `pnpm lint`
10. Results of `pnpm build`

Do not implement anything outside this frontend scope.