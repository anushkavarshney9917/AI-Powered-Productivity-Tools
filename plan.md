# Frontend Plan – Minimal 3D, UI-First Web App

## Goal

Build a **frontend-only web application** using **Next.js + Tailwind CSS** where:

- Primary focus is **clean, modern 2D UI**
- 3D elements are **minimal, decorative, and only in the background**
- The app remains fully usable and attractive **even without 3D**

This project should look **production-ready**, SaaS-style, and suitable for demos, hackathons, or portfolio use.

---

## Design Philosophy

### Core Principles

- UI > Effects
- Readability > Visual noise
- Performance > Fancy animations
- 3D is **supporting**, not the product

### 3D Rules (Strict)

- 3D is used **only as background**
- No 3D interactions required
- No task/data rendered in 3D
- Use slow, subtle motion (ambient)
- `pointer-events: none`
- If removed, UI must still feel complete

---

## Tech Stack

- **Next.js (App Router)**
- **Tailwind CSS**
- **TypeScript**
- **Framer Motion** (2D animations only)
- **@react-three/fiber + Three.js**
  - Only for hero background

---

## Pages Breakdown

### 1. Landing Page (`/`)

**Purpose:** Marketing & first impression

**Sections**

- Navbar
- Hero section
- Features
- How it works
- Pricing preview
- Footer

**3D Usage**

- One background canvas in Hero section
- Examples:
  - Floating particles
  - Gradient blob
  - Slow rotating geometry
- Low opacity
- No user interaction

---

### 2. Login Page (`/login`)

**Purpose:** Authentication UI (frontend-only)

**Design**

- Centered card layout
- Clean form inputs
- No 3D
- Optional animated gradient background

---

### 3. Signup Page (`/signup`)

Same style as login:

- Simple
- Focused
- Minimal

---

### 4. Dashboard (`/dashboard`)

**Purpose:** Core app UI

**Layout**

- Sidebar navigation
- Header with actions
- Stats cards
- Content area (table/cards)

**Rules**

- Pure 2D UI
- No Three.js here
- Fast and readable

---

### 5. Features Page (`/features`)

**Purpose:** Explain product capabilities

- Cards with icons
- Short descriptions
- Framer Motion animations
- No 3D

---

### 6. Pricing Page (`/pricing`)

**Purpose:** Conversion

- Pricing cards
- Feature comparison
- Highlight “Most Popular”
- CTA buttons

---

### 7. Settings / Profile Page (`/settings`)

**Purpose:** User configuration

- Forms
- Toggles
- Inputs
- No 3D

---

## Folder Structure
