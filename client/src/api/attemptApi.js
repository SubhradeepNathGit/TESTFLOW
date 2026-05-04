import api from './axiosInstance';

// Start attempt
export const startAttempt = (testId) => api.post('/attempts/start', { testId });

// Save answer
export const saveAnswer = (attemptId, questionId, selectedOption) =>
    api.post('/attempts/save-answer', { attemptId, questionId, selectedOption });

// Submit attempt
export const submitAttempt = (attemptId) => api.post('/attempts/submit', { attemptId });

// Reset attempt (Instructor only)
export const resetAttempt = (attemptId) => api.delete(`/attempts/${attemptId}/reset`);

// My attempts
export const getMyAttempts = () => api.get('/attempts/me');
