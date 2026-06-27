const Attempt = require("../models/Attempt");
const Test = require("../models/Test");
const Question = require("../models/Question");
const ErrorResponse = require("../utils/errorResponse");
const { scheduleAutoSubmit, cancelAutoSubmit } = require("../config/redis");

// Start attempt
exports.startAttempt = async (testId, studentId, institutionId) => {
    const test = await Test.findById(testId);
    if (!test || test.status !== "Published") {
        throw new ErrorResponse("Test not available", 404);
    }

    // Check existing
    let attempt = await Attempt.findOne({ testId, studentId });
    if (attempt) {
        if (attempt.status === "IN_PROGRESS") return attempt;
        throw new ErrorResponse("Test already completed", 403);
    }

    const expiresAt = new Date(Date.now() + test.duration * 60 * 1000);
    
    const attemptData = {
        testId,
        studentId,
        institutionId,
        expiresAt // Global fallback
    };

    if (test.isStrictSectionMode && test.sectionDurations?.length > 0) {
        attemptData.currentSectionIndex = 0;
        attemptData.currentSectionStatus = 'LOBBY';
        // We do NOT set sectionExpiresAt yet
    }

    attempt = await Attempt.create(attemptData);

    // Queue auto-submit for the whole test if not strict mode
    // (If strict mode, we'll let frontend handle section transitions, and fallback to global expiry)
    if (!test.isStrictSectionMode) {
        const delay = test.duration * 60 * 1000;
        await scheduleAutoSubmit(attempt._id, delay);
    }

    return attempt;
};

// Save answer
exports.saveAnswer = async (attemptId, studentId, questionId, selectedOption) => {
    const attempt = await Attempt.findOne({ _id: attemptId, studentId, status: "IN_PROGRESS" });
    if (!attempt) throw new ErrorResponse("Attempt not found", 404);

    if (new Date() > attempt.expiresAt) {
        throw new ErrorResponse("Time expired", 403);
    }
    
    if (attempt.sectionExpiresAt && new Date() > attempt.sectionExpiresAt) {
        throw new ErrorResponse("Section time expired", 403);
    }

    const answerIndex = attempt.answers.findIndex(a => a.questionId.toString() === questionId);
    if (answerIndex > -1) {
        attempt.answers[answerIndex].selectedOption = selectedOption;
    } else {
        attempt.answers.push({ questionId, selectedOption });
    }

    await attempt.save();
    return attempt;
};

// Manual submit
exports.submitAttempt = async (attemptId, studentId) => {
    const attempt = await Attempt.findOne({ _id: attemptId, studentId, status: "IN_PROGRESS" });
    if (!attempt) throw new ErrorResponse("Attempt not found", 404);

    attempt.status = "SUBMITTED";
    attempt.submittedAt = new Date();

    const test = await Test.findById(attempt.testId);
    const questions = await Question.find({ testId: attempt.testId });

    // Cancel auto-submit
    await cancelAutoSubmit(attempt._id);

    let score = 0;
    const sectionScores = {};

    attempt.answers.forEach(ans => {
        const q = questions.find(qu => qu._id.toString() === ans.questionId.toString());
        if (q && q.correctAnswer === ans.selectedOption) {
            score += q.marks;
            const sec = q.section || 'General';
            sectionScores[sec] = (sectionScores[sec] || 0) + q.marks;
        }
    });

    attempt.score = score;
    attempt.sectionScores = sectionScores;
    await attempt.save();
    return attempt;
};

// Next Section (moves to LOBBY)
exports.nextSection = async (attemptId, studentId) => {
    const attempt = await Attempt.findOne({ _id: attemptId, studentId, status: "IN_PROGRESS" });
    if (!attempt) throw new ErrorResponse("Attempt not found", 404);

    const test = await Test.findById(attempt.testId);
    if (!test.isStrictSectionMode) throw new ErrorResponse("Not a strict section test", 400);

    const nextIndex = attempt.currentSectionIndex + 1;
    if (nextIndex >= test.sectionDurations.length) {
        // Last section finished -> Submit Test
        return await exports.submitAttempt(attemptId, studentId);
    }

    attempt.currentSectionIndex = nextIndex;
    attempt.currentSectionStatus = 'LOBBY';
    attempt.sectionExpiresAt = null; // Clear timer
    await attempt.save();

    return attempt;
};

// Start Section (moves from LOBBY to IN_PROGRESS)
exports.startSection = async (attemptId, studentId) => {
    const attempt = await Attempt.findOne({ _id: attemptId, studentId, status: "IN_PROGRESS" });
    if (!attempt) throw new ErrorResponse("Attempt not found", 404);

    if (attempt.currentSectionStatus !== 'LOBBY') {
        throw new ErrorResponse("Section is already in progress or completed", 400);
    }

    const test = await Test.findById(attempt.testId);
    
    attempt.currentSectionStatus = 'IN_PROGRESS';
    attempt.sectionExpiresAt = new Date(Date.now() + test.sectionDurations[attempt.currentSectionIndex].duration * 60 * 1000);
    await attempt.save();

    return attempt;
};


// Reset attempt (Instructor Only)
exports.resetAttempt = async (attemptId, instructorId) => {
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) throw new ErrorResponse("Attempt not found", 404);

    // Auth check
    const instructor = await require("../models/User").findById(instructorId);
    if (!instructor) throw new ErrorResponse("Instructor not found", 404);
    
    if (instructor.role !== "super_admin") {
        const attemptInstId = attempt.institutionId ? attempt.institutionId.toString() : null;
        const instructorInstId = instructor.institutionId ? instructor.institutionId.toString() : null;

        if (!attemptInstId || !instructorInstId || attemptInstId !== instructorInstId) {
            throw new ErrorResponse("Unauthorized", 403);
        }
    }

    // Clean up queue
    await cancelAutoSubmit(attempt._id);
    
    // Delete
    await Attempt.findByIdAndDelete(attemptId);

    return { message: "Attempt reset" };
};
