import api from './axiosInstance';

// Get answer keys
export const getAnswerKeys = () => api.get('/answer-keys');

// Upload key
export const uploadAnswerKey = (formData) => api.post('/answer-keys', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

// Delete key
export const deleteAnswerKey = (id) => api.delete(`/answer-keys/${id}`);

// Get archived
export const getArchivedAnswerKeys = () => api.get('/answer-keys/archived');

// Restore key
export const restoreAnswerKey = (id) => api.patch(`/answer-keys/${id}/restore`);

// Permanent delete
export const permanentDeleteAnswerKey = (id) => api.delete(`/answer-keys/${id}/permanent`);
