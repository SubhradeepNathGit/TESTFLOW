import api from './axiosInstance';

/** Get all tests for the institution (filters by Published for students) */
export const getTests = () => api.get('/tests');

/** Get single test with questions */
export const getTest = (id) => api.get(`/tests/${id}`);

/** Upload PDF to create a test */
export const uploadPdfTest = (formData) =>
    api.post('/tests/upload-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });

/** Create test manually (metadata only) */
export const createTest = (testData) => api.post('/tests', testData);

/** Add a question manually to a test */
export const addQuestion = (id, questionData) => api.post(`/tests/${id}/questions`, questionData);

/** Publish a test */
export const publishTest = (id) => api.patch(`/tests/${id}/publish`);

/** Get test stats for instructor */
export const getTestStats = (id) => api.get(`/tests/${id}/stats`);

/** Get global leaderboard */
export const getLeaderboard = () => api.get('/tests/leaderboard');

/** Get archived tests */
export const getArchivedTests = () => api.get('/tests/archived/all');

/** Archive a test */
export const archiveTest = (id) => api.delete(`/tests/${id}`);

/** Restore a test */
export const restoreTest = (id) => api.patch(`/tests/${id}/restore`);

/** Permanently delete test */
export const permanentDeleteTest = (id) => api.delete(`/tests/${id}/permanent`);

/** Update a question */
export const updateQuestion = (questionId, questionData) => 
    api.patch(`/tests/questions/${questionId}`, questionData);

/** Delete a question */
export const deleteQuestion = (questionId) => 
    api.delete(`/tests/questions/${questionId}`);
