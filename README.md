# 🍕 FlavourFinder - Food Delivery & Restaurant Booking Platform

**A complete Zomato-like platform for Ahmedabad**

---

## 🚀 Quick Start

### 1. Start MongoDB  
```bash
mongod
```

### 2. Start Backend (port 5001)
```bash
cd server && npm start
```

### 3. Start Frontend (port 3000/3001)
```bash
npm run dev
```

---

## 🔐 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| 🍴 Customer | customer@demo.local | customer123 |
| 🏪 Restaurant | restaurant@demo.local | restaurant123 |
| 🚚 Delivery | driver@demo.local | driver123 |
| 👨‍💼 Admin | admin@demo.local | admin123 |

---

## ✨ Features

### For Customers
✅ Browse restaurants & menu | ✅ Order food | ✅ Real-time delivery tracking | ✅ Rate & review | ✅ Book tables | ✅ Loyalty rewards | ✅ Referral system

- new: **Follow Restaurant Feature** - Like Instagram, follow/unfollow restaurants with heart button
- new: **Following Tab** - Dedicated section showing all followed restaurants
- new: **Nearby Followed Restaurants** - Smart notifications when followed restaurants are nearby (< 500m)
- new: **Location-based Alerts** - Browser notifications for nearby followed restaurants

### For Restaurants  
✅ Manage menu items | ✅ View orders | ✅ Accept/reject orders | ✅ Chat with customers | ✅ Analytics | ✅ Subscription plans

- new: Add menu item form with category (Veg/Non-Veg/Other), calories, protein, price, and preparation time support
- new: CSV menu import parser with fallback menu sync to backend database
- new: Menu filters (price range, category, search) with immediate results
- new: Error handling and loading states for restaurant menu management

### For Delivery Partners
✅ View available orders | ✅ GPS delivery tracking | ✅ Earnings tracking | ✅ Customer chat

### For Admins
✅ User management | ✅ Order monitoring | ✅ Analytics & reports | ✅ Platform configuration

---

## 📊 SYSTEM ARCHITECTURE & DATA FLOW

### 🏗️ Level 0 DFD (Context Diagram)
```
                    ┌─────────────────────┐
                    │   FlavorFinder      │
                    │     Platform        │
                    └─────────────────────┘
                      ↑        ↑        ↑
                      │        │        │
                   Users  Restaurants  Admins
```

### 📈 Level 1 DFD (Detailed Data Flow)
```
CUSTOMER:
  Login/Signup → Auth Service → JWT Token
         ↓
  View Restaurants → Restaurant Service → Database
         ↓
  Search Food → Search Service → Restaurant DB
         ↓
  Add to Cart → Cart Service → Session Storage
         ↓
  Place Order → Order Service → Orders DB & Payment Gateway
         ↓
  Track Order → Delivery Service → Real-time GPS tracking
         ↓
  Rate & Review → Review Service → Reviews DB

RESTAURANT:
  Login → Auth Service → JWT Token
    ↓
  Manage Menu → Menu Service → Restaurant DB
    ↓
  Receive Order → Order Service → Notification System
    ↓
  Accept/Reject → Order Status → Update DB
    ↓
  Assign Delivery → Delivery Service → Delivery Partner App

ADMIN:
  Login → Auth Service → JWT Token
    ↓
  Dashboard → Analytics Service → Read-only database
    ↓
  Manage Users/Restaurants → Admin Service → Full DB access
    ↓
  View Reports → Reporting Service → Generate analytics
```

---

## 🔄 WORKFLOW DOCUMENTATION

### 👤 CUSTOMER WORKFLOW
```
┌─ Start
├─ Register / Login
├─ Allow Location Permission
├─ Browse Restaurants / Search Food
├─ Select Restaurant
├─ View Menu & Details
├─ Add Items to Cart
├─ Review Cart
├─ Enter Delivery Address
├─ Select Payment Method
├─ Confirm Order
├─ Real-time Order Tracking
├─ Rate & Review Restaurant
└─ End (Order Completed)
```

### 🍴 RESTAURANT WORKFLOW
```
┌─ Start
├─ Login to Dashboard
├─ View Orders
├─ Accept / Reject Order
├─ Prepare Food Items
├─ Assign Delivery Partner
├─ Monitor Order Status
├─ Receive Payment
└─ End (Order Fulfilled)
```

### 🚚 DELIVERY PARTNER WORKFLOW
```
┌─ Start
├─ Login to App
├─ View Available Orders
├─ Accept Order
├─ Pick up from Restaurant
├─ Navigate to Customer Location (GPS)
├─ Deliver Food
├─ Get Customer Signature/Confirmation
├─ Track Earnings
└─ End (Order Delivered)
```

### 👨‍💼 ADMIN WORKFLOW
```
┌─ Start
├─ Login to Admin Console
├─ View Dashboard (Analytics)
├─ Manage Users
│  ├─ View All Users
│  ├─ Block/Unblock Users
│  └─ View User History
├─ Manage Restaurants
│  ├─ Approve/Reject Applications
│  ├─ Monitor Menu Items
│  └─ Handle Complaints
├─ View Orders & Analytics
├─ Generate Reports
└─ End
```

---

## 🧭 NAVIGATION & REDIRECTION FLOW (REACT ROUTING)

### Main Routes
```
/ (Home)
  ├── /login ...................... User login page
  ├── /signup ..................... User registration
  ├── /explore .................... Restaurant listing & search
  ├── /restaurant/:id ............. Restaurant detail & menu
  ├── /cart ....................... Shopping cart
  ├── /checkout ................... Payment & address entry
  ├── /orders ..................... Order history & tracking
  ├── /profile .................... User profile management
  ├── /admin ...................... Admin dashboard
  ├── /restaurant-dashboard ....... Restaurant owner panel
  └── /delivery-dashboard ......... Delivery partner app
```

### Authentication Flow
```
User not logged in
    ↓
Redirect → /login
    ↓
Login Credentials → Backend Validation
    ↓
Success → JWT Token → localStorage
    ↓
Role-based Redirect:
  ├─ ADMIN → /admin
  ├─ RESTAURANT → /restaurant-dashboard
  ├─ DELIVERY → /delivery-dashboard
  └─ CUSTOMER → /explore (home)
```

### Order Flow (Customer)
```
/explore (Browse)
    ↓
Click Restaurant → /restaurant/:id (Menu)
    ↓
Add Items → /cart (Shopping Cart)
    ↓
Checkout Button → /checkout (Address & Payment)
    ↓
Confirm Order → API Call
    ↓
Success → /orders/:orderId (Tracking Page)
    ↓
Order Delivered → Prompt for Review
```

---

## 💾 DATABASE SCHEMA OVERVIEW

### Collections Structure
```
USERS Collection
├── _id: ObjectId
├── name: String
├── email: String (unique)
├── phone: String
├── password: String (hashed)
├── role: String [customer|restaurant|delivery|admin]
├── address: Object
├── createdAt: Date
└── walletBalance: Number

RESTAURANTS Collection
├── _id: ObjectId
├── ownerId: ObjectId (ref: Users)
├── name: String
├── description: String
├── cuisine: Array[String]
├── location: Object {latitude, longitude, address}
├── imageUrl: String
├── rating: Number (0-5)
├── isOpen: Boolean
├── menu: Array[MenuItem]
├── deliveryTime: String
├── costForTwo: Number
└── createdAt: Date

ORDERS Collection
├── _id: ObjectId
├── userId: ObjectId (ref: Users)
├── restaurantId: ObjectId (ref: Restaurants)
├── items: Array[{menuItemId, name, qty, price}]
├── totalAmount: Number
├── deliveryAddress: Object
├── paymentMethod: String
├── paymentStatus: String [pending|completed|failed]
├── orderStatus: String [confirmed|preparing|ready|delivered]
├── deliveryPartnerId: ObjectId (ref: Users)
├── createdAt: Date
└── deliveredAt: Date

REVIEWS Collection
├── _id: ObjectId
├── userId: ObjectId (ref: Users)
├── restaurantId: ObjectId (ref: Restaurants)
├── rating: Number (1-5)
├── comment: String
├── createdAt: Date
└── images: Array[String]
```

---

## 🎯 KEY FEATURES IMPLEMENTED

### ✅ Core Features
- [x] User Authentication (Email + OTP)
- [x] Restaurant Listing & Search
- [x] Menu Management
- [x] Shopping Cart
- [x] Order Placement & Payment
- [x] Real-time Delivery Tracking (GPS)
- [x] Order History & Tracking
- [x] Ratings & Reviews
- [x] Table Booking

### ✅ Advanced Features
- [x] Mood-Based Food Discovery
- [x] Smart Budget Planner
- [x] Time-Based Dynamic UI (Breakfast/Lunch/Dinner)
- [x] Collections (Curated Restaurant Lists)
- [x] HD Image Loading with Fallback (Unsplash)
- [x] Lazy Loading & Code Splitting
- [x] Responsive Design (Mobile-First)
- [x] Role-Based Dashboard (Customer/Restaurant/Delivery/Admin)

### ✅ Technical Enhancements
- [x] Dynamic Image Optimization
- [x] Recommended Restaurants Filter
- [x] Location-Based Service Area Check
- [x] Cart Persistence (localStorage)
- [x] Error Boundary & Suspense
- [x] Flexible API/Local DB Fallback

---

## 🛠️ TECHNOLOGY STACK

**Frontend:**
- React 18 + TypeScript
- Vite (Build tool)
- Tailwind CSS (Styling)
- Font Awesome Icons
- Google Maps Integration

**Backend:**
- Node.js + Express
- MongoDB
- JWT Authentication
- Multer (File upload)
- Socket.io (Real-time updates)

**External Services:**
- Unsplash API (HD Images)
- Google Maps API
- Payment Gateway (UPI/Card)
- Gemini AI (Recommendations)

---

## 📱 RESPONSIVE DESIGN

Optimized for:
- 📱 Mobile (320px - 640px)
- 📱 Tablet (640px - 1024px)
- 💻 Desktop (1024px+)

---

## 🚀 DEPLOYMENT

**Frontend:** Vercel / Netlify
**Backend:** Railway / Render / Heroku
**Database:** MongoDB Atlas

---

## 📝 NOTES FOR PROJECT SUBMISSION

This project demonstrates:
1. **Full-Stack Development** - Complete MERN architecture
2. **Database Design** - Normalized MongoDB schema
3. **API Architecture** - RESTful endpoints with proper error handling
4. **UI/UX Design** - Modern responsive UI with animations
5. **Performance Optimization** - Lazy loading, image optimization, code splitting
6. **Security** - JWT auth, password hashing, role-based access
7. **Real-time Features** - Delivery tracking, notifications
8. **Advanced Features** - AI recommendations, mood-based search, smart budget planner

Perfect for showcasing in viva examination and project reports.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Tailwind CSS + Vite |
| Backend | Node.js + Express + Socket.io |
| Database | MongoDB (15 collections) |
| Auth | JWT + bcryptjs |
| Maps | **Leaflet.js + OpenStreetMap** (FREE) |
| AI | Google Gemini |

---

## 📊 Project Structure

```
flavorfinder/
├── components/          (52 React components)
├── services/            (30+ TypeScript services)
├── server/             (Express backend)
│   ├── models/         (15 MongoDB collections)
│   ├── routes/         (12 API route files)
│   └── server.js       (Main server)
├── database/           (Data & schemas)
└── styles/             (Tailwind CSS)
```

---

## 📋 Implemented Features

**Authentication**  
✅ 4 user roles | JWT tokens | Password hashing | Role-based access

**Ordering System**  
✅ Browse restaurants | Add to cart | Checkout | Payment processing

**Real-time Features**  
✅ WebSocket chat | Live delivery tracking | Order status updates | Notifications

**Advanced Features**  
✅ Reviews & ratings | Loyalty program | Referral system | Table booking | Subscription plans
✅ Manage menu | Accept orders | Track deliveries | View analytics

### 3️⃣ DELIVERY PARTNER (Track Orders)
```
Email: driver@demo.local
Password: driver123
```
✅ Accept deliveries | GPS tracking | Earn commissions | Daily earnings

### 4️⃣ ADMIN (Platform Control)
```
Email: admin@demo.local
Password: admin123
```
✅ Manage users | View analytics | Monitor orders | Platform settings

---

## 📱 Features

### 🎯 Core Features
- ✅ Real-time food delivery tracking (GPS)
- ✅ Restaurant discovery by location & cuisine
- ✅ Online food ordering with live updates
- ✅ Restaurant table booking system
- ✅ Secure payments & wallet
- ✅ Loyalty points & referral rewards
- ✅ AI-powered recommendations
- ✅ Real-time chat with restaurants

### 🤖 AI Features
- Google Gemini for smart recommendations
- AI-generated images from Unsplash
- Smart filtering & personalization

### 📊 Real-Time
- WebSocket (Socket.io) for live updates
- Live order tracking
- Real-time notifications
- Instant chat messaging

---

## 📂 Project Structure

```
- components/          # 52 React components
- services/           # 30 business logic services
- server/models/      # 15 MongoDB schemas
- server/routes/      # 12 API endpoint files
- server/controllers/ # 7 request handlers
```

---

## 🔧 Technology Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, Socket.io |
| Database | MongoDB + Mongoose |
| Maps | **Leaflet.js + OpenStreetMap** (FREE) |
| Auth | JWT + bcryptjs |
| AI | Google Gemini 2.5 |
| Images | Unsplash API |

---

## 🧪 Test Features

1. **Register New Account** → Click "Sign up" button
2. **Login** → Use credentials above
3. **Browse Restaurants** → See distance & delivery fee
4. **Track Order** → Real-time GPS updates
5. **Contact Restaurant** → Live chat support

---

## 🚀 Deploy to Production

```bash
# Build
npm run build

# Deploy to Render/Vercel
# Add .env with production values
```

---

## ✨ Key Fixes Applied

✅ User registration implemented
✅ Backend API port fixed (5001)
✅ Syntax errors fixed
✅ Background images added
✅ Lightweight & dependency-optimized

---

**Status**: ✅ Production Ready | 📱 Mobile Responsive | ⚡ Optimized Performance
