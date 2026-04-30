import api from './axiosInstance';

/** Get all answer keys for the institution */
export const getAnswerKeys = () => api.get('/answer-keys');

/** Upload a new answer key (Instructor only) */
export const uploadAnswerKey = (formData) => api.post('/answer-keys', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

/** Archive (soft delete) an answer key (Instructor only) */
export const deleteAnswerKey = (id) => api.delete(`/answer-keys/${id}`);

/** Get archived answer keys */
export const getArchivedAnswerKeys = () => api.get('/answer-keys/archived');

/** Restore an answer key from archive */
export const restoreAnswerKey = (id) => api.patch(`/answer-keys/${id}/restore`);

/** Permanently delete an answer key */
export const permanentDeleteAnswerKey = (id) => api.delete(`/answer-keys/${id}/permanent`);
