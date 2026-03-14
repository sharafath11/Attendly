# Attendly – Multi-tenant Tuition Center SaaS
Attendly is a **multi-tenant SaaS platform** for tuition centers. It allows center owners to manage teachers, students, batches, attendance, fees, and teacher salary payments with strict **subscription control**, **role-based access**, and **production-grade validation**.
---
## 1. Architecture Overview
### Tech Stack
- **Backend**
  - Node.js, **Express 5**, TypeScript
  - MongoDB + **Mongoose**
  - JWT-based authentication (access + refresh tokens, HTTP-only cookies)
  - `bcrypt` for password hashing
  - Redis (OTP / short-lived data)
  - Nodemailer (email OTP)
  - `tsyringe` for dependency injection
  - `express-rate-limit` for login rate limiting
- **Frontend**
  - **Next.js** (App Router)
  - React + TypeScript
  - React Query for data fetching and caching
  - Tailwind-like utility classes + custom UI components
### Backend Architecture Pattern
- **Layers**
  - **Routes** map HTTP paths to controllers and attach middleware.
  - **Controllers**:
    - Accept and validate input (using custom validators).
    - Call services for business logic.
    - Respond via a **uniform JSON structure**.
  - **Services**:
    - Contain all business rules and workflows.
    - Coordinate between repositories and other services.
  - **Repositories**:
    - Encapsulate all DB access using Mongoose models.
    - Provide CRUD and query operations.
  - **Middleware**:
    - Authentication, role checks, subscription checks, and center-block checks.
- **Key Middleware**
  - `requireRole` / `requireAdminRole`: role-based access via JWT in cookies.
  - `authenticateToken`: generic JWT validation.
  - `checkCenterBlocked`: denies access for blocked centers.
  - `requireActiveSubscription`: denies write operations when subscription is not active.
  - `centerContext.middleware`: attaches tenant context (`centerId`) to each request.
---
## 2. Domain Model & Multi-tenancy
### Core Models
- `CenterModel`
  - Subscription data, plan type, teacher/student limits.
  - Fields for `status` (`pending`, `verified`, `rejected`), `subscriptionStatus` (`pending_payment`, `active`, `expired`, `blocked`), `blocked`, `blockedReason`, `subscriptionStartDate`, `subscriptionEndDate`.
- `UserModel`
  - Represents all users:
    - `super_admin`
    - `center_owner`
    - `teacher`
  - Includes `centerId`, `role`, `status`, `subjects` (for teachers), and credentials.
- `StudentModel`
  - Student profile and tuition metadata:
    - `centerId`, `batchId`, `monthlyFee`, `joinDate`, `isDeleted`.
- `BatchModel`
  - Batches/classes:
    - `batchName`, `classLevel`, `medium`, `session`, `scheduleTime`, `days`, `teacherId?`, `centerId`, `userId`.
- `AttendanceModel`
  - Student attendance by day:
    - `centerId`, `batchId`, `studentId`, `date`, `status` (`present`, `absent`, `leave`).
- `FeeModel`
  - Monthly fee entries per student:
    - `studentId`, `batchId`, `centerId`, `userId`, `month`, `year`, `amount`, `status`, `paymentMethod`, `paidDate`, `editHistory`.
- `TeacherPaymentModel`
  - Teacher salary/payment records:
    - `teacherId`, `centerId`, `amount`, `month`, `year`, `notes`, `paidDate`.
### Multi-tenancy
- Every tenant-related document includes a **`centerId`**.
- Services and repositories always filter on:
  - `centerId`, or
  - `userId` representing the owner’s user (for legacy/unified access).
- **Super admin** access is separate, using dedicated admin token and `requireAdminRole`.
### Indexes
For performance and uniqueness:
- **Centers**
  - `email` unique.
- **Users**
  - `{ centerId, username }` unique.
  - Additional indexes for `{centerId, role}` and one center_owner per center.
- **Students**
  - `centerId` indexed.
- **Attendance**
  - `{ studentId, date }` unique.
- **TeacherPayments**
  - `{ teacherId, month, year }` unique.
- **Fees**
  - Multiple compound indexes to support center/batch/student/month/year queries.
---
## 3. Authentication, Roles, and Security
### Roles
- `super_admin` – platform administrator.
- `center_owner` – owner of a tuition center.
- `teacher` – teacher account created by a center owner.
### Auth Flow
- Core routes under `/api/auth`:
  - `POST /api/auth/login`
  - `POST /api/auth/signup`
  - `POST /api/auth/verify-otp`
  - `POST /api/auth/resend-otp`
  - `POST /api/auth/google`
  - `GET /api/auth/me`
  - `POST /api/auth/logout`
  - `POST /api/auth/refresh-token`
- **Login behavior**
  - Body: `{ email?: string, username?: string, password: string }`.
  - Steps:
    1. Find user by email or username.
    2. Compare password (bcrypt).
    3. Require `isVerified` and `status === "active"`.
    4. Ensure associated `center` exists and is **not blocked**.
    5. **Do not** check subscription status → owners can still log in if subscription is expired.
    6. Issue access & refresh tokens (JWT) via cookies.
- **Rate limiting**
  - `POST /api/auth/login` is protected by `express-rate-limit`:
    - Max 5 attempts per minute.
    - On limit exceeded:
      ```json
      {
        "success": false,
        "message": "Too many login attempts. Please try again later."
      }
      ```
### Password Rules
- **Owner passwords**
  - Minimum length: **8**.
  - Validated at center registration and user signup.
  - Always hashed using **bcrypt**.
- **Teacher temporary passwords**
  - Automatically generated in `TeacherService`.
  - 8-character alphanumeric strings.
  - Hashed with bcrypt before storage.
  - Returned once to the owner as `{ username, temporaryPassword }`.
---
## 4. Subscription & Center Lifecycle
### Center Registration
- `POST /api/centers/register`
  - Body: `centerName, ownerName, email, phone, password, address, medium, planType`.
  - Validation:
    - All required, email format, phone format.
    - Password length ≥ 8.
    - `medium` is `"English"` or `"Malayalam"`.
    - `planType` is `"basic"` or `"pro"`.
  - Behavior:
    - Creates `Center`:
      - `status = "pending"`
      - `subscriptionStatus = "pending_payment"`
      - `blocked = false`
      - Plan limits (basic vs pro).
    - Creates `center_owner` user with `status = "pending"`.
### Admin Center Management
Admin routes under `/api/admin`:
- `GET /api/admin/centers`
- `GET /api/admin/centers/:id`
- `POST /api/admin/centers/:id/verify`
- `POST /api/admin/centers/:id/block`
- `POST /api/admin/centers/:id/unblock`
- `POST /api/admin/subscriptions/verify-payment/:centerId`
- User verification endpoints.
Key behaviors:
- **Verify center / subscription payment**
  - Set:
    - `status = "verified"`
    - `subscriptionStatus = "active"`
    - `subscriptionStartDate = now`
    - `subscriptionEndDate = now + 30 days`
    - `blocked = false`, clear blocked reason.
- **Block / unblock**
  - Block:
    - `blocked = true`
    - `subscriptionStatus = "blocked"`
    - `blockedReason`, `blockedAt`.
  - Unblock:
    - `blocked = false`
    - `subscriptionStatus = "active"`
    - clear `blockedReason`, `blockedAt`.
### Subscription Enforcement
- Middleware: `requireActiveSubscription`
  - Loads center by `centerId` / `userId`.
  - If `center.blocked`:
    - 403 with message `"Center blocked by administrator"` and a `reason`.
  - If `subscriptionStatus !== "active"`:
    - 403 with message `"Subscription inactive. Please contact administrator."`.
- Applied to **write/operational** routes:
  - Students: POST/PUT/DELETE.
  - Batches: POST/PUT/DELETE.
  - Attendance: POST.
  - Fees: all routes.
  - Teachers: create/update/delete/reset password.
  - Teacher payments: create/list.
- Read-only routes (e.g., GET lists, `GET /api/centers/my-center`, dashboard data) are still allowed when subscription is `expired` or `pending_payment` (if not blocked).
### Subscription Expiry Job
- Background job `startSubscriptionExpiryJob`:
  - Runs on startup and every 12 hours.
  - Finds centers where:
    - `subscriptionEndDate < now`, and
    - `subscriptionStatus` not already `"expired"` or `"blocked"`.
  - Sets:
    - `subscriptionStatus = "expired"`.
Effect:
- Expired centers:
  - Can log in and **view** data.
  - Cannot perform write operations (blocked by `requireActiveSubscription`).
  - Frontend shows explicit warnings.
---
## 5. Feature Domains
### Teachers
- Routes: `/api/teachers`
- Access:
  - Only `center_owner` can create, update, delete teachers or reset their passwords.
- Validations:
  - `name`: required string.
  - `phone`: valid phone.
  - `subjects`: array of allowed subjects:
    - `Malayalam`, `English`, `Maths`, `Physics`, `Chemistry`, `Biology`, `Computer Science`.
- Behavior:
  - Auto-generate username: `centername_teacher_XX`.
  - Auto-generate 8-char alphanumeric temp password (bcrypt-hashed).
  - Store teacher as `User` with `role = "teacher"` and `subjects` array.
  - Reset password endpoint returns new temp password.
### Students
- Routes: `/api/students`.
- Write operations require active subscription; reads allowed in read-only mode.
- Validations:
  - `name`, `phone`, `batchId`, `monthlyFee`, `joinDate`.
  - Phone format, ObjectId checks, numeric & date validations.
- Behavior:
  - Enforces center-level `studentLimit` per subscription plan.
  - Verifies that `batchId` belongs to the same center.
  - Soft delete via `isDeleted` flag.
### Batches
- Routes: `/api/batches`.
- Write operations require active subscription; reads allowed.
- Fields:
  - `batchName`, `classLevel`, `medium`, `session`, `scheduleTime`, `days`, `centerId`, `userId`.
- Services provide:
  - Batch list filtered by center and optional filters.
  - Student counts per batch using aggregation.
### Attendance
- Routes: `/api/attendance`.
- `POST` requires active subscription.
- Payload:
  - Either:
    - `date`, `batchId`, `records: [{ studentId, status }]`, or
    - `date`, `studentId`, `status`.
  - `status ∈ {"present","absent","leave"}`.
- Model:
  - Unique `(studentId, date)`.
  - Indexes for center/batch/date queries.
- Read endpoints:
  - Get attendance for batch/date, history, summaries, low-attendance lists.
### Fees
- Routes: `/api/fees` (all require active subscription).
- Endpoints:
  - List fees for a month/year.
  - List pending fees.
  - Mark fee as paid.
  - Update fee status (`Paid`, `Pending`, `Overdue`).
- Model:
  - `studentId`, `batchId`, `centerId`, `userId`, `month`, `year`, `amount`, `status`, `paymentMethod`, `paidDate`, `editHistory`.
- Validations:
  - Month 1–12, year reasonable range.
  - ObjectId checks, allowed statuses, and payment methods.
### Teacher Payments (Salaries)
- Routes: `/api/teacher-payments`.
- `GET` and `POST` require active subscription.
- Unique constraint:
  - `{ teacherId, month, year }` → prevents duplicate salary for same month.
- Behavior:
  - On duplicate insert, returns user-friendly message equivalent to:
    ```json
    {
      "success": false,
      "message": "Salary already recorded for this teacher for the selected month."
    }
    ```
  - Responses include basic teacher info for display.
---
## 6. Error Handling & Response Format
### Helpers
- `throwError(message: string, statusCode?: number)`:
  - Used throughout services/validators to raise API errors.
- `sendResponse(res, status, message, success, data?)`:
  - Standard response shape:
    ```json
    {
      "success": true,
      "message": "Message text",
      "data": { ... }
    }
    ```
- `handleControllerError(res, error, defaultStatus?)`:
  - Catches thrown errors in controllers.
  - Logs error internally.
  - Returns a safe JSON error:
    ```json
    {
      "success": false,
      "message": "Human-readable error message"
    }
    ```
### Frontend Rule
- The frontend uses the `message` from the backend **directly** in toasts and alerts.
- Example:
  - Backend: `{"success": false, "message": "Batch not found"}`
  - Frontend toast: `"Batch not found"`
---
## 7. Frontend Overview
### Stack
- Next.js (App Router) + React + TypeScript.
- React Query for data fetching.
- Custom components: Dashboard layout, sidebar, navbar, charts, modals, tables, etc.
### Layout & Context
- `DashboardLayout` (in `(platform)/layout.tsx`):
  - On mount:
    - Calls `GET /api/centers/my-center` to hydrate `SubscriptionContext`.
    - Calls `/api/auth/me` to get user role (`center_owner` or `teacher`).
  - Renders:
    - Sidebar (role-based links).
    - Navbar.
    - Optional subscription banners.
    - Page content with transitions.
- `SubscriptionContext`:
  - Values:
    - `subscriptionStatus`, `subscriptionStartDate`, `subscriptionEndDate`, `planType`, `blocked`, `blockedReason`, `loading`.
  - Derived booleans:
    - `isActive`, `isPending`, `isBlocked`.
### Subscription Warnings
- If `subscriptionStatus === "pending_payment"`:
  - Show banner: `"Your subscription payment is pending. System features are temporarily disabled."`
- If `subscriptionStatus === "active"` and `subscriptionEndDate` within 5 days:
  - Show banner: `"Your subscription will expire in X days."`
- If center blocked:
  - Redirect to `/blocked` page that shows:
    - `"Account Blocked"` and the `blockedReason`.
### Main Feature Pages
- `(platform)/dashboard` – KPIs, charts, recent attendance and payments, upcoming classes.
- `(platform)/students` – list and manage students.
- `(platform)/batches` – list and manage batches.
- `(platform)/attendance` – attendance UI and history.
- `(platform)/teachers` – manage teachers.
- `(platform)/teacher-payments` – salary tracking.
- `(platform)/fees` – fee dashboards.
- `(platform)/reports`, `(platform)/settings` – analytics and preferences.
- `/admin` subtree – admin login, dashboard, centers list/detail.
---
## 8. Running the Project
### Backend
```bash
cd server
npm install
# Set environment variables:
# - MONGODB_URI
# - JWT_SECRET / JWT_REFRESH_SECRET
# - REDIS connection
# - MAIL/SMTP settings
# - GOOGLE_CLIENT_ID, etc.
npm run dev   # development
# or
npm run build && npm start  # production
Frontend
cd client
npm install
# Set NEXT_PUBLIC API base URL, etc.
npm run dev   # development
9. Summary
Attendly delivers:

Secure authentication (JWT, rate limiting, strong passwords).
Strict multi-tenant isolation via centerId and role-based middleware.
Subscription-aware behavior:
Pending payment → limited access.
Blocked → access denied.
Expired → full read-only mode.
Operational features for:
Center management.
Teacher management (accounts, subjects, salaries).
Student management.
Batches & scheduling.
Attendance tracking.
Fee collection and status tracking.
Production-grade robustness:
Centralized validation and error handling.
Background subscription expiry job.
Carefully chosen indexes for performance and correctness.