# FlavorFinder - Project Documentation & Authentication Guide

Welcome to the FlavorFinder development guide! This document explains the high-level architecture of the MERN stack application, along with a detailed deep-dive into how the Authentication (Login/Signup) mechanisms function across the platform.

---

## 🏗️ 1. High-Level Architecture

FlavorFinder is built using the **MERN** stack:
- **MongoDB + Mongoose**: The NoSQL database used to persist all data (Users, Cart, Menus, Orders).
- **Express + Node.js**: The backend API server that manages business logic, validations, authentication, and database queries.
- **React + Vite + Typescript**: The frontend framework, equipped with `react-router-dom` for component management and conditional rendering based on user roles.

### Core Systems
- **WebSockets (Socket.io)**: Used for real-time live order tracking mapping out coordinates and statuses.
- **ImageKit**: Handling cloud image uploads directly.
- **Role-Based Interfaces**: The application serves four distinct users dynamically: 
  - Standard Customers (`CustomerDashboardComplete.tsx`)
  - Restaurant Partners (`RestaurantDashboardComplete.tsx`)
  - Delivery Fleet (`DeliveryDashboardComplete.tsx`)
  - System Administrators (`AdminDashboardComplete.tsx`)

---

## 🔐 2. How Authentication Works (Login & Signup)

FlavorFinder takes security and verification seriously. The authentication flow uses **JWT (JSON Web Tokens)** combined with **One-Time Password (OTP)** verification.

### 📝 The Signup Flow
When a new user wants to join the platform (as a diner, partner, or driver), the following process takes place:

1. **Frontend Initiation**: 
   The user fills out their information on `RegisterPage.tsx`. If they select "Restaurant Owner", a dynamic field requests their Restaurant Name.
2. **Registration API Call**: 
   The frontend triggers `authService.register(payload)` sending data to the backend (`/api/auth/register`).
3. **Backend Logic & Rate Limiting**: 
   The `authController.js` validates the inputs (using validators like `express-validator` and `zod`). It enforces a strict rate limit (max 3 tries per 10 mins) to prevent spam.
4. **Initial Database Entry & Password Hashing**: 
   The backend creates an inactive User profile. The 'pre-save' hook in the `User` mongoose model intercepts the password and securely salts/hashes it using `bcrypt` before storing it in MongoDB.
5. **OTP Generation & Dispatch**: 
   A secure 6-digit OTP is generated. Depending on configuration, it routes through `emailService.js` (Nodemailer) or `smsService.js` (Twilio/Fast2SMS). 
6. **Verification Phase**: 
   The frontend switches to the OTP Verification screen. The user inputs the code, hitting `/api/auth/verify-email-otp`. The backend corroborates the code.
7. **Token Issuance**: 
   If valid, the account is marked active. The server generates an encrypted **JWT Token** and sends it back to the client.

### 🔑 The Login Flow
Returning users follow a more streamlined path:

1. **Frontend Initiation**: 
   The user enters email and password on `LoginPage.tsx`.
2. **Authentication API Call**:
   Submitted to `/api/auth/login`. 
3. **Verification**: 
   The backend fetches the user via email, uses `bcrypt.compare` against the stored hash, and ensures the account is fully verified.
4. **Token Decoding**:
   A JWT token is delivered back. The frontend stores this strictly in the browser's `localStorage` (`token` and `user` object).
5. **Dynamic Dashboard Routing**: 
   The `App.tsx` router listens to the user's `role` property. 
   - If `role === 'customer'`, they unlock marketplace ordering.
   - If `role === 'restaurant'`, they enter their management panel.
   - If `role === 'delivery'`, they enter the delivery manifest.

### 🛡️ Administrator Security
For strict platform control, Administrators cannot arbitrarily sign up through the standard registration portal. 
- Admin roles can only be explicitly seeded inside the database or via `/admin-signup` (which is technically shielded by secret parameters or blocked post-launch). 
- Admins possess their own login flow matching `AdminLogin.js` overriding normal roles to give them global `<AdminDashboardComplete />` capabilities.

---

### Session Expiration & Protection
- Every restricted API endpoint utilizes the `authenticate` middleware.
- The middleware unwraps the Authorization header (`Bearer <token>`). If the JWT is expired or tampered with, the backend rejects it with `401 Unauthorized`.
- `authService.ts` contains an Axios interceptor: if it receives a `401`, it immediately flushes the client's `localStorage` and forces them back to the login screen securely, ensuring no stale data is accessed.
