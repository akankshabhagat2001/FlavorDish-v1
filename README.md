# 🍕 FlavorFinder - Food Delivery & Restaurant Booking Platform

**A complete Zomato-like platform for Ahmedabad**

---

## 🚀 Quick Start

### 1. Configure the Frontend Environment
Create or adjust `.env` inside the `frontend/` directory (example):
```bash
VITE_API_URL=http://localhost:5001/api
```

### 2. Configure the Backend Environment
Create or adjust `.env` inside the `backend/server/` directory:
```bash
PORT=5001
MONGODB_URI=mongodb://localhost:27017/flavorfinder
JWT_SECRET=your_secret_key
# any other config...
```

### 3. Start MongoDB (Local)
Ensure you have MongoDB running locally:
```bash
mongod
```

### 4. Start the Application
Instead of bringing up frontend and backend separately, an integrated start script has been provided if using NPM workspaces at root:

To start the backend (Port 5001) manually:
```bash
cd backend/server
npm install
npm start
```

To start the frontend (Port 3000) manually:
```bash
cd frontend
npm install
npm run dev
```

Alternatively, open `frontend/START_APP.bat` if on Windows.

---

## 🔐 Accounts

| Role | Email | Password |
|------|-------|----------|
| 🍴 Customer | customer@demo.local | customer123 |
| 🏪 Restaurant | restaurant@demo.local | restaurant123 |
| 🚚 Delivery | driver@demo.local | driver123 |
| 👨‍💼 Admin | admin@demo.local | admin123 |
| 🛡️ Dedicated Admin Portal | Use `/adminLogin` route bypass |

---

## 📂 Active Project Structure

This project uses a clear workspace paradigm to separate logic securely:

```
flavorfinder/
├── backend/                  
│   ├── server/               # ⚡ ACTUAL SERVER: Express application
│   │   ├── controllers/      # 14 request handlers
│   │   ├── middleware/       # JWT and auth handlers
│   │   ├── models/           # 15 MongoDB data schemas 
│   │   ├── routes/           # 20+ API endpoint configurations 
│   │   └── package.json      # Backend dependencies & port configuration (5001)
├── frontend/                 # ⚡ ACTUAL CLIENT: React 19 + Vite app
│   ├── components/           # 52+ UI components
│   ├── services/             # API data wrappers / endpoints matching the backend routes
│   └── package.json          # Frontend dependencies & scripts
└── package.json              # Monorepo Workspace settings
```

> **Important Setup Note:** Duplicate root-level directories (`server`, `components`, `services`) have been safely identified as accidental out-of-place drafts and cleaned up. Always work out of `backend/server/` and `frontend/` respectfully. If you need any salvaged components, they are safely renamed under `.bak` files inside frontend!

---

## ✨ System Features
- **Role-Based Workflows**: Multi-tenant customer, delivery, restaurant, and admin panels.
- **Dedicated Administrative Backend**: A backdoor administrative system secured specifically at `/adminLogin`.
- **Geospatial & GPS Logistics**: Calculates exact distances to nearby restaurants via `LocationFilterServices`, tracking map layouts via Socket.io.
- **AI Analytics**: Intelligent search discovery integration.

**Status**: ✅ Architecture Cleaned | 📱 Feature Ready | ⚡ Optimized Performance
