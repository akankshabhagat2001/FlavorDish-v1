import express from 'express';
import { ContactQuery, FraudReport, JobApplication } from '../models/FormModels.js';

const router = express.Router();

// Ensure collections exist when the route is mounted
Promise.all([
    ContactQuery.createCollection(),
    FraudReport.createCollection(),
    JobApplication.createCollection()
]).catch(() => {
    // Collections may already exist or MongoDB may not support createCollection explicitly
});

// POST /api/forms/contact
router.post('/contact', async(req, res) => {
    try {
        const { name, email, phone, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Name, Email, and Message are required.' });
        }
        const query = new ContactQuery({ name, email, phone, message });
        await query.save();
        res.status(201).json({ success: true, message: 'Contact query submitted successfully' });
    } catch (error) {
        console.error('Error submitting contact query:', error);
        res.status(500).json({ error: 'Failed to submit query' });
    }
});

// POST /api/forms/report-fraud
router.post('/report-fraud', async(req, res) => {
    try {
        const { reportType, details, userId } = req.body;
        if (!reportType || !details) {
            return res.status(400).json({ error: 'Report type and details are required.' });
        }
        const report = new FraudReport({ reportType, details, userId });
        await report.save();
        res.status(201).json({ success: true, message: 'Fraud report submitted successfully' });
    } catch (error) {
        console.error('Error submitting fraud report:', error);
        res.status(500).json({ error: 'Failed to submit report' });
    }
});

// POST /api/forms/job-application
router.post('/job-application', async(req, res) => {
    try {
        const { role, name, email, resumeLink } = req.body;
        if (!role || !name || !email) {
            return res.status(400).json({ error: 'Role, Name, and Email are required.' });
        }
        const application = new JobApplication({ role, name, email, resumeLink });
        await application.save();
        res.status(201).json({ success: true, message: 'Job application submitted successfully' });
    } catch (error) {
        console.error('Error submitting job application:', error);
        res.status(500).json({ error: 'Failed to submit application' });
    }
});

export default router;
