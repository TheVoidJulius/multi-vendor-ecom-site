<div align="center">

# 🛍️ Veloura — Premium Multi-Vendor Marketplace

A modern, full-featured multi-vendor e-commerce platform with dedicated experiences for **Customers**, **Vendors**, and **Admins** — built with React, TypeScript, and Supabase.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen?style=for-the-badge)](https://your-deploy-link.vercel.app)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

**[🔗 Live Demo](https://veloura0.netlify.app/)** · 

</div>

---

## 📖 Overview

**Veloura** is a full-stack multi-vendor marketplace that lets multiple independent sellers list and manage their own products under one storefront, while customers get a single, unified shopping experience. It ships with three purpose-built interfaces:

- 🛒 **Customer Storefront** — browse, search, and purchase products across vendors and brands
- 🏪 **Vendor Dashboard** — sellers manage their own products, orders, earnings, and messages
- 🛠️ **Admin Panel** — platform owners manage vendors, customers, catalog, coupons, and site content

It also includes **AI-assisted shopping features** — smart search, product recommendations, and a product Q&A chat — to enhance product discovery.

---

## ✨ Features

### Customer Experience
- Product browsing with categories, brands, and vendor storefronts
- Product detail pages with reviews and ratings
- Cart, wishlist, and full checkout flow
- Order history and account management
- AI-powered smart search and personalized recommendations
- Product Q&A chat assistant

### Vendor Experience
- Vendor registration and onboarding
- Product management (add/edit/track inventory)
- Order management dashboard
- Earnings and payout tracking
- Direct messaging with customers/platform
- Store settings and branding

### Admin Experience
- Centralized dashboard with platform-wide metrics
- Vendor approval and management
- Product, category, and brand moderation
- Customer management
- Coupon and promotional banner management
- Order oversight across all vendors
- Platform-wide settings

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 18 + TypeScript |
| **Build Tool** | Vite |
| **Styling** | Tailwind CSS |
| **UI Components** | shadcn/ui (Radix UI primitives) |
| **Routing** | React Router v6 |
| **Data Fetching / State** | TanStack Query (React Query) |
| **Forms & Validation** | React Hook Form + Zod |
| **Backend / Auth / DB** | Supabase (PostgreSQL, Auth, Edge Functions) |
| **Charts** | Recharts |
| **Testing** | Vitest + React Testing Library |
| **Linting** | ESLint + typescript-eslint |

---

## 📂 Project Structure

```
src/
├── components/
│   ├── ai/            # Smart search, recommendations, Q&A chat
│   ├── admin/          # Admin layout & shared admin components
│   ├── vendor/         # Vendor layout & shared vendor components
│   ├── products/        # Product card, reviews, etc.
│   ├── layout/          # Header, Footer, Layout wrapper
│   └── ui/             # shadcn/ui component library
├── pages/
│   ├── admin/           # Admin dashboard pages
│   ├── vendor/          # Vendor dashboard pages
│   └── ...              # Customer-facing pages
├── hooks/               # useAuth, useCart, useVendor, useWishlist, useAI, etc.
├── integrations/
│   └── supabase/        # Supabase client & generated types
├── lib/                 # Utility functions & shared types
└── App.tsx              # Route definitions

supabase/
├── migrations/          # Database schema migrations
└── functions/           # Supabase Edge Functions
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (or [bun](https://bun.sh/), since a `bun.lockb` is included)
- A [Supabase](https://supabase.com/) project (for backend/auth/database)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/veloura.git
cd veloura

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
```

Fill in your `.env` with your Supabase project credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

```bash
# 4. Run the development server
npm run dev
```

The app will be available at `http://localhost:8080`.

### Other useful scripts

```bash
npm run build        # production build
npm run build:dev     # development-mode build
npm run preview       # preview the production build locally
npm run lint          # run ESLint
npm run test          # run tests once
npm run test:watch    # run tests in watch mode
```

---

## 🌐 Deployment

This project is deployed and live here:

### 🔗 **[Visit Live Site →](https://veloura0.netlify.app/)**

The app can be deployed to any static hosting provider that supports Vite builds (Vercel, Netlify, Cloudflare Pages, etc.). Just set the environment variables in your hosting provider's dashboard and set the build command to `npm run build` with output directory `dist`.

---

## 🗺️ Roadmap

- [ ] Payment gateway integration
- [ ] Real-time order tracking
- [ ] Vendor analytics dashboard enhancements
- [ ] Multi-language support
- [ ] Mobile app (React Native)

---


<div align="center">

If you found this project useful, consider giving it a ⭐!

</div>
