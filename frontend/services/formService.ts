import apiClient from './apiClient';

export const formService = {
  submitContactForm: async (data: { name: string; email: string; phone?: string; message: string }) => {
    try {
      const response = await apiClient.post('/forms/contact', data);
      return response.data;
    } catch (error) {
      console.error('Error submitting contact form:', error);
      throw error;
    }
  },

  submitFraudReport: async (data: { reportType: string; details: string; userId?: string }) => {
    try {
      const response = await apiClient.post('/forms/report-fraud', data);
      return response.data;
    } catch (error) {
      console.error('Error submitting fraud report:', error);
      throw error;
    }
  },

  submitJobApplication: async (data: { role: string; name: string; email: string; resumeLink?: string }) => {
    try {
      const response = await apiClient.post('/forms/job-application', data);
      return response.data;
    } catch (error) {
      console.error('Error submitting job application:', error);
      throw error;
    }
  }
};
