# TrustFund

Secure milestone-based crowdfunding platform built with **React**, **Bootstrap**, **Spring Boot 3.5**, **PostgreSQL**, and **JWT authentication**.

The frontend uses Bootstrap as the base CSS framework, with custom CSS for project-specific dashboard styling, branding, sidebar layout, cards, charts, hover states, and responsive refinements.

## Quick Start

### 1. Start PostgreSQL

```bash
cd trustfund
docker compose up -d
```

### 2. Run the backend

Backend must run on port `8080`.

```bash
cd backend
SMTP_USERNAME=your-project-email@example.com \
SMTP_PASSWORD="replace-with-your-new-app-password" \
MAIL_SENDER_NAME=TrustFund \
FRONTEND_URL=http://localhost:5173 \
SERVER_PORT=8080 \
./mvnw spring-boot:run
```

API: `http://localhost:8080`  
Swagger UI: `http://localhost:8080/swagger-ui.html`

If another backend is still running on `8090`, stop it before testing. The frontend is configured to use `8080`.

#### Eclipse backend run setup

1. Open Eclipse.
2. Right-click the backend project.
3. Choose `Run As` -> `Run Configurations...`.
4. Select the Spring Boot run configuration for `TrustfundBackendApplication`.
5. Open the `Environment` tab.
6. Add these variables:

```text
SERVER_PORT=8080
FRONTEND_URL=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-project-email@example.com
SMTP_PASSWORD=replace-with-your-new-app-password
MAIL_SENDER_NAME=TrustFund
MAIL_ENABLED=true
```

7. Click `Apply`.
8. Click `Run`.

Successful startup should show Tomcat running on port `8080`.

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

### Default admin

| Field | Value |
|-------|-------|
| Admin | `trustfund.notification@gmail.com` / `Admin@123456` |

Creator and donor accounts should be created through registration or by using the app UI.

## API Overview

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /api/auth/register`, `/login`, `/refresh` |
| Campaigns | `POST/GET /api/campaigns`, `GET /my`, `PUT /{id}/approve\|reject` |
| Donations | `POST /api/donations`, `GET /my` |
| Milestones | `POST /{id}/proof`, `PUT /{id}/verify\|release` |
| Fraud | `GET /api/fraud/alerts` (admin) |
| Complaints | `POST /api/complaints`, `GET`, `PUT /{id}/resolve` |
| Notifications | `GET /api/notifications`, `PUT /{id}/read` |

## Configuration

Key settings in `application.properties`:

- `trustfund.jwt.secret` — JWT signing key (set via `JWT_SECRET` env var in production)
- `trustfund.payment.mock-enabled=true` — auto-succeeds payments locally (disable for Razorpay)

## Build & Test

```bash
cd backend
./mvnw clean package
./mvnw test

cd ../frontend
npm run build
```

## Architecture

```
React SPA → REST API → Controllers → Services → Repositories → PostgreSQL
                              ↓
                    Escrow · Fraud · Notifications · Audit
```

Funds are held in per-campaign escrow wallets and released only after admin verifies milestone proof.

## Frontend Styling

- Bootstrap is imported globally in `frontend/src/main.jsx`.
- Shared Bootstrap classes are used for buttons, tables, forms, spacing, and responsive helpers.
- Custom styles in `frontend/src/styles/theme.css` extend Bootstrap for the TrustFund dashboard experience.
