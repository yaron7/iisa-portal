# 🚀 IISA Spaceflight Registration & Management Dashboard

This project was built for the **Israeli Imaginary Space Agency (IISA)** — enabling public registration for Israel’s first spaceflight and providing an internal management dashboard for candidate tracking, analytics, and insights.

---

## 🧪 Objective

To design and build a **public registration landing page** and a **recruitment management dashboard** for IISA’s spaceflight initiative.

---

## 🧭 Features Overview

### 🧍‍♂️ Part 1 — Public Registration (Landing Page)

- Responsive registration form for spaceflight candidates
- Collects:
  - Full name (validated: first + last name, no numbers/special chars)
  - Email (standard email validation)
  - Phone number (valid Israeli phone only)
  - Age (18–99)
  - City/region (Google Maps autocomplete)
  - Hobbies
  - “Why I’m the perfect candidate”
  - Profile image (JPEG/PNG upload)
- Local 3-day edit window (data persisted in **LocalStorage**)
- Mobile + desktop adaptive layout (Angular Material + Flex/Grid)
- Inline validation messages and feedback for UX clarity

---

### 🛰️ Part 2 — Management Dashboard

- **Candidates List View**
  - Table view (Angular Material) with name, image, summary
  - Search & filter by name, city, or age
  - Pagination and hover effects
- **Candidate Detail View**
  - Full profile with navigation (Next/Previous)
  - “Go back to active tab” logic for better UX
- **Analytics & Visualization**
  - Age distribution chart (ngx-charts)
  - Registration conversion chart (visits vs. submissions)
  - Google Map integration showing candidate locations
  - Click on candidate → centers map on their marker
  - Real-time updates via RxJS stream and Firebase sync
- **KPIs Dashboard**
  - Total visits
  - Total registrations
  - Conversion rate
  - Active candidates by region

---

## 🧩 Technical Stack

| Category                 | Tech                                 |
| ------------------------ | ------------------------------------ |
| **Framework**            | Angular 19 (Standalone Components)   |
| **Language**             | TypeScript                           |
| **UI Library**           | Angular Material + TailwindCSS       |
| **State / Live Updates** | RxJS Streams                         |
| **Data Layer**           | LocalStorage / Firebase mock backend |
| **Charts**               | ngx-charts                           |
| **Map**                  | @angular/google-maps                 |
| **Validation**           | Angular Reactive Forms               |
| **Build Tools**          | Angular CLI 19, Vite (optional)      |

---

## ⚙️ Core Project Structure

| Path / Module                                        | Description                                                                |
| ---------------------------------------------------- | -------------------------------------------------------------------------- |
| **`/core/`**                                         | Application backbone – services, models, validators, and Firestore logic.  |
| `core/services/analytics.service.ts`                 | Tracks visits, registrations, and conversion metrics.                      |
| `core/services/candidate.service.ts`                 | Handles Firestore CRUD operations and file uploads.                        |
| `core/validators/full-name.validator.ts`             | Ensures valid full name (Hebrew/English, ≥2 words, letters only).          |
| `core/directives/places-autocomplete.directive.ts`   | Integrates Google Maps Autocomplete for city selection.                    |
| **`/shared/`**                                       | Reusable UI and utility layer (Material imports, directives, pipes, etc.). |
| `shared/material.module.ts`                          | Centralized Angular Material imports.                                      |
| `shared/directives/normalize-full-name.directive.ts` | Normalizes whitespace and capitalization in name fields.                   |
| **`/features/landing/`**                             | Public registration entry point with 3-day edit logic and persistence.     |
| **`/features/dashboard/`**                           | Admin dashboard with analytics charts and city map visualization.          |
| **`/features/candidate-form/`**                      | Multi-step registration form with validation and image upload.             |
| **`/features/candidate-details/`**                   | Displays full candidate profile + navigation to edit mode.                 |
| **`/features/candidates-list/`**                     | Candidate list view with search and filtering.                             |

---

## 🧠 Validation Rules

| Field           | Rules                                                                     |
| --------------- | ------------------------------------------------------------------------- |
| **Full Name**   | Must include first & last name (Hebrew/English only). No numbers/symbols. |
| **Email**       | Must match standard email pattern.                                        |
| **Phone**       | Must start with 0 and be a valid Israeli mobile or landline number.       |
| **Age**         | 18 ≤ age ≤ 99                                                             |
| **City**        | Google Maps Autocomplete (text fallback supported).                       |
| **Image**       | JPEG or PNG only.                                                         |
| **Edit Window** | Candidate can re-edit submission within 3 days of initial save.           |

---

## 🧭 Navigation Flow

1. **Landing Page** → Candidate fills and submits form.
2. **LocalStorage** persists submission + timestamp.
3. **Edit mode** available for 3 days.
4. **Dashboard** auto-updates (RxJS + polling).
5. **Admin views candidate**, navigates between records, and interacts with analytics and map.

---

## 🔐 Admin Access Credentials

| Role | Username | Password |
|------|-----------|-----------|
| **Admin** | `admin@iisa-portal.co.il` | `Nr!-u0&1f~eLF3I(Nc^` |

> 🧠 Use these credentials to log in to the dashboard’s `/dashboard` route.  
> Credentials are stored locally for demo purposes — replace them with a secure auth provider (Firebase Auth / Supabase / OIDC) for production.

---

## 💡 Development Commands

```bash
# Install dependencies
npm install

# Run locally
ng serve

# Build for production
ng build

# Lint & test
ng lint && ng test
```
