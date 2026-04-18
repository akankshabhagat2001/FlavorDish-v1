# FlavorFinder RBAC & Frontend UI Testing Guide

This guide provides instructions for developers to verify the newly implemented Zomato/Swiggy-style Role-Based Access Control (RBAC) system and frontend enhancements.

## 1. Logo Verification
To test if the new image-based logos correctly replaced the text placeholders:

### Steps:
1. Ensure your custom logo image is saved exactly as: `frontend/images/logo.png`.
2. Start your frontend development server (`npm run dev`).
3. **Verify Header**: Navigate to the homepage. The logo should be visible in the top-left corner (Header).
4. **Verify Hero**: On the home page, the massive central logo should now be your image, replacing the italicized text. 
5. **Verify Auth**: Click "Login" and "Sign up" to inspect the Authentication walls. The logo should be centered above the credentials form.
6. **Verify Favicon**: Check the browser tab. The tab's small icon alongside the title should now be the new logo.

---

## 2. Testing Customer Signup Enforcement
The frontend no longer permits users to manually select admin or restaurant roles during public signup. All public registrations now force the "customer" role.

### Steps:
1. Navigate to the `Sign Up` module. Note that the "Register As" dropdown and "Restaurant Name" input are completely removed.
2. Fill out testing details and click **Register**.
3. Log into your MongoDB database cluster (via MongoDB Compass or Atlas).
4. Inspect the `users` collection.
5. Verify the newly created user object has the property: `role: "customer"`. Strict enforcement prevents tampering via frontend requests.

---

## 3. Testing Backend Role Validation
The system features isolated middlewares `authMiddleware.js` and `roleMiddleware.js` for security.

### Testing Protected Endpoints via API (Postman/cURL):
1. Use an active `customer` token to attempt accessing an admin route. Example request to an admin-only endpoint: `GET /api/admin/dashboard` or user list.
2. The endpoint should respond with `403 Forbidden` (`message: 'Forbidden. Insufficient permissions.'`).
3. Use a pre-existing `admin` token and send the exact same request. The system should grant access and return a 200 OK.

---

## 4. Frontend Route Protections
We have added `AdminRoute.tsx` and `PrivateRoute.tsx` for React Router usage. However, note that the core application strictly restricts UI components via state changes: `currentView` combined with the validated `currentUser.role`. 

### Steps:
1. Log in with a `customer` account. Verify that the Top-NavigationBar does **not** render the highly-privileged "Command Console" banner.
2. Log out and sign in using a dedicated `admin` account.
3. Verify that:
   - The purple "Command Console Active" banner is mounted at the top.
   - The user is automatically redirected to the Admin Dashboard upon logging in.
   - They have complete access to the metrics interface.

## Troubleshooting

- **Logo not loading**: Check if the file is truly named `logo.png` under `frontend/images/` and ensure there are no caching issues (Cmd/Ctrl + Shift + R).
- **Backend Auth Errors**: Ensure that `req.user.role` matches expected strings strictly ('admin' vs 'restaurant_owner'). We removed the alias translation (`restaurant` -> `restaurant_owner`) in the backend controller to enforce strict DB checks. Always create DB users with the literal string "restaurant_owner".
