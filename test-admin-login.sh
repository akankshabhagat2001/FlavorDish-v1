# Test admin login endpoint using curl
# Run this in your terminal (replace <PORT> if needed)
curl -X POST http://localhost:5000/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@gmail.com", "password": "admin123"}'
