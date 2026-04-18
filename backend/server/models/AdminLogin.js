import mongoose from 'mongoose';

const AdminLoginSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Create Model
const AdminLogin = mongoose.model(
    'AdminLogin',
    AdminLoginSchema,
    'admin_login'
);

// ✅ Export as default (IMPORTANT)
export default AdminLogin;