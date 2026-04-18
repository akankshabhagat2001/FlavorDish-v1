# Requirements Document

## Introduction

This document defines the requirements for the FlavorFinder Admin Panel and Admin Dashboard — a secure, role-gated management interface built on top of the existing MERN stack (React + Node.js + Express + MongoDB). The feature provides platform administrators with full visibility and control over users, restaurants/food items, orders, and platform revenue, without disrupting any existing customer, restaurant-owner, or delivery-partner functionality.

The project already contains partial implementations (AdminLogin.tsx, AdminDashboard.tsx, adminController.js, admin.js routes, adminRoutes.js, and auth middleware). Requirements are written to formalise, complete, and extend those implementations consistently.

---

## Glossary

- **Admin_Panel**: The complete set of admin-facing pages, components, and API routes described in this document.
- **Admin_Login_Page**: The React page rendered at `/admin-login`, used exclusively for administrator authentication.
- **Admin_Dashboard**: The React page rendered at `/admin-dashboard`, containing all management sections.
- **Auth_Middleware**: The Express middleware (`authenticate`) that verifies a JWT token and attaches the decoded user to `req.user`.
- **Admin_Middleware**: The Express middleware (`requireAdmin` / `authorize('admin')`) that checks `req.user.role === 'admin'` and rejects non-admin requests.
- **JWT**: JSON Web Token used for stateless authentication; stored in `localStorage` on the client.
- **Protected_Route**: A React component that reads the JWT from `localStorage`, validates the admin role, and redirects unauthenticated or non-admin visitors to `/admin-login`.
- **Dashboard_Overview**: The summary section of the Admin_Dashboard showing aggregate platform statistics.
- **User_Management**: The Admin_Dashboard section for listing, searching, blocking/unblocking, and deleting user accounts.
- **Food_Management**: The Admin_Dashboard section for adding, editing, and deleting food items across all restaurants.
- **Order_Management**: The Admin_Dashboard section for viewing all orders and updating their status.
- **Admin_Profile**: The Admin_Dashboard section displaying the currently authenticated administrator's details.
- **Toast**: A transient, non-blocking UI notification shown after user actions (success, error, info).
- **Spinner**: A visual loading indicator displayed while async operations are in progress.
- **Pagination**: Client-side or server-side mechanism for splitting large data sets into discrete pages.

---

## Requirements

### Requirement 1: Admin Authentication — Role-Based Login

**User Story:** As a platform administrator, I want to log in with my email and password so that I can access the Admin_Panel securely.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/auth/login` with a valid email and password belonging to a user whose `role` field equals `"admin"`, THE Auth_Middleware SHALL generate a signed JWT containing the user's `id` and `role` and return it in the response body.
2. WHEN the Admin_Login_Page form is submitted with valid admin credentials, THE Admin_Login_Page SHALL store the returned JWT in `localStorage` under the key `"token"` and redirect the browser to `/admin-dashboard`.
3. WHEN the Admin_Login_Page form is submitted with credentials that do not match an admin user, THE Admin_Login_Page SHALL display an error message reading "Access Denied. Invalid credentials or not an admin." without redirecting.
4. WHILE the Admin_Login_Page form submission is in progress, THE Admin_Login_Page SHALL display a loading Spinner inside the submit button and disable the button to prevent duplicate submissions.
5. IF the login API call returns an HTTP error response, THEN THE Admin_Login_Page SHALL display the error message from the response body, or a fallback message of "Access Denied. Invalid credentials." if no message is present.
6. THE Admin_Login_Page SHALL be accessible only at the route `/admin-login` and SHALL NOT be linked from any existing customer-facing navigation component.

---

### Requirement 2: Admin Route Protection — Backend Middleware

**User Story:** As a platform administrator, I want all admin API endpoints to be protected so that only authenticated admins can access sensitive platform data.

#### Acceptance Criteria

1. WHEN a request arrives at any route under `/api/admin/*`, THE Auth_Middleware SHALL verify the `Authorization: Bearer <token>` header and reject requests with a missing or invalid token with HTTP 401.
2. WHEN a request passes JWT verification but the decoded user's `role` is not `"admin"`, THE Admin_Middleware SHALL reject the request with HTTP 403 and the message `"Access denied: Admins only"`.
3. THE Auth_Middleware SHALL support tokens issued with either `{ id }` or `{ userId }` payload shapes for backward compatibility with existing auth flows.
4. IF the JWT is expired or malformed, THEN THE Auth_Middleware SHALL return HTTP 401 with the message `"Invalid or expired token."`.

---

### Requirement 3: Admin Route Protection — Frontend Protected Route

**User Story:** As a platform administrator, I want the admin dashboard to be inaccessible to unauthenticated users or non-admin users so that sensitive management tools are not exposed.

#### Acceptance Criteria

1. WHEN a user navigates to `/admin-dashboard` without a valid JWT in `localStorage`, THE Protected_Route SHALL redirect the user to `/admin-login`.
2. WHEN a user navigates to `/admin-dashboard` with a JWT whose decoded `role` is not `"admin"`, THE Protected_Route SHALL redirect the user to `/admin-login` and display a Toast notification with the message "Unauthorized Access".
3. WHEN a valid admin JWT is present in `localStorage`, THE Protected_Route SHALL render the Admin_Dashboard without redirection.
4. THE Protected_Route SHALL decode the JWT stored in `localStorage` client-side to check the `role` claim without making an additional API call.

---

### Requirement 4: Dashboard Overview

**User Story:** As a platform administrator, I want to see aggregate platform statistics on the dashboard so that I can monitor the health of the FlavorFinder platform at a glance.

#### Acceptance Criteria

1. WHEN the Admin_Dashboard loads the Overview section, THE Admin_Dashboard SHALL fetch statistics from `GET /api/admin/stats` and display: Total Users, Total Orders, Total Active Restaurants, and Total Revenue (paid orders only).
2. WHILE the statistics fetch is in progress, THE Admin_Dashboard SHALL display a Spinner in place of each statistic card.
3. IF the statistics fetch fails, THEN THE Admin_Dashboard SHALL display a Toast notification with the message "Failed to load dashboard statistics." and show zero values in the statistic cards.
4. THE Admin_Dashboard SHALL display a revenue trend line chart for the last 30 days, a user-role distribution pie chart, and an order-status distribution bar chart, all derived from the fetched data.
5. WHEN the admin clicks a sidebar navigation item, THE Admin_Dashboard SHALL update the active section without a full page reload.

---

### Requirement 5: User Management

**User Story:** As a platform administrator, I want to view, search, block/unblock, and delete user accounts so that I can govern platform membership.

#### Acceptance Criteria

1. WHEN the admin navigates to the User Management section, THE Admin_Dashboard SHALL fetch users from `GET /api/admin/users` with default pagination of page 1, limit 20, and display them in a table showing name, email, role, status, and join date.
2. WHEN the admin types in the search field, THE Admin_Dashboard SHALL filter the displayed user list to entries whose name or email contains the search string, with filtering applied within 300 ms of the last keystroke.
3. WHEN the admin clicks the Block button for an active user, THE Admin_Dashboard SHALL call `PUT /api/admin/users/:id/status` with `{ isActive: false }`, update the user's status in the table, and display a success Toast.
4. WHEN the admin clicks the Unblock button for an inactive user, THE Admin_Dashboard SHALL call `PUT /api/admin/users/:id/status` with `{ isActive: true }`, update the user's status in the table, and display a success Toast.
5. WHEN the admin clicks the Delete button for a non-admin user, THE Admin_Dashboard SHALL display a confirmation dialog, and upon confirmation call `DELETE /api/admin/users/:id`, remove the user from the table, and display a success Toast.
6. IF a delete or status-update API call fails, THEN THE Admin_Dashboard SHALL display an error Toast with the message returned by the API, or "Operation failed. Please try again." if no message is present.
7. THE Admin_Dashboard SHALL support Pagination for the user list, displaying navigation controls when the total user count exceeds the page limit.
8. THE Backend SHALL reject `DELETE /api/admin/users/:id` with HTTP 400 and the message "Cannot delete admin users." when the target user's role is `"admin"`.

---

### Requirement 6: Food / Restaurant Management

**User Story:** As a platform administrator, I want to add, edit, and delete food items across all restaurants so that I can maintain accurate menu data on the platform.

#### Acceptance Criteria

1. WHEN the admin navigates to the Food Management section, THE Admin_Dashboard SHALL fetch food items from `GET /api/food` and display them in a list showing name, category, price, restaurant name, and availability status.
2. WHEN the admin submits the Add Food form with valid data (name, price, category, restaurant ID), THE Admin_Dashboard SHALL call `POST /api/food` with the form data, add the new item to the list, and display a success Toast.
3. WHEN the admin submits the Edit Food form for an existing item, THE Admin_Dashboard SHALL call `PUT /api/food/:id` with the updated data, update the item in the list, and display a success Toast.
4. WHEN the admin clicks Delete for a food item and confirms the action, THE Admin_Dashboard SHALL call `DELETE /api/food/:id`, remove the item from the list, and display a success Toast.
5. IF any food management API call fails, THEN THE Admin_Dashboard SHALL display an error Toast with the API error message or "Operation failed. Please try again."
6. THE Admin_Dashboard SHALL support Pagination for the food item list when the total count exceeds 20 items per page.

---

### Requirement 7: Order Management

**User Story:** As a platform administrator, I want to view all orders and update their status so that I can resolve issues and track platform operations.

#### Acceptance Criteria

1. WHEN the admin navigates to the Order Management section, THE Admin_Dashboard SHALL fetch orders from `GET /api/admin/orders` with default pagination of page 1, limit 20, and display them in a table showing order number, customer name, restaurant name, total amount, current status, and order date.
2. WHEN the admin selects a new status from the status dropdown for an order, THE Admin_Dashboard SHALL call `PUT /api/admin/orders/:id/status` with the selected status, update the order's status in the table, and display a success Toast.
3. THE Backend SHALL accept only the following values for order status updates: `placed`, `confirmed`, `preparing`, `ready`, `picked_up`, `delivered`, `cancelled`; any other value SHALL be rejected with HTTP 400.
4. WHEN the admin filters orders by status using the filter control, THE Admin_Dashboard SHALL re-fetch orders from the API with the selected status as a query parameter and update the displayed list.
5. THE Admin_Dashboard SHALL support Pagination for the order list, displaying navigation controls when the total order count exceeds the page limit.
6. IF an order status update API call fails, THEN THE Admin_Dashboard SHALL display an error Toast with the API error message or "Failed to update order status."

---

### Requirement 8: Admin Profile

**User Story:** As a platform administrator, I want to view my admin account details within the dashboard so that I can confirm my identity and session information.

#### Acceptance Criteria

1. WHEN the admin navigates to the Admin Profile section, THE Admin_Dashboard SHALL decode the JWT from `localStorage` and display the admin's name, email, and role without making an additional API call.
2. THE Admin_Dashboard SHALL display the admin's role as "Administrator" in the profile section.
3. WHEN the admin clicks the Logout button in the sidebar or profile section, THE Admin_Dashboard SHALL remove the JWT from `localStorage` and redirect the browser to `/admin-login`.

---

### Requirement 9: Toast Notifications

**User Story:** As a platform administrator, I want to receive immediate feedback after every action so that I know whether operations succeeded or failed.

#### Acceptance Criteria

1. WHEN any admin action (login, user block/unblock/delete, food add/edit/delete, order status update) completes successfully, THE Admin_Dashboard SHALL display a success Toast for 3 seconds before automatically dismissing it.
2. WHEN any admin action fails due to an API error, THE Admin_Dashboard SHALL display an error Toast for 5 seconds before automatically dismissing it.
3. THE Admin_Dashboard SHALL support displaying multiple simultaneous Toast notifications stacked vertically without overlapping.
4. WHEN a Toast is displayed, THE Admin_Dashboard SHALL allow the admin to manually dismiss it by clicking a close button on the Toast.

---

### Requirement 10: Loading Spinners

**User Story:** As a platform administrator, I want visual feedback during data loading so that I know the application is working and not frozen.

#### Acceptance Criteria

1. WHILE any section's data fetch is in progress, THE Admin_Dashboard SHALL display a Spinner in the content area of that section.
2. WHILE a form submission (add/edit food, update order status, block/delete user) is in progress, THE Admin_Dashboard SHALL disable the submit button and display a Spinner inside it.
3. WHEN the data fetch completes (success or failure), THE Admin_Dashboard SHALL remove the Spinner and render the appropriate content or error state.

---

### Requirement 11: Non-Regression — Existing UI Preservation

**User Story:** As a FlavorFinder developer, I want the Admin_Panel additions to be isolated so that existing customer, restaurant-owner, and delivery-partner interfaces are not broken.

#### Acceptance Criteria

1. THE Admin_Panel SHALL add new routes (`/admin-login`, `/admin-dashboard`) to the React Router configuration without modifying or removing any existing route definitions.
2. THE Admin_Panel SHALL NOT modify the existing `Header`, `Hero`, `Footer`, or any other shared customer-facing component.
3. THE Admin_Panel backend routes SHALL be mounted exclusively under `/api/admin/*` and SHALL NOT alter any existing route handlers under `/api/auth`, `/api/users`, `/api/restaurants`, `/api/food`, or `/api/orders`.
4. THE Admin_Panel SHALL reuse the existing `authenticate` and `authorize`/`requireAdmin` middleware from `backend/server/middleware/auth.js` without duplicating or replacing them.
5. THE Admin_Panel frontend components SHALL be self-contained and SHALL NOT introduce global CSS changes that affect existing component styles.
