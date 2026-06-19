<div align="center">

# 🧾 Invora — AI Invoice Tool

### Invoicing that writes itself.

Generate invoices from a single sentence, extract data from any receipt or PDF with OCR,
and manage clients, templates, and your team — all in one beautifully simple tool.

<br />

![Invora landing page](docs/screenshots/01-landing.png)

<br />

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Claude](https://img.shields.io/badge/Claude_AI-D97757?style=for-the-badge&logo=anthropic&logoColor=white)

</div>

---

## 📑 Table of contents

- [Overview](#-overview)
- [Screenshots](#-screenshots)
- [Features](#-features)
- [AI features in depth](#-ai-features-in-depth)
- [Tech stack](#-tech-stack)
- [Getting started](#-getting-started)
- [Demo accounts](#-demo-accounts)
- [Roles & permissions](#-roles--permissions)
- [Data model](#-data-model)
- [API reference](#-api-reference)
- [Project structure](#-project-structure)
- [Scripts](#-scripts)
- [Environment variables](#-environment-variables)
- [Production notes](#-production-notes)
- [Security](#-security)
- [Roadmap & limitations](#-roadmap--limitations)
- [Copyright](#-copyright)

---

## 🔍 Overview

**Invora** is a complete, multi-tenant invoicing SaaS built end-to-end. Each account is a
**company** with its own employees, clients, templates, and invoices. It combines a polished,
fully responsive UI with two AI superpowers backed by **Claude**:

1. **Natural-language invoice generation** — describe a job and get a fully structured invoice.
2. **OCR data extraction** — upload a receipt, quote, or PDF and have it transcribed into an invoice.

Everything else you'd expect from a real invoicing product is here too: authentication with
password reset, role-based access control, reusable templates, client management, an analytics
dashboard, full-text search and status filtering, status workflow, and one-click PDF export.

---

## 📸 Screenshots

### Dashboard
Outstanding & paid totals, a six-month revenue trend, a status breakdown, and recent invoices.

![Dashboard](docs/screenshots/03-dashboard.png)

### Invoice list — search, filter & history
Search by number, client, or email and filter by status across your full history.

![Invoices list](docs/screenshots/04-invoices.png)

### Invoice editor — manual or AI-powered
The **Create with AI** panel sits at the top: describe the invoice or upload a document.
Below it, a live editor with details, recipient, dynamic line items, and a real-time summary.

![Invoice editor](docs/screenshots/05-invoice-editor.png)

### Invoice document & PDF export
A clean, print-ready document with a one-click **PDF** download and inline status changes.

![Invoice view](docs/screenshots/06-invoice-view.png)

### Templates · Clients · Team · Settings

| Templates | Clients |
| :---: | :---: |
| ![Templates](docs/screenshots/07-templates.png) | ![Clients](docs/screenshots/08-clients.png) |

| Team & permissions | Company settings |
| :---: | :---: |
| ![Team](docs/screenshots/09-team.png) | ![Settings](docs/screenshots/10-settings.png) |

### Fully responsive
Mobile-first layout with a collapsible sidebar — everything works on a phone.

| Mobile dashboard | Mobile invoice editor |
| :---: | :---: |
| ![Mobile dashboard](docs/screenshots/11-mobile-dashboard.png) | ![Mobile editor](docs/screenshots/12-mobile-editor.png) |

---

## ✨ Features

| Area | What it does |
| --- | --- |
| 🔐 **Authentication** | Register (creates a company + admin user), login/logout, and token-based password reset |
| 🤖 **AI invoice generation** | Describe a job in plain language → Claude drafts a complete, structured invoice |
| 📷 **OCR extraction** | Upload an image or PDF of a receipt/quote → Claude transcribes it into an invoice |
| 🧾 **Invoice management** | Create, edit, view, and delete; auto-incrementing numbers; live totals & tax |
| 🔎 **Search & filtering** | Search by number / client / email, filter by status |
| 🗂️ **History & status** | Full history with a status workflow: Draft → Sent → Paid → Overdue → Cancelled |
| 📋 **Templates** | Save reusable invoice presets with default line items, tax, terms & notes |
| 👥 **Clients** | Manage billing recipients; auto-fill invoices from saved clients |
| 🛡️ **Team & permissions** | Employees with **Admin / Manager / Member** roles, enforced server-side |
| 📊 **Dashboard** | Outstanding/paid totals, revenue trend, status breakdown, recent invoices |
| 📄 **PDF export** | One-click, polished, print-ready PDF invoices |
| 🏢 **Company settings** | Company profile shown on every invoice + configurable invoice numbering |
| 📱 **Responsive** | Mobile-first design with a collapsible sidebar drawer |

---

## 🤖 AI features in depth

AI generation and OCR call the **Anthropic API** with model `claude-opus-4-8` through the
official [`@anthropic-ai/sdk`](https://www.npmjs.com/package/@anthropic-ai/sdk). Both features are
**optional** — set `ANTHROPIC_API_KEY` to enable them. Without a key, the rest of the app works
fully and the AI endpoints return a clear *"not configured"* message.

### 1. Natural-language generation · `POST /api/ai/generate`

Type something like:

> *"Bill Acme Inc. for 20 hours of consulting at ¥15,000/hr plus a ¥50,000 setup fee, 10% tax, due in 30 days."*

Claude returns a structured invoice (recipient, line items, quantities, unit prices, tax, dates)
using **JSON-schema-constrained structured outputs**, so the response is always valid and
parseable. The draft pre-fills the editor for review — **the AI never saves an invoice on its own.**

### 2. OCR extraction · `POST /api/ai/ocr`

Upload a **PNG / JPG / GIF / WebP** image or a **PDF**. The file is sent to Claude using vision /
document input, and every line item, quantity, price, tax rate, currency, and term is transcribed
into the same structured draft that pre-fills the editor.

Both endpoints are schema-validated, size-limited, and degrade gracefully with helpful error
messages (e.g. `503` when no API key is configured, `400` for unsupported file types).

---

## 🛠 Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js 16** (App Router) | One codebase for UI, SSR, and API routes |
| Language | **TypeScript** (strict) | End-to-end type safety |
| Styling | **Tailwind CSS v4** | Fast, consistent, responsive design |
| Database | **Prisma 6 + SQLite** | Zero-config local dev; swap to Postgres for prod |
| Auth | **jose** (JWT) + **bcryptjs** | Stateless httpOnly-cookie sessions, hashed passwords |
| AI | **Claude `claude-opus-4-8`** | NL generation + vision OCR via the official SDK |
| Validation | **Zod** | Shared request/response schemas |
| PDF | **jsPDF + jspdf-autotable** | Client-side, print-ready invoice export |

---

## 🚀 Getting started

### Prerequisites
- **Node.js 18.18+** (Node 20+ recommended)
- npm

### Install & run

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#    - AUTH_SECRET     → any long random string (e.g. `openssl rand -hex 32`)
#    - ANTHROPIC_API_KEY → optional; set to enable AI generation + OCR

# 3. Set up the database (SQLite) and load demo data
npx prisma migrate dev      # creates the schema
npm run db:seed             # demo company + 3 users + sample invoices

# 4. Run the dev server
npm run dev                 # → http://localhost:3000
```

Open **http://localhost:3000** and sign in with a demo account below.

---

## 👤 Demo accounts

After seeding, these accounts exist (all password `password123`):

| Email | Password | Role |
| --- | --- | --- |
| `demo@invoice.app` | `password123` | **Admin** |
| `manager@invoice.app` | `password123` | **Manager** |
| `member@invoice.app` | `password123` | **Member** |

<div align="center">

![Sign in](docs/screenshots/02-login.png)

</div>

---

## 🛡️ Roles & permissions

RBAC is enforced **server-side on every API route** — not just hidden in the UI.

| Capability | Member | Manager | Admin |
| --- | :---: | :---: | :---: |
| Create / edit / view invoices, clients, templates | ✅ | ✅ | ✅ |
| View the team | — | ✅ | ✅ |
| Add / edit / remove employees, change roles | — | — | ✅ |
| Edit company settings & invoice numbering | — | — | ✅ |

> The app also prevents removing or demoting the **last active administrator**, and you can't
> delete your own account.

---

## 🗃 Data model

Every record is scoped to a `companyId`, and all queries are filtered by the current user's
company (multi-tenant isolation).

```
Company ─┬─< User           (employees: ADMIN | MANAGER | MEMBER)
         │      └─< PasswordReset
         ├─< Client
         ├─< InvoiceTemplate
         └─< Invoice ─< InvoiceItem
                 └─ (optional) Client, createdBy User
```

Invoices store a **snapshot** of the recipient (name/email/address/tax ID) so historical invoices
stay stable even if the client record later changes.

---

## 🔌 API reference

All routes live under `/api`. Protected routes require a valid session cookie; mutating team and
company routes additionally enforce a minimum role.

| Method | Route | Purpose | Min role |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Create company + admin, start session | — |
| `POST` | `/api/auth/login` | Log in | — |
| `POST` | `/api/auth/logout` | Log out | — |
| `POST` | `/api/auth/request-reset` | Request a password reset link | — |
| `POST` | `/api/auth/reset` | Set a new password from a token | — |
| `GET` | `/api/me` | Current user info | Member |
| `GET` | `/api/dashboard` | Dashboard stats & recent invoices | Member |
| `GET` `POST` | `/api/invoices` | List (search/filter) / create | Member |
| `GET` `PATCH` `DELETE` | `/api/invoices/[id]` | Read / update / delete | Member |
| `GET` `POST` | `/api/clients` | List / create | Member |
| `PATCH` `DELETE` | `/api/clients/[id]` | Update / delete | Member |
| `GET` `POST` | `/api/templates` | List / create | Member |
| `PATCH` `DELETE` | `/api/templates/[id]` | Update / delete | Member |
| `GET` | `/api/employees` | List team | Manager |
| `POST` | `/api/employees` | Add employee | Admin |
| `PATCH` `DELETE` | `/api/employees/[id]` | Update / remove employee | Admin |
| `GET` | `/api/company` | Company profile | Member |
| `PATCH` | `/api/company` | Update company & numbering | Admin |
| `POST` | `/api/ai/generate` | NL → structured invoice draft | Member |
| `POST` | `/api/ai/ocr` | Image/PDF → structured invoice draft | Member |

---

## 📁 Project structure

```
prisma/
  schema.prisma         # Company, User, Client, Invoice, InvoiceItem, Template, PasswordReset
  seed.ts               # demo data
docs/screenshots/       # README images
src/
  app/
    (auth)/             # login, register, forgot/reset password
    (app)/              # dashboard, invoices, clients, templates, employees, settings (protected)
    api/                # REST routes (auth, invoices, clients, templates, employees, company, ai, dashboard, me)
    page.tsx            # marketing landing page
  components/
    AppShell.tsx        # responsive sidebar + topbar
    InvoiceEditor.tsx   # invoice form with AI generate + OCR
    ui.tsx              # Button, Input, Card, Modal, Toast, Badge, etc.
  lib/
    auth.ts             # JWT sessions (jose), bcrypt, RBAC helpers
    ai.ts               # Anthropic generation + OCR
    api.ts              # requireUser / response helpers
    prisma.ts           # Prisma client singleton
    pdf.ts              # client-side jsPDF invoice export
    format.ts           # money/date formatting + totals
    validation.ts       # zod schemas
    invoices.ts         # number generation + persistence helpers
```

---

## 📜 Scripts

```bash
npm run dev        # dev server (http://localhost:3000)
npm run build      # production build
npm start          # serve the production build
npm run db:seed    # seed demo data
npm run db:reset   # reset DB + re-run migrations + reseed
```

---

## ⚙️ Environment variables

See [`.env.example`](.env.example).

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Prisma connection string. Defaults to local SQLite (`file:./dev.db`). |
| `AUTH_SECRET` | ✅ | Secret used to sign session JWTs. Use a long random string in production. |
| `ANTHROPIC_API_KEY` | optional | Enables AI generation + OCR. Get one at [console.anthropic.com](https://console.anthropic.com). |

---

## 🏭 Production notes

- **Database** — SQLite is used for zero-config local dev. For production, change the Prisma
  datasource `provider` to `postgresql` and point `DATABASE_URL` at your database.
- **Password reset email** — no email provider is wired up; in development the reset link is
  printed to the server console and surfaced in the UI. Plug an email service into
  `src/app/api/auth/request-reset/route.ts` for production.
- **Secrets** — set a strong, unique `AUTH_SECRET`. Sessions are httpOnly cookies, marked
  `secure` automatically in production.

---

## 🔒 Security

- Passwords hashed with **bcrypt**; sessions are signed JWTs in **httpOnly** cookies and verified
  against the database on every protected request.
- **Multi-tenant isolation**: every query is scoped to the authenticated user's `companyId`.
- **Server-side RBAC**: role checks run in the API layer, independent of the UI.
- Password-reset responses are intentionally generic to avoid leaking which emails exist.
- AI never persists data on its own — generated/extracted drafts always require human review.

---

## 🧭 Roadmap & limitations

- Email delivery for password resets and sending invoices to clients (currently console/UI in dev).
- Recurring invoices and partial payments.
- Multi-currency reporting and exchange-rate handling on the dashboard.
- Logo upload for invoice branding (field exists in the schema; UI not yet wired).

---

## © Copyright

© 2026 **aoi-webstudio**. All rights reserved.

This project and all of its source code, design, and assets are the exclusive property of
**aoi-webstudio**. Copyright belongs solely to aoi-webstudio.

---

<div align="center">

**Invora** — AI Invoice Tool · Built with Next.js, Prisma & Claude.

© 2026 aoi-webstudio. All rights reserved.

</div>
