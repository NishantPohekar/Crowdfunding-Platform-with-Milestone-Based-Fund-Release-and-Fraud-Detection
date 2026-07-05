# TrustFund Project Guide

This document explains the TrustFund project from scratch. It is written as a teaching guide, so a reader can understand the idea, architecture, backend, frontend, database, security, user roles, email flow, campaign lifecycle, escrow flow, fraud monitoring, and where each important piece of code is written.

After reading this guide, a developer should be able to:

```text
run the project locally
explain the complete project flow
understand every major backend and frontend folder
know where each feature is implemented
debug common issues
edit features safely
deploy the project
avoid leaking secrets
```

## Table Of Contents

```text
1. Project Summary
2. Core Idea And Problem Statement
3. User Roles
4. Full System Architecture
5. Technology Stack And Versions
6. Local Configuration And Secrets
7. How To Run Locally
8. Database And Flyway
9. Backend Structure
10. Backend File Map
11. Backend Annotations
12. Backend APIs
13. Security And Role-Based Access
14. Main Admin Logic
15. Frontend Structure
16. Frontend File Map
17. Frontend Routing And Role Dashboards
18. Styling And UI System
19. Complete Business Flows
20. Campaign Lifecycle
21. Donation And Escrow
22. Milestones And Proof
23. Grievances
24. Notifications And Emails
25. Fraud Monitoring
26. Dashboard Charts
27. Search, Filter, Sort, Pagination
28. Profile Editing
29. Admin User Management
30. Testing Checklist
31. Debugging Guide
32. IntelliJ IDEA Setup
33. Git And Secret Safety
34. Render Deployment
35. Where To Edit What
36. Simple Explanation For Viva/Presentation
```

## 1. Project Summary

TrustFund is a milestone-based crowdfunding platform.

The normal crowdfunding problem is that donors give money, but they may not know whether creators will use funds properly. TrustFund solves this with:

```text
admin-approved campaigns
official campaign verification document
milestone-based fund release
escrow wallet
proof submission
admin proof verification
fraud/risk monitoring
grievance system
notifications and email alerts
role-based dashboards
```

The main idea:

```text
Donor money does not go directly to the campaign creator.
Money is locked in escrow.
Creator receives money only after milestone proof is submitted, verified, and released by admin.
```

## 2. Core Idea And Problem Statement

### Problem

Traditional crowdfunding has trust issues:

```text
campaigns may be fake
donors cannot verify progress
funds may be misused
there may be no structured complaint/grievance process
admins may not have enough risk visibility
```

### TrustFund Solution

TrustFund adds control points:

```text
creator submits campaign with official verification document
admin approves/rejects before campaign becomes public
donors can donate only to approved active campaigns
donation is locked in escrow
creator submits milestone proof
admin verifies proof
admin releases milestone amount
fraud monitor highlights medium/high risk campaigns
users can raise grievances for campaigns
notifications and emails keep users informed
```

## 3. User Roles

The project has three main roles.

### Admin

Admin manages the platform:

```text
approve/reject campaigns
pause/restart campaigns
verify milestone proof
release funds
monitor fraud alerts
resolve grievances
manage users
view dashboard analytics
```

### Main Admin

Main admin is a special admin:

```text
email: configured with MAIN_ADMIN_EMAIL
```

Main admin can:

```text
create another admin
deactivate another admin
reactivate another admin
delete another admin if backend rules allow
edit own main admin profile
```

Main admin cannot:

```text
deactivate itself
delete itself
be edited by another admin
```

Normal admins cannot manage admin accounts.

### Creator

Creator can:

```text
create campaign
add milestones
view own campaigns
delete own pending/rejected campaign
submit milestone proof
track released funds
receive campaign/donation/milestone notifications
```

Creator cannot:

```text
approve own campaign
release funds
submit proof for another creator's campaign
view another creator's private campaign management data
```

### Donor

Donor can:

```text
view approved active campaigns
donate to active campaigns
track own donations
receive donation and fund release notifications
raise grievances
```

Donor cannot:

```text
donate to pending/rejected/paused campaigns
release funds to creator
view another donor's donation history
```

## 4. Full System Architecture

High-level architecture:

```text
React Frontend
  |
  | Axios HTTP requests with JWT token
  v
Spring Boot REST API
  |
  | Controllers call Services
  v
Business Services
  |
  | Repositories use JPA
  v
PostgreSQL Database
```

Supporting systems:

```text
Flyway creates/updates database schema.
JWT handles authentication.
Spring Security protects APIs.
Gmail SMTP sends emails.
Local PostgreSQL stores application data.
Recharts renders charts.
Bootstrap provides base frontend styling.
Custom CSS gives glassmorphism/neumorphism UI.
```

Request flow example:

```text
User clicks Approve Campaign
-> React button calls campaignService.approve()
-> Axios sends PUT /api/campaigns/{id}/approve
-> JWT token is attached
-> Spring Security checks user is ADMIN
-> CampaignController receives request
-> CampaignService.approve() applies business rules
-> CampaignRepository saves status ACTIVE
-> NotificationService notifies creator and donors
-> EmailService sends emails
-> Response goes back to frontend
-> UI refreshes
```

Generic flow for any feature:

```text
User action in React UI
-> frontend page/component handles click or form submit
-> frontend service file sends Axios request
-> backend controller receives request
-> Spring Security checks JWT and role
-> backend service applies business rules
-> repository reads/writes database
-> backend returns DTO response
-> frontend updates state or reloads data
-> UI shows updated result
-> notification/email may be sent if the feature requires it
```

This pattern is useful for explaining any feature in viva or project review.

## 5. Technology Stack And Versions

### Backend

| Technology | Version/Source | Purpose |
|---|---:|---|
| Java | 21 | Backend programming language |
| Spring Boot | 3.5.0 | Backend framework |
| Spring Web | Spring Boot 3.5.0 | REST APIs |
| Spring Security | Spring Boot 3.5.0 | Authentication/authorization |
| Spring Data JPA | Spring Boot 3.5.0 | Database access |
| Hibernate | via Spring Boot | ORM |
| PostgreSQL Driver | 42.7.5 | PostgreSQL JDBC driver |
| Flyway | 11.7.2 | Database migrations |
| Spring Mail | Spring Boot 3.5.0 | SMTP email |
| Lombok | 1.18.38 | Reduces Java boilerplate |
| JJWT | 0.12.6 | JWT creation/validation |
| Springdoc OpenAPI | 2.8.6 | Swagger UI |
| Spring DevTools | 3.5.0 | Local auto-restart |

### Frontend

| Technology | Version/Source | Purpose |
|---|---:|---|
| React | 18.3.1 | UI library |
| Vite | 6.4.3 | Frontend build/dev server |
| Bootstrap | 5.3.x | Base CSS framework |
| Axios | 1.10.x | HTTP requests |
| React Router DOM | 7.x | Routing |
| Recharts | 2.15.x | Charts |
| React Icons | 5.x | Icons |
| Framer Motion | 12.x | Transitions |

### Database

```text
PostgreSQL 16
```

## 6. Local Configuration And Secrets

### Important Rule

Never commit real secrets.

These files are local only:

```text
backend/.env
frontend/.env
```

These can be committed:

```text
backend/.env.example
README.md
application.properties
```

But they must contain placeholder values only.

### Backend Environment Variables

Local backend `.env` should contain:

```text
SERVER_PORT=8080
FRONTEND_URL=http://localhost:5173

DB_URL=jdbc:postgresql://localhost:5432/trustfund
DB_USERNAME=trustfund
DB_PASSWORD=trustfund

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-project-email@example.com
SMTP_PASSWORD=your-16-character-app-password-without-spaces
MAIL_SENDER_NAME=TrustFund
MAIL_ENABLED=true

JWT_SECRET=change-this-to-a-long-secret
```

### Frontend Environment Variables

Local frontend `.env`:

```text
VITE_API_BASE_URL=http://localhost:8080/api
```

### How Backend Loads `.env`

File:

```text
backend/src/main/java/com/trustfund/TrustfundBackendApplication.java
```

Method:

```text
loadDotenv()
```

Meaning:

```text
Backend reads .env from the current working directory.
If IntelliJ starts backend from backend folder, then backend/.env is loaded.
Values are copied into Java System properties before Spring starts.
```

## 7. How To Run Locally

### Start PostgreSQL

Use a locally installed PostgreSQL server and create the project database once:

```bash
psql -U postgres
```

```sql
CREATE DATABASE trustfund;
CREATE USER trustfund WITH PASSWORD 'trustfund';
GRANT ALL PRIVILEGES ON DATABASE trustfund TO trustfund;
\c trustfund
GRANT ALL ON SCHEMA public TO trustfund;
```

Database:

```text
host: localhost
port: 5432
database: trustfund
username: trustfund
password: trustfund
```

### Run Backend From IntelliJ IDEA

1. Open IntelliJ IDEA.
2. Open project folder.
3. Open `backend/src/main/java/com/trustfund/TrustfundBackendApplication.java`.
4. Click the green run button.
5. Make sure working directory is `backend`.
6. Backend should start on:

```text
http://localhost:8080
```

Swagger:

```text
http://localhost:8080/swagger-ui.html
```

### Run Frontend

From project root:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

## 8. Database And Flyway

Flyway is the database migration tool.

It reads SQL files from:

```text
backend/src/main/resources/db/migration/
```

Current migration files:

```text
V1__init.sql
V2__campaign_image_url.sql
V3__user_active.sql
V4__campaign_verification_documents.sql
V5__action_reasons.sql
```

Flyway rule:

```text
Never edit an already-applied migration in a real shared database.
Create a new V6__something.sql file for new schema changes.
```

Important tables:

```text
users
campaigns
milestones
donations
escrow_wallets
fund_releases
complaints
fraud_alerts
notifications
refresh_tokens
audit_logs
```

Important relationships:

```text
users -> campaigns       one creator has many campaigns
campaigns -> milestones  one campaign has many milestones
campaigns -> donations   one campaign has many donations
campaigns -> escrow      one campaign has one escrow wallet
milestones -> releases   one milestone can have fund release record
users -> notifications   each notification belongs to one user
```

View database in terminal:

```bash
psql -h localhost -p 5432 -U trustfund -d trustfund
```

Inside psql:

```sql
\dt
SELECT * FROM users;
SELECT * FROM campaigns;
```

## 9. Backend Structure

Backend follows a normal layered Spring Boot structure:

```text
controller -> service -> repository -> database
```

Folder structure:

```text
backend/src/main/java/com/trustfund/
  config/
  controller/
  exception/
  model/
    dto/
    entity/
    enums/
  repository/
  security/
  service/
```

Layer meaning:

```text
controller:
  receives HTTP requests and returns responses

service:
  contains business logic and rules

repository:
  database access using Spring Data JPA

entity:
  database table mapping

dto:
  request/response objects

enums:
  fixed status/role values

security:
  JWT, current user, authentication

config:
  Spring config, security config, Swagger, default admin seeding
```

## 10. Backend File Map

### Root

| File | Purpose |
|---|---|
| `TrustfundBackendApplication.java` | Main Spring Boot entry point and `.env` loader |

### Config

| File | Purpose |
|---|---|
| `AdminSeeder.java` | Creates/updates permanent main admin |
| `JwtProperties.java` | JWT config properties |
| `OpenApiConfig.java` | Swagger/OpenAPI config |
| `SecurityConfig.java` | CORS, JWT filter, role protection, authentication |

### Controllers

| File | Purpose |
|---|---|
| `AuthController.java` | Register, login, refresh, forgot/reset password, profile |
| `CampaignController.java` | Campaign create/list/detail/approve/reject/pause/restart/delete |
| `DonationController.java` | Donation create and donation history |
| `MilestoneController.java` | Proof upload, verify, redo verification, release |
| `ComplaintController.java` | Grievance create/list/resolve |
| `NotificationController.java` | Notifications, mark read, mark all read |
| `FraudController.java` | Risk alerts |
| `DashboardController.java` | Dashboard stats and charts |
| `AdminUserController.java` | Admin user management |

### Services

| File | Purpose |
|---|---|
| `AuthService.java` | Login/register/tokens/password/profile |
| `CampaignService.java` | Campaign lifecycle and campaign rules |
| `DonationService.java` | Donation and escrow credit |
| `MilestoneService.java` | Proof, verify, redo, release |
| `EscrowService.java` | Wallet credit/release math |
| `FraudService.java` | Risk scoring and fraud alerts |
| `ComplaintService.java` | Grievance business logic |
| `NotificationService.java` | In-app notifications and email trigger |
| `EmailService.java` | SMTP send logic |
| `PaymentService.java` | Mock local payment result |
| `AuditService.java` | Admin/system audit logs |

### Security

| File | Purpose |
|---|---|
| `JwtService.java` | Create and validate access/refresh/reset tokens |
| `JwtAuthFilter.java` | Reads Bearer token from request |
| `CustomUserDetailsService.java` | Loads active user by email |
| `UserPrincipal.java` | Spring Security user wrapper |
| `SecurityUtils.java` | Gets current logged-in user/id |

### Entities

| Entity | Table | Meaning |
|---|---|---|
| `User` | `users` | platform account |
| `Campaign` | `campaigns` | crowdfunding campaign |
| `Milestone` | `milestones` | campaign stage |
| `Donation` | `donations` | donor payment |
| `EscrowWallet` | `escrow_wallets` | locked/released campaign money |
| `FundRelease` | `fund_releases` | milestone release record |
| `Complaint` | `complaints` | grievance |
| `FraudAlert` | `fraud_alerts` | risk record |
| `Notification` | `notifications` | in-app notification |
| `RefreshToken` | `refresh_tokens` | refresh token record |
| `AuditLog` | `audit_logs` | admin/system action record |

### Enums

```text
Role:
  ADMIN, CREATOR, DONOR

CampaignStatus:
  PENDING, ACTIVE, DONE, REJECTED, PAUSED

MilestoneStatus:
  PENDING, PROOF_SUBMITTED, VERIFIED, RELEASED

PaymentStatus:
  PENDING, SUCCESS, FAILED

ComplaintStatus:
  OPEN, RESOLVED

RiskLevel:
  LOW, MEDIUM, HIGH

NotificationStatus:
  UNREAD, READ

FundReleaseStatus:
  RELEASED
```

## 11. Backend Annotations

Common annotations:

```text
@SpringBootApplication:
  marks main Spring Boot app

@RestController:
  class handles REST API endpoints

@RequestMapping:
  base URL for controller

@GetMapping/@PostMapping/@PutMapping/@DeleteMapping:
  HTTP endpoint mapping

@Service:
  business logic class

@Repository:
  database layer, usually inherited through JpaRepository

@Entity:
  maps class to database table

@Table:
  table name

@Id:
  primary key

@GeneratedValue:
  generated id

@ManyToOne/@OneToMany:
  entity relationships

@Transactional:
  runs method inside database transaction

@PreAuthorize:
  role-based method protection

@Valid:
  validates DTO input

@NotBlank/@Email/@Size/@Positive:
  validation rules

@CreationTimestamp:
  auto-created timestamp

@Async:
  runs email sending asynchronously

@RequiredArgsConstructor:
  Lombok constructor injection

@Builder/@Getter/@Setter:
  Lombok boilerplate helpers
```

## 12. Backend APIs

### Auth

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/me
PUT  /api/auth/profile
```

### Campaigns

```text
GET    /api/campaigns
GET    /api/campaigns/{id}
GET    /api/campaigns/my
POST   /api/campaigns
PUT    /api/campaigns/{id}/approve
PUT    /api/campaigns/{id}/reject
PUT    /api/campaigns/{id}/archive
PUT    /api/campaigns/{id}/restart
DELETE /api/campaigns/{id}
```

Note:

```text
The backend method still says archive for pause, but UI uses Pause.
```

### Donations

```text
POST /api/donations
GET  /api/donations/my
```

### Milestones

```text
POST /api/milestones/{id}/proof
PUT  /api/milestones/{id}/verify
PUT  /api/milestones/{id}/undo-verify
PUT  /api/milestones/{id}/release
```

### Grievances

```text
POST /api/complaints
GET  /api/complaints
GET  /api/complaints/my
PUT  /api/complaints/{id}/resolve
```

Frontend text says Grievance, but some backend files still use Complaint naming.

### Notifications

```text
GET /api/notifications
PUT /api/notifications/{id}/read
PUT /api/notifications/read-all
```

### Dashboards

```text
GET /api/dashboard/public
GET /api/dashboard/admin
GET /api/dashboard/donor
GET /api/dashboard/escrow
```

### Fraud

```text
GET /api/fraud/alerts
```

### Admin Users

```text
GET    /api/admin/users
POST   /api/admin/users
PUT    /api/admin/users/{id}/deactivate
PUT    /api/admin/users/{id}/activate
PUT    /api/admin/users/{id}/profile
DELETE /api/admin/users/{id}
```

## 13. Security And Role-Based Access

TrustFund uses JWT-based authentication.

### Login Flow

```text
User enters email/password
-> LoginPage.jsx calls AuthContext.login()
-> authService.login()
-> POST /api/auth/login
-> AuthController.login()
-> AuthService.login()
-> Spring AuthenticationManager checks password
-> JwtService creates access token and refresh token
-> frontend stores user/session
-> route redirects user to role dashboard
```

### Frontend Protection

Frontend files:

```text
frontend/src/routes/AppRoutes.jsx
frontend/src/layouts/DashboardLayout.jsx
```

Frontend hides pages/buttons according to role:

```text
Admin sees Admin Dashboard, Users, Risk Monitor.
Creator sees Creator Studio, My Campaigns, Milestones.
Donor sees Donor Hub, My Donations.
```

Frontend protection improves UI experience, but it is not enough for security.

### Backend Protection

Backend uses:

```text
@PreAuthorize("hasRole('ADMIN')")
@PreAuthorize("hasRole('CREATOR')")
@PreAuthorize("hasRole('DONOR')")
```

Backend also checks ownership:

```text
creator can manage only own campaign
donor can view only own donation history
user can mark only own notification as read
main admin rules are enforced in backend
```

This is what actually protects the project.

## 14. Main Admin Logic

Main admin email:

```text
MAIN_ADMIN_EMAIL from backend environment variables
```

Written in:

```text
backend/src/main/resources/application.properties
backend/src/main/java/com/trustfund/config/AdminSeeder.java
backend/src/main/java/com/trustfund/controller/AdminUserController.java
backend/src/main/java/com/trustfund/controller/DashboardController.java
```

### Seeding

`AdminSeeder` creates or updates the main admin on backend startup.

Meaning:

```text
main admin always exists
main admin password is reset to configured/default value on startup
legacy admin email can be cleaned up
```

### Enforcement

`AdminUserController.requireMainAdmin()` checks current user's email.

Rules:

```text
only main admin can create admin
only main admin can deactivate/reactivate/delete another admin
main admin cannot deactivate/delete itself
normal admins cannot manage admin accounts
```

## 15. Frontend Structure

Frontend folder structure:

```text
frontend/src/
  components/
    charts/
    common/
    domain/
  contexts/
  layouts/
  pages/
  routes/
  services/
  styles/
  utils/
```

Meaning:

```text
components/common:
  reusable UI like modals, tables, pagination, cards

components/domain:
  project-specific cards like campaign, milestone, donation

contexts:
  global auth and toast state

layouts:
  public layout and dashboard layout/sidebar

pages:
  full route screens

routes:
  route declarations and role protection

services:
  Axios API functions

styles:
  theme.css for project design

utils:
  helper functions
```

## 16. Frontend File Map

### Root

| File | Purpose |
|---|---|
| `main.jsx` | Imports React, Bootstrap, theme CSS |
| `App.jsx` | App wrapper |
| `vite.config.js` | Vite config |
| `index.html` | HTML shell |

### Pages

| Page | Purpose |
|---|---|
| `LoginPage.jsx` | Login |
| `RegisterPage.jsx` | User registration |
| `ForgotPasswordPage.jsx` | Request reset link |
| `ResetPasswordPage.jsx` | Set new password |
| `AdminDashboard.jsx` | Admin analytics and campaign queue |
| `CreatorDashboard.jsx` | Creator studio, my campaigns, proof uploads, create campaign |
| `DonorDashboard.jsx` | Donor stats, donations, notifications |
| `CampaignListingPage.jsx` | Public/auth campaign browsing |
| `CampaignDetailsPage.jsx` | Campaign details, donate, admin actions, milestones, proof |
| `MyCampaignsPage.jsx` | Creator campaign list |
| `MyDonationsPage.jsx` | Donor donation list |
| `MilestonesPage.jsx` | Admin/creator milestone management |
| `EscrowWalletPage.jsx` | Escrow dashboard |
| `FraudMonitoringPage.jsx` | Risk monitor |
| `ComplaintsPage.jsx` | Grievances |
| `NotificationsPage.jsx` | Notifications |
| `ProfilePage.jsx` | Profile edit |
| `AdminUsersPage.jsx` | User/admin management |

### Services

```text
authService.js
campaignService.js
donationService.js
milestoneService.js
complaintService.js
notificationService.js
dashboardService.js
adminService.js
api.js
```

`api.js` creates Axios instance, attaches JWT token, and handles API errors.

## 17. Frontend Routing And Role Dashboards

Routes file:

```text
frontend/src/routes/AppRoutes.jsx
```

Dashboard layout:

```text
frontend/src/layouts/DashboardLayout.jsx
```

Role routing:

```text
ADMIN -> /app/admin
CREATOR -> /app/creator
DONOR -> /app/donor
```

Sidebar is generated according to logged-in role.

## 18. Styling And UI System

Bootstrap is imported in:

```text
frontend/src/main.jsx
```

Main custom CSS:

```text
frontend/src/styles/theme.css
```

Design style:

```text
glassmorphism
neumorphism
soft shadows
high contrast tags/buttons
rounded buttons
dark glass cards
cyan/teal accents
readable hover states
responsive layouts
```

UI elements styled:

```text
sidebar
topbar
cards
buttons
tables
forms
modals
reason dialogs
status chips
role badges
search bars
pagination
charts
auth pages
campaign cards
milestone cards
notification cards
```

If UI color or button visibility is wrong, edit:

```text
frontend/src/styles/theme.css
```

## 19. Complete Business Flows

This section explains the project like a story.

### Registration

```text
User opens register page.
User chooses CREATOR or DONOR.
Frontend sends registration request.
Backend blocks ADMIN registration from public API.
Backend saves BCrypt password.
Welcome email is sent.
User receives JWT and enters dashboard.
```

Admin accounts are created only by main admin.

### Login

```text
User enters email/password.
Backend checks password.
Backend checks user is active.
Backend returns JWT and user role.
Frontend stores session.
User is redirected to role dashboard.
```

If user is deactivated:

```text
login is blocked
message says user is deactivated
```

### Forgot Password

```text
User enters email.
Backend creates password-reset JWT if email exists.
Backend emails reset link.
User opens reset link.
User enters new password.
Backend validates token and saves new BCrypt password.
```

## 20. Campaign Lifecycle

Campaign statuses:

```text
PENDING -> submitted, waiting for admin
ACTIVE -> approved and visible to donors
REJECTED -> rejected by admin
PAUSED -> temporarily stopped by admin or high risk
DONE -> all milestones released
```

### Campaign Creation

Creator enters:

```text
title
target amount
image URL
official verification document cloud link
description
verification notes
milestones
milestone amounts
milestone due dates
expected proof details
```

Validation:

```text
milestone dates cannot be in the past
milestone amounts must be valid
total milestone amount cannot exceed campaign target
```

After creation:

```text
campaign status = PENDING
milestone status = PENDING
creator gets notification/email
admins get notification/email
```

### Approval

Who:

```text
ADMIN
```

Allowed from:

```text
PENDING
REJECTED
```

Admin checks:

```text
campaign description
campaign image
target amount
verification document
verification notes
milestone plan
fraud/risk context if available
```

After approval:

```text
status = ACTIVE
rejection reason cleared
pause reason cleared
escrow wallet ensured
creator notified/emailed
donors notified/emailed that new campaign is live
```

### Rejection

Allowed from:

```text
PENDING
ACTIVE
PAUSED
```

But:

```text
If ACTIVE or PAUSED campaign has donations, backend blocks rejection.
Admin should pause instead.
```

Reason:

```text
Donation and escrow history should not be rewritten.
```

After rejection:

```text
status = REJECTED
rejection reason stored
pause reason cleared
creator notified/emailed with reason
```

### Pause

Backend method name:

```text
archive()
```

UI word:

```text
Pause
```

Allowed from:

```text
ACTIVE
```

After pause:

```text
status = PAUSED
pause reason stored
creator notified/emailed with reason
users can see pause reason in card/details
```

### Restart

Allowed from:

```text
PAUSED
```

After restart:

```text
status = ACTIVE
pause reason cleared
escrow wallet ensured
creator notified/emailed
```

### Delete

Creator can delete:

```text
own PENDING campaign
own REJECTED campaign
```

Admin can delete:

```text
eligible campaign without donation history
```

Cannot delete:

```text
campaign with donation history
ACTIVE campaign
DONE campaign
```

### Where Reasons Are Stored

TrustFund stores action reasons in the database, not only in frontend state. This is important because reasons remain visible after refresh, logout, and login.

Campaign reason columns:

```text
table: campaigns
columns:
  rejection_reason
  pause_reason
```

Campaign entity:

```text
backend/src/main/java/com/trustfund/model/entity/Campaign.java
```

Entity fields:

```text
rejectionReason
pauseReason
```

Where campaign reasons are saved:

```text
CampaignService.reject()
  stores rejectionReason
  clears pauseReason

CampaignService.archive()
  this is the pause method
  stores pauseReason

CampaignService.restart()
  clears pauseReason

CampaignService.approve()
  clears rejectionReason and pauseReason
```

User deactivation reason column:

```text
table: users
column:
  deactivation_reason
```

User entity:

```text
backend/src/main/java/com/trustfund/model/entity/User.java
```

Entity field:

```text
deactivationReason
```

Where user deactivation reason is saved:

```text
AdminUserController.deactivate()
  stores deactivationReason

AdminUserController.activate()
  clears deactivationReason
```

Where reasons are shown in frontend:

```text
CampaignCard.jsx
  campaign card reason dropdown

CampaignDetailsPage.jsx
  campaign detail reason display

AdminDashboard.jsx
  admin campaign queue reason display

AdminUsersPage.jsx
  user active/inactive reason dropdown
```

Viva answer:

```text
Campaign rejection and pause reasons are stored in campaigns.rejection_reason and campaigns.pause_reason. User deactivation reason is stored in users.deactivation_reason. Backend services save these values, and frontend cards/details read them from API responses, so reasons persist after page refresh.
```

### Example Full Flow: Pause Campaign

```text
Admin clicks Pause Campaign in AdminDashboard or CampaignDetailsPage.
Frontend opens ReasonDialog.
Admin enters pause reason.
Frontend calls campaignService.archive()/pause API.
Axios sends PUT /api/campaigns/{id}/archive with reason payload.
JwtAuthFilter reads Bearer token.
Spring Security checks user has ADMIN role.
CampaignController receives the request.
CampaignService.archive() runs business rules.
Service checks campaign status is ACTIVE.
Service sets campaign.status = PAUSED.
Service sets campaign.pauseReason = reason.
CampaignRepository saves campaign.
NotificationService.notifyUser() notifies creator.
EmailService sends TrustFund notification email.
Backend returns CampaignResponse.
Frontend reloads campaign queue/details.
UI shows PAUSED tag and pause reason dropdown/card/detail.
```

### Example Full Flow: Deactivate User

```text
Admin clicks Deactivate in AdminUsersPage.
Frontend opens ReasonDialog.
Admin enters deactivation reason.
Frontend calls adminService.deactivateUser(id, reason).
Axios sends PUT /api/admin/users/{id}/deactivate.
JwtAuthFilter reads Bearer token.
Spring Security checks user has ADMIN role.
AdminUserController receives request.
Controller checks admin rules.
If target is admin, requireMainAdmin() verifies current admin is main admin.
Controller blocks self-deactivation.
Controller blocks deactivation of main admin.
Controller sets user.active = false.
Controller sets user.deactivationReason = reason.
UserRepository saves user.
NotificationService.notifyUser() notifies deactivated user.
EmailService sends TrustFund notification email.
Backend returns user response.
Frontend reloads users list.
UI shows Inactive tag and reason dropdown.
If user tries login later, backend blocks login because account is inactive.
```

## 21. Donation And Escrow

Donation is allowed only for:

```text
ACTIVE campaign
```

Flow:

```text
Donor enters amount.
Donation is created as PENDING.
Mock payment succeeds locally.
Donation becomes SUCCESS.
Campaign raised amount increases.
Escrow wallet balance/locked amount increases.
Creator gets notification/email.
Donor gets notification/email.
Admins get notification/email.
FraudService evaluates campaign.
```

Important:

```text
Creator does not receive money immediately.
Money remains locked until milestone release.
```

Escrow tables:

```text
escrow_wallets
fund_releases
donations
milestones
```

## 22. Milestones And Proof

Milestone statuses:

```text
PENDING
PROOF_SUBMITTED
VERIFIED
RELEASED
```

### Milestone Creation

Milestones are created during campaign creation.

Each milestone has:

```text
title
description
amount
due date
sequence/order
status
```

### Submit Proof

Who:

```text
creator who owns the campaign
```

Allowed when:

```text
milestone status = PENDING
```

Flow:

```text
Creator opens Milestones or Campaign Details.
Creator clicks Submit Proof.
If from Milestones page, frontend opens Campaign Details and scrolls to proof section.
Creator enters proof URL and notes.
Backend checks creator ownership.
Backend checks milestone is PENDING.
Backend saves proofUrl, proofNotes, proofSubmittedAt.
Status becomes PROOF_SUBMITTED.
Creator gets notification/email.
Admins get notification/email.
```

### Verify Proof

Who:

```text
ADMIN
```

Allowed when:

```text
milestone status = PROOF_SUBMITTED
```

Flow:

```text
Admin views proof.
Admin clicks Verify Proof.
Status becomes VERIFIED.
Creator gets notification/email.
No money is released yet.
```

### Redo Verification

Purpose:

```text
Admin verified by mistake and wants to reopen review.
```

Allowed when:

```text
milestone status = VERIFIED
```

After redo:

```text
status = PROOF_SUBMITTED
creator notified/emailed
admin can verify again later
```

Not allowed:

```text
RELEASED milestone cannot be reopened.
```

### Release Funds

Who:

```text
ADMIN
```

Allowed when:

```text
milestone status = VERIFIED
campaign status = ACTIVE or PAUSED
```

Flow:

```text
Admin clicks release.
EscrowService releases milestone amount.
FundRelease record is created.
Milestone status becomes RELEASED.
Creator gets notification/email.
Donors of campaign get notification/email.
If all milestones are released, campaign becomes DONE.
```

## 23. Grievances

Frontend says:

```text
Grievance
```

Some backend code still says:

```text
Complaint
```

This is naming only. It is the same feature.

Flow:

```text
User opens Grievance page.
User searches/selects campaign.
Campaign search field clears after selection.
User enters description.
Backend creates OPEN grievance.
Admins get notification/email.
Campaign creator gets notification/email.
Grievance creator gets confirmation notification/email.
FraudService evaluates campaign.
```

Resolve:

```text
Admin clicks resolve.
Status becomes RESOLVED.
Grievance creator notified/emailed.
Campaign creator notified/emailed if different user.
```

Default:

```text
Grievance page opens with OPEN filter.
```

## 24. Notifications And Emails

### In-App Notifications

File:

```text
backend/src/main/java/com/trustfund/service/NotificationService.java
```

Rule:

```text
notifyUser() saves notification and sends email.
notifyRole() sends notification/email to all active users with a role.
```

Frontend:

```text
frontend/src/pages/NotificationsPage.jsx
frontend/src/components/domain/NotificationCard.jsx
```

Notification page:

```text
defaults to UNREAD
can mark one read
can mark all read
read notifications disappear from unread view
supports filter/sort/pagination
```

### Email Templates

There are three email template types.

#### 1. Welcome Email

File:

```text
backend/src/main/java/com/trustfund/service/EmailService.java
```

Method:

```text
sendWelcomeEmail(User user)
```

Subject:

```text
TrustFund - Welcome to TrustFund
```

When sent:

```text
creator registration
donor registration
admin created by main admin
```

#### 2. Forgot Password Email

File:

```text
backend/src/main/java/com/trustfund/service/AuthService.java
```

Method:

```text
forgotPassword(String email)
```

Subject:

```text
TrustFund - Reset your TrustFund password
```

When sent:

```text
user requests password reset with existing email
```

#### 3. Notification Email

File:

```text
backend/src/main/java/com/trustfund/service/NotificationService.java
```

Subject:

```text
TrustFund - TrustFund notification
```

When notification email is sent:

```text
campaign submitted
campaign approved
campaign rejected
campaign paused
campaign restarted
campaign deleted by admin
successful donation
grievance submitted
grievance resolved
milestone proof submitted
milestone verified
milestone verification reopened
milestone funds released
high fraud risk auto-pause
user deactivated
user reactivated
admin edits another user profile
```

Email logs:

```text
[EMAIL_SENT]
[EMAIL_SKIPPED]
[EMAIL_FAILED]
```

If email fails with authentication:

```text
check Gmail app password
check SMTP_USERNAME is the same Gmail account
store app password without spaces
restart backend
```

## 25. Fraud Monitoring

Files:

```text
backend/src/main/java/com/trustfund/service/FraudService.java
backend/src/main/java/com/trustfund/controller/FraudController.java
frontend/src/pages/FraudMonitoringPage.jsx
frontend/src/components/domain/FraudAlertCard.jsx
```

When fraud is evaluated:

```text
after successful donation
after grievance creation
```

Risk levels:

```text
LOW
MEDIUM
HIGH
```

Frontend risk monitor shows:

```text
MEDIUM
HIGH
```

LOW risk is not shown because it is routine.

High risk behavior:

```text
if campaign is ACTIVE, it can be auto-paused
creator receives notification/email
admin can review risk monitor
```

## 26. Dashboard Charts

Frontend chart file:

```text
frontend/src/components/charts/AnalyticsCharts.jsx
```

Backend chart data:

```text
backend/src/main/java/com/trustfund/controller/DashboardController.java
```

Charts:

```text
Donation trend:
  successful donation amount grouped by month

Campaign growth:
  campaigns created per month

Risk analysis:
  medium/high risk counts

Campaign status distribution:
  Pending, Active, Done, Paused, Rejected
```

Hover:

```text
custom ChartTooltip
money shown as INR
counts shown as numbers
dark glass styling for readability
```

Important correction:

```text
Campaign Growth must show monthly campaign count, not repeated total count.
```

## 27. Search, Filter, Sort, Pagination

Reusable pagination:

```text
frontend/src/components/common/PaginationControls.jsx
```

Current behavior:

```text
Campaign listing:
  search, status filter, sort, pagination

Admin campaign approval queue:
  search, filter, latest first, pagination

Campaign tab:
  search, filter, sort latest/oldest/title, pagination

Creator Studio My Campaigns:
  dropdown closed by default
  search title/description/status/reasons
  filter status
  sort
  pagination 6 per page

Creator Studio Proof Uploads:
  dropdown closed by default
  default filter PENDING
  sort
  pagination 5 per page

Milestones:
  default filter PENDING
  search title/campaign/description/status/proof notes
  sort
  pagination 15 per page

Donor Dashboard My Donations:
  search campaign/status/method/amount
  filter and sort

My Donations page:
  search campaign/status/method/amount
  filter and sort
  pagination 6 per page

Notifications:
  default UNREAD
  filter, sort, pagination
  mark all read

Grievances:
  default OPEN
  search, filter, sort, pagination
  view grievance dropdown shows description

Users:
  search/filter/pagination
  deactivate/delete/profile actions
```

## 28. Profile Editing

Frontend:

```text
frontend/src/pages/ProfilePage.jsx
frontend/src/pages/AdminUsersPage.jsx
```

Backend:

```text
backend/src/main/java/com/trustfund/service/AuthService.java
backend/src/main/java/com/trustfund/controller/AdminUserController.java
backend/src/main/java/com/trustfund/model/dto/UpdateProfileRequest.java
```

Self edit:

```text
user edits own name
email cannot be edited
role cannot be edited
password is changed by forgot/reset password
```

Admin edit:

```text
admin can edit another user's name
edited user receives notification/email
main admin profile can be edited only by main admin
```

## 29. Admin User Management

Frontend:

```text
frontend/src/pages/AdminUsersPage.jsx
```

Backend:

```text
backend/src/main/java/com/trustfund/controller/AdminUserController.java
```

### Create Admin

```text
only main admin
name/email/password required
password can be viewed in UI while creating
welcome email sent
```

### Deactivate

```text
admin clicks deactivate
reason dialog opens
backend stores deactivation reason
active=false
user receives notification/email with reason
login blocked
```

### Reactivate

```text
active=true
deactivation reason cleared
user receives notification/email
```

### Delete

```text
blocked if user has campaigns, donations, or grievances
main admin cannot be deleted
admin cannot delete own account
only main admin can delete another admin
```

## 30. Testing Checklist

### Auth

```text
login admin
login creator
login donor
register creator
register donor
forgot password
reset password
deactivated user cannot login
```

### Admin

```text
view dashboard
approve campaign
reject campaign with reason
pause campaign with reason
restart campaign
verify proof
redo verification
release funds
resolve grievance
deactivate/reactivate user
create admin as main admin
normal admin cannot create admin
```

### Creator

```text
create campaign
add multiple milestones
delete rejected campaign
view my campaigns
submit proof
see campaign reasons
edit own profile
```

### Donor

```text
view active campaigns
donate
view my donations
raise grievance
receive notifications
```

### UI

```text
all buttons visible
status tags visible
search placeholders spaced correctly
pagination buttons visible
charts hover readable
modals visible
empty/loading states visible
mobile layout acceptable
```

## 31. Debugging Guide

### Backend Not Starting

Check:

```text
Local PostgreSQL service running
DB_URL port is correct
backend/.env exists
Java 21 selected
```

### Database Tables Missing

Check backend startup logs:

```text
Flyway validated migrations
Schema public is up to date
```

Then in psql:

```sql
\dt
```

### CORS Error

Check:

```text
frontend URL is in trustfund.cors.allowed-origins
backend running on 8080
frontend VITE_API_BASE_URL points to backend /api
```

### Email Failed

Check:

```text
MAIL_ENABLED=true
SMTP_USERNAME correct
SMTP_PASSWORD app password without spaces
backend restarted after .env change
Gmail app password generated from same account
```

### Button Missing

Check:

```text
current user role
campaign/milestone status
frontend conditional rendering
backend permission rules
```

### Forbidden Error

Usually caused by:

```text
wrong role
missing token
trying to access another user's data
normal admin trying to manage admin account
```

## 32. IntelliJ IDEA Setup

Important setup:

```text
Use Java 21.
Open project folder.
Backend run class is TrustfundBackendApplication.
Working directory should be backend.
PostgreSQL should be running.
```

Terminal in IntelliJ:

```text
View -> Tool Windows -> Terminal
or Option + F12 on Mac
```

## 33. Git And Secret Safety

Ignored files:

```text
backend/.env
frontend/.env
frontend/node_modules/
frontend/dist/
backend/target/
docs/
tools/
.idea/
.vscode/
.DS_Store
```

Rules:

```text
Never commit Gmail app password.
Never commit real .env.
Use .env.example with placeholders.
If GitGuardian reports a secret, revoke it immediately.
Then remove/rewrite the Git commit if needed.
```

## 34. Render Deployment

Render needs:

```text
PostgreSQL database
Backend web service
Frontend static site
```

Backend service:

```text
Root Directory: backend
Build Command: ./mvnw clean package -DskipTests
Start Command: java -jar target/*.jar
```

Frontend static site:

```text
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: dist
```

Render environment variables:

```text
DB_URL
DB_USERNAME
DB_PASSWORD
JWT_SECRET
FRONTEND_URL
SMTP_HOST
SMTP_PORT
SMTP_USERNAME
SMTP_PASSWORD
MAIL_ENABLED
MAIL_SENDER_NAME
VITE_API_BASE_URL
```

For Render backend:

```text
server.port should support ${PORT:8080}
```

Do not upload `.env` to Render. Add secrets in Render dashboard.

## 35. Where To Edit What

```text
Change backend API base URL:
  frontend/.env

Change frontend API call:
  frontend/src/services/

Change page UI:
  frontend/src/pages/

Change reusable card:
  frontend/src/components/domain/

Change modal/table/pagination:
  frontend/src/components/common/

Change chart:
  frontend/src/components/charts/AnalyticsCharts.jsx

Change styling:
  frontend/src/styles/theme.css

Change route/sidebar access:
  frontend/src/routes/AppRoutes.jsx
  frontend/src/layouts/DashboardLayout.jsx

Change backend endpoint:
  backend/src/main/java/com/trustfund/controller/

Change backend rule:
  backend/src/main/java/com/trustfund/service/

Change database schema:
  backend/src/main/resources/db/migration/

Change table/entity fields:
  backend/src/main/java/com/trustfund/model/entity/

Change request/response JSON:
  backend/src/main/java/com/trustfund/model/dto/

Change status/role values:
  backend/src/main/java/com/trustfund/model/enums/

Change security:
  backend/src/main/java/com/trustfund/config/SecurityConfig.java
  backend/src/main/java/com/trustfund/security/
```

## 36. Simple Explanation For Viva/Presentation

Use this explanation:

```text
TrustFund is a role-based crowdfunding platform with milestone-based fund release and fraud detection.

Creators create campaigns with milestones and submit an official verification document.
Admins review campaigns and approve or reject them.
Only approved campaigns become visible for donors.
Donors donate to active campaigns, but the money is not directly sent to creators.
The money is locked in an escrow wallet.
Creators submit proof after completing each milestone.
Admins verify proof and then release only that milestone amount.
If all milestones are released, the campaign becomes completed.
The platform also has grievances, notifications, email alerts, fraud risk monitoring, and admin user management.
Security is handled by JWT and role-based backend checks.
Main admin has special power to create and manage other admins.
```

This is the core working logic of the complete application.
