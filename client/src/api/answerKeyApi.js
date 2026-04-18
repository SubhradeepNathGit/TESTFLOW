import api from './axiosInstance';

/** Get all answer keys for the institution */
export const getAnswerKeys = () => api.get('/answer-keys');

/** Upload a new answer key (Instructor only) */
export const uploadAnswerKey = (formData) => api.post('/answer-keys', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

/** Delete an answer key (Instructor only) */
export const deleteAnswerKey = (id) => api.delete(`/answer-keys/${id}`);
