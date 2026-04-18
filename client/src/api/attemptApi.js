import api from './axiosInstance';

/** Start an attempt for a test */
export const startAttempt = (testId) => api.post('/attempts/start', { testId });

/** Save an answer during the test */
export const saveAnswer = (attemptId, questionId, selectedOption) =>
    api.post('/attempts/save-answer', { attemptId, questionId, selectedOption });

/** Submit the test attempt */
export const submitAttempt = (attemptId) => api.post('/attempts/submit', { attemptId });

/** Reset a student's attempt (Instructor only) */
export const resetAttempt = (attemptId) => api.delete(`/attempts/${attemptId}/reset`);

/** Get current student's own attempts */
export const getMyAttempts = () => api.get('/attempts/me');
