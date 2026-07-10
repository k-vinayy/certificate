import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // Uploads
  uploadTemplate: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload-template', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  uploadSignature: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload-signature', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  uploadFont: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload-font', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  uploadExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Config
  getConfig: () => api.get('/config'),
  updateConfig: (config) => api.post('/config', config),

  // Generation
  generatePreview: (eventDate) => api.post('/preview', { event_date: eventDate, participants: [] }),
  generateCertificates: (eventDate, participants) => 
    api.post('/generate', { event_date: eventDate, participants }),

  // Mailing
  getSmtpConfig: () => api.get('/smtp-config'),
  saveSmtpConfig: (config) => api.post('/smtp-config', config),
  sendMails: (retryFailedOnly = false) => api.post('/send-mails', { retry_failed_only: retryFailedOnly }),
  getSendStatus: () => api.get('/send-status'),

  // History & Downloads
  getHistory: () => api.get('/history'),
  resendMail: (email) => api.post(`/resend/${encodeURIComponent(email)}`),
  downloadZipUrl: () => `${API_BASE}/download-zip`,
  downloadPdfUrl: (filename) => `${API_BASE}/download/${encodeURIComponent(filename)}`,
};

export default api;
