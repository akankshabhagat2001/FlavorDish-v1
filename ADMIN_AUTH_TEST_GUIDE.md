# Admin Authentication & Dashboard Access Guide

## Folder Structure (Best Practice)

```
backend/
  server/
    controllers/
      authController.js
    middleware/
      auth.js
    models/
      User.js
    routes/
      auth.js
      users.js
frontend/
  services/
    authService.ts
  components/
    AdminDashboardComplete.tsx
    AdminLogin.tsx
```

## Example Admin Credentials

- Email: admin@gmail.com
- Password: (your chosen password, hashed in DB)
- Role: admin

To create manually in MongoDB:

```
db.users.insertOne({
  name: "Admin",
  email: "admin@gmail.com",
  password: <hashedPassword>,
  role: "admin",
  isActive: true
})
```

## How to Test (Step-by-Step)

1. **Start Backend & Frontend**
2. **Login as Admin**
   - Go to `/admin-login` page
   - Enter admin email & password
   - On success, token and user are saved in localStorage
3. **Dashboard Access**
   - You are redirected to `/admin/dashboard`
   - If not admin, you are redirected to login
4. **API Testing (Postman)**
   - POST `/auth/admin-login` with email/password
   - Response includes `{ token, user: { id, name, email, role } }`
   - Use token as `Authorization: Bearer <token>` for protected routes
5. **Check Role-Based Access**
   - Only users with `role: "admin"` can access admin dashboard and protected APIs
6. **Token Storage**
   - Check `localStorage` for `token` and `user` after login
7. **Logout**
   - Click logout, token/user are removed, redirected to login

## Security Best Practices

- Always hash passwords (bcrypt)
- Never expose password in API responses
- JWT token should include both `id` and `role`
- Use `Authorization: Bearer <token>` for all protected API calls
- Protect admin routes on both backend (middleware) and frontend (route guard)
- Never allow public registration of admin users
- Set strong JWT secret in environment variables
- Use HTTPS in production

## Troubleshooting

- If dashboard does not load: check token in localStorage, check user role, check API response
- If token expired: login again
- If CORS error: check backend CORS config
- If admin not found: create admin user in DB as above

---

**You can now securely login as admin and access the dashboard.**
