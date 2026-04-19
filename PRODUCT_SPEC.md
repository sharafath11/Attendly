# Attendly Product Spec

## Product Summary
Attendly is a multi-tenant SaaS platform for tuition centers. It combines center operations, parent communication, subscription monetization, and admin oversight into a single system.

Core positioning:
- A business operating system for tuition centers
- WhatsApp-first operational workflow
- Subscription-driven SaaS product
- Multi-role platform with clear separation between owners, teachers, parents, and super admin

## Product Vision
Attendly should feel like a real startup product:
- premium and trustworthy
- simple for non-technical center operators
- scalable for multi-tenant SaaS growth
- monetizable through plans and subscription control
- operationally strong enough for real center usage

Primary business goals:
- help centers manage students, teachers, batches, attendance, and fees
- automate parent communication
- improve operational visibility
- provide platform-level revenue and growth insights
- support investor-grade presentation and scale

## Current Product Scope

### Public Website
Current public surface:
- `/`
- `/demo`
- `/register-center`

Current capabilities:
- landing page
- product positioning
- CTA to register center
- demo/pricing-style surface

Current gaps:
- no dedicated `/features` page yet
- no dedicated `/pricing` page yet
- testimonials and FAQ are not yet structured as standalone conversion assets

### Center App
Current platform routes:
- `/dashboard`
- `/students`
- `/teachers`
- `/batches`
- `/attendance`
- `/fees`
- `/reports`
- `/settings`
- `/teacher-attendance`
- `/teacher-attendance-history`
- `/teacher-payments`
- `/automation`
- `/messages`
- `/subscription-status`
- `/onboarding`

### Admin App
Current admin routes:
- `/admin/login`
- `/admin/dashboard`
- `/admin/centers`
- `/admin/centers/[id]`
- `/admin/users`
- `/admin/payments`
- `/admin/logs`

### Parent App
Current parent routes:
- `/parent`
- `/parent/login`
- `/parent/attendance`
- `/parent/fees`
- `/parent/updates`

### Owner Insights
Current status:
- no dedicated `/owner-insights` page yet
- platform-level metrics already exist through admin APIs and admin dashboard
- can be promoted into a private founder analytics control room

## Roles

### super_admin
Purpose:
- platform operator
- approves centers
- manages subscriptions
- monitors platform growth, revenue, and user health

### center_owner
Purpose:
- runs a tuition center
- manages teachers, students, batches, attendance, fees, and parent communication

### teacher
Purpose:
- supports operations inside a center
- can access limited academic/attendance workflows

### parent
Purpose:
- views child attendance, fees, and notifications
- OTP-only access

## Role Matrix

### super_admin
Can:
- log in to admin console
- view dashboard metrics
- list centers
- inspect center details
- approve centers
- reject centers
- block and unblock centers
- verify subscription/payment status
- view users
- verify/unverify users
- change user status
- view logs
- view revenue and growth analytics

### center_owner
Can:
- log in after approval
- view center dashboard
- manage students
- manage teachers
- manage batches
- mark attendance
- manage fees
- manage teacher attendance
- manage teacher payments
- configure automation settings
- send notifications and broadcasts
- create Razorpay orders and verify payments
- view reports and activity logs
- view subscription status

### teacher
Can:
- log in through regular platform auth
- view dashboard
- access students
- access batches
- mark/view attendance
- access teacher attendance routes
- trigger attendance alerts

Restrictions:
- cannot use owner-only admin actions like teacher creation, salary management, or center-level controls

### parent
Can:
- request OTP
- verify OTP
- switch center when one phone is linked to multiple centers
- view parent dashboard
- view fees
- view attendance
- view notifications

## Core Business Flows

### 1. Center Registration Flow
1. User visits `/register-center`
2. Submits center and owner details
3. OTP is sent
4. OTP is verified
5. Center is created with:
   - `status = pending`
   - `subscriptionStatus = pending_payment`
6. Owner user is created with:
   - `role = center_owner`
   - `status = pending`
7. Center waits for admin approval

### 2. Admin Approval Flow
1. Super admin logs in
2. Opens `/admin/centers`
3. Approves center
4. System updates:
   - center status to `verified`
   - owner user status to `active`
   - subscription status to `active`

### 3. Owner Operations Flow
1. Owner logs in
2. Creates teachers
3. Creates batches
4. Creates students
5. Links parents via parent phone
6. Marks attendance
7. Tracks fees and payments
8. Uses communication tools to reach parents
9. Reviews dashboard and reports

### 4. Parent Access Flow
1. Parent enters phone number
2. OTP is requested and verified
3. Parent session is created
4. Parent sees linked children and center-specific data

### 5. Subscription Enforcement Flow
1. Center subscription is active: full platform access
2. Subscription expired: read-heavy experience remains available in some areas
3. Write actions are blocked by subscription middleware
4. Blocked center: complete access denial

## Current Features

### Public / Conversion Features
- polished landing page
- marketing-focused dashboard preview
- hero CTA
- demo page
- center registration page
- mobile-friendly navigation
- GSAP-assisted landing motion support

### Authentication Features
- JWT access token
- JWT refresh token
- role-based auth
- separate admin auth flow
- parent OTP auth flow
- Google auth for staff-side login
- HTTP-only cookies
- separate cookie names for staff, admin, and parent
- login rate limiting

### Center Management Features
- center registration
- center approval workflow
- center blocking and unblocking
- center payment/subscription status management
- center-level plan metadata
- teacher/student limits by plan

### Dashboard Features
- student totals
- batch totals
- attendance trends
- pending fee counts
- pending fee amount
- fee collection chart
- recent attendance
- recent payments
- upcoming classes
- admin-level platform metrics and charts

### Student Features
- create student
- update student
- list students
- search students
- filter students
- view student detail
- soft delete student
- assign batch
- assign monthly fee
- assign parent phone
- enforce plan student limit

### Teacher Features
- create teacher
- update teacher
- delete teacher
- enable/disable teacher
- reset teacher password
- auto-generate credentials
- assign subjects
- assign salary field

### Batch Features
- create batch
- update batch
- delete batch
- assign teacher
- define days
- define class level
- define medium
- define session
- define schedule time
- calculate batch student count

### Attendance Features
- mark student attendance by batch/date
- mark individual attendance
- attendance history
- student summary
- batch summary
- low-attendance detection
- teacher attendance tracking

### Fee Features
- generate monthly fee records
- list fee rows
- view pending fees
- mark fees paid
- update fee status
- overdue tracking
- fee reporting support

### Payroll Features
- create teacher payment records
- list teacher payments
- filter by teacher and period

### Notification Features
- WhatsApp-first sending
- email fallback in selected flows
- fee reminders
- attendance alerts
- broadcast messaging
- payment confirmation alerts
- notification logging
- fee reminder throttling

### Parent Features
- OTP login
- multi-center support
- child list
- attendance view
- fee view
- notifications view
- center-specific session context

### Admin Features
- admin auth
- center list/detail
- approval/rejection
- block/unblock
- payment status update
- user verification
- user status changes
- platform metrics
- charts
- revenue visibility
- top centers by payment volume
- logs
- CSV export from dashboard

### Automation Features
- automation settings per center
- auto fee generation toggle
- fee reminder toggle
- reminder days setting
- attendance default toggle
- cron-style subscription expiry job
- automation and retention job scaffolding

### Technical / Operational Features
- multi-tenant `centerId` isolation
- controller/service/repository backend pattern
- MongoDB data model
- Redis-backed OTP/session-like flows
- Dockerized backend and Redis
- separate local/prod env support
- CSV export utility
- blocked state UX

## API Map

### Auth
- `POST /api/auth/login`
- `POST /api/auth/signup`
- `POST /api/auth/verify-otp`
- `POST /api/auth/resend-otp`
- `POST /api/auth/google`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/auth/refresh-token`

### Admin Auth
- `POST /api/admin/auth/login`
- `GET /api/admin/auth/me`
- `POST /api/admin/auth/refresh-token`
- `POST /api/admin/auth/logout`

### Centers
- `POST /api/centers/register`
- `POST /api/centers/register/request-otp`
- `POST /api/centers/register/verify-otp`
- `POST /api/centers/register/resend-otp`
- `GET /api/centers/status`
- `GET /api/centers/my-center`

### Admin
- `GET /api/admin/dashboard`
- `GET /api/admin/dashboard/charts`
- `GET /api/admin/metrics`
- `GET /api/admin/revenue`
- `GET /api/admin/users`
- `GET /api/admin/logs`
- `GET /api/admin/centers`
- `GET /api/admin/centers/:id`
- `POST /api/admin/centers/:id/block`
- `POST /api/admin/centers/:id/unblock`
- `POST /api/admin/centers/:id/payment-status`
- `POST /api/admin/centers/:id/verify`
- `POST /api/admin/centers/:id/reject`
- `POST /api/admin/subscriptions/verify-payment/:centerId`
- `POST /api/admin/subscriptions/reject-payment/:centerId`
- `POST /api/admin/users/:id/verify`
- `POST /api/admin/users/:id/unverify`
- `POST /api/admin/users/:id/status`

### Dashboard
- `GET /api/dashboard`

### Students
- `POST /api/students`
- `GET /api/students`
- `GET /api/students/:id`
- `PUT /api/students/:id`
- `DELETE /api/students/:id`

### Teachers
- `POST /api/teachers`
- `GET /api/teachers`
- `GET /api/teachers/:id`
- `PATCH /api/teachers/:id`
- `PATCH /api/teachers/:id/status`
- `DELETE /api/teachers/:id`
- `POST /api/teachers/:id/reset-password`

### Batches
- `POST /api/batches`
- `GET /api/batches`
- `GET /api/batches/:id`
- `PUT /api/batches/:id`
- `DELETE /api/batches/:id`

### Attendance
- `GET /api/attendance`
- `GET /api/attendance/history`
- `POST /api/attendance`
- `GET /api/attendance/student/:studentId/summary`
- `GET /api/attendance/batch/:batchId/summary`
- `GET /api/attendance/batch/:batchId/low-attendance`

### Teacher Attendance
- `GET /api/teacher-attendance`
- `POST /api/teacher-attendance`

### Fees
- `GET /api/fees`
- `GET /api/fees/pending`
- `POST /api/fees/mark-paid`
- `PATCH /api/fees/update-status`

### Teacher Payments
- `GET /api/teacher-payments`
- `POST /api/teacher-payments`

### Notifications
- `POST /api/notifications/fee-reminder/:studentId`
- `POST /api/notifications/attendance-alert`
- `POST /api/notifications/broadcast`

### Automation
- `GET /api/automation/settings`
- `PATCH /api/automation/settings`

### Activity Logs
- `GET /api/activity-logs`

### Payments
- `POST /api/payments/create-order`
- `POST /api/payments/verify`
- `GET /api/payments/history`

### Parent
- `POST /api/parent/auth/request-otp`
- `POST /api/parent/auth/verify-otp`
- `POST /api/parent/auth/logout`
- `POST /api/parent/auth/refresh-token`
- `GET /api/parent/me`
- `GET /api/parent/dashboard`
- `GET /api/parent/attendance`
- `GET /api/parent/fees`
- `GET /api/parent/notifications`

## Gaps Against Investor-Grade Target

### Product / UX Gaps
- dedicated `/features` page missing
- dedicated `/pricing` page missing
- premium testimonial/case-study section needs expansion
- FAQ page/section needs formal structure
- reports page is still placeholder-driven
- owner insights page is not yet implemented

### Business Intelligence Gaps
- no dedicated MRR/ARR dashboard page for founder use
- no churn calculation surfaced in UI
- no conversion funnel reporting surface
- no payment success/failure funnel dashboard
- no system health dashboard

### Monetization Gaps
- subscription billing UX can be more polished
- no self-serve checkout lifecycle for plans yet
- feature gating is present, but packaging can be clearer in product UI

### Platform / Reliability Gaps
- notification processing is synchronous in major flows
- no queue-backed worker architecture yet
- no explicit feature-flag system in admin UI
- no SMS fallback yet
- no CI/CD pipeline files documented in repo

### Reporting Gaps
- CSV exists
- PDF export not yet implemented
- no advanced scheduled reports

## Roadmap

### Phase 1: Product Polish
- create `/features`
- create `/pricing`
- refine landing page storytelling
- add stronger testimonials and FAQ
- replace placeholder reports with real analytics export workflows

### Phase 2: Founder Selling Layer
- add `/owner-insights`
- predefined private login
- MRR, ARR, churn, conversion, growth, payment funnel, center health metrics
- exportable founder dashboard

### Phase 3: Monetization Hardening
- self-serve plan upgrades
- richer billing and invoice history
- clearer plan feature matrix
- renewal reminders

### Phase 4: Reliability & Scale
- Redis-backed job queues
- notification worker separation
- retry logic for WhatsApp/email
- stronger audit logs
- feature flags

### Phase 5: Advanced Sellable Features
- SMS fallback
- PDF reports
- dark mode polish
- deeper parent engagement analytics
- center performance benchmarking

## Suggested Founder Narrative
Attendly is a SaaS operating system for tuition centers. It helps owners run attendance, fees, staff, parent communication, and subscriptions from a single platform. The business model is subscription-first, the system is multi-tenant by design, and the product is already structured to evolve into a premium, investor-grade vertical SaaS offering.

