import api from './axiosInstance';

// Get all tests
export const getTests = () => api.get('/tests');

// Get test details
export const getTest = (id) => api.get(`/tests/${id}`);

// Upload PDF
export const uploadPdfTest = (formData) =>
    api.post('/tests/upload-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });

// Create test
export const createTest = (testData) => api.post('/tests', testData);

// Add question
export const addQuestion = (id, questionData) => api.post(`/tests/${id}/questions`, questionData);

// Publish test
export const publishTest = (id) => api.patch(`/tests/${id}/publish`);

// Test stats
export const getTestStats = (id) => api.get(`/tests/${id}/stats`);

// Global leaderboard
export const getLeaderboard = () => api.get('/tests/leaderboard');

// Get archived
export const getArchivedTests = () => api.get('/tests/archived/all');

// Archive test
export const archiveTest = (id) => api.delete(`/tests/${id}`);

// Restore test
export const restoreTest = (id) => api.patch(`/tests/${id}/restore`);

// Permanent delete
export const permanentDeleteTest = (id) => api.delete(`/tests/${id}/permanent`);

// Update question
export const updateQuestion = (questionId, questionData) => 
    api.patch(`/tests/questions/${questionId}`, questionData);

// Delete question
export const deleteQuestion = (questionId) => 
    api.delete(`/tests/questions/${questionId}`);
