import mongoose from 'mongoose';

const contactQuerySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const fraudReportSchema = new mongoose.Schema({
  reportType: { type: String, required: true },
  details: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'investigating', 'resolved'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const jobApplicationSchema = new mongoose.Schema({
  role: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  resumeLink: { type: String },
  status: { type: String, enum: ['submitted', 'reviewed', 'rejected', 'hired'], default: 'submitted' },
  createdAt: { type: Date, default: Date.now }
});

export const ContactQuery = mongoose.model('ContactQuery', contactQuerySchema);
export const FraudReport = mongoose.model('FraudReport', fraudReportSchema);
export const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);
