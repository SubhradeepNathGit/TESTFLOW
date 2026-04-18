const Attempt = require("../models/Attempt");
const Test = require("../models/Test");
const Question = require("../models/Question");
const ErrorResponse = require("../utils/errorResponse");
const { scheduleAutoSubmit, cancelAutoSubmit } = require("../config/redis");

/**
 * Start a new test attempt
 */
exports.startAttempt = async (testId, studentId, institutionId) => {
    const test = await Test.findById(testId);
    if (!test || test.status !== "Published") {
        throw new ErrorResponse("Test is not available", 404);
    }

    // Check if attempt already exists
    let attempt = await Attempt.findOne({ testId, studentId });
    if (attempt) {
        if (attempt.status === "IN_PROGRESS") return attempt;
        throw new ErrorResponse("You have already completed this test.", 403);
    }

    const expiresAt = new Date(Date.now() + test.duration * 60 * 1000);

    attempt = await Attempt.create({
        testId,
        studentId,
        institutionId,
        expiresAt
    });

    // Schedule auto-submission
    const delay = test.duration * 60 * 1000;
    await scheduleAutoSubmit(attempt._id, delay);

    return attempt;
};

/**
 * Save an answer during the test
 */
exports.saveAnswer = async (attemptId, studentId, questionId, selectedOption) => {
    const attempt = await Attempt.findOne({ _id: attemptId, studentId, status: "IN_PROGRESS" });
    if (!attempt) throw new ErrorResponse("Attempt not found or already submitted", 404);

    if (new Date() > attempt.expiresAt) {
        throw new ErrorResponse("Time has expired. Please submit.", 403);
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

/**
 * Manually submit a test
 */
exports.submitAttempt = async (attemptId, studentId) => {
    const attempt = await Attempt.findOne({ _id: attemptId, studentId, status: "IN_PROGRESS" });
    if (!attempt) throw new ErrorResponse("Attempt not found or already submitted", 404);

    const questions = await Question.find({ testId: attempt.testId });
    
    let score = 0;
    attempt.answers.forEach(ans => {
        const question = questions.find(q => q._id.toString() === ans.questionId.toString());
        if (question && question.correctAnswer === ans.selectedOption) {
            score += (question.marks || 1);
        }
    });

    attempt.score = score;
    attempt.status = "SUBMITTED";
    attempt.submittedAt = new Date();
    await attempt.save();

    // Cancel the scheduled auto-submission
    await cancelAutoSubmit(attempt._id);

    return attempt;
};

/**
 * Reset a student's attempt (Instructor Only)
 */
exports.resetAttempt = async (attemptId, instructorId) => {
    // Audit logging could be added here
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) throw new ErrorResponse("Attempt not found", 404);

    // Ensure instructor belongs to the same institution
    const instructor = await require("../models/User").findById(instructorId);
    if (attempt.institutionId.toString() !== instructor.institutionId.toString()) {
        throw new ErrorResponse("Not authorized to reset this attempt", 403);
    }

    // Remove from Redis queue if pending
    await cancelAutoSubmit(attempt._id);
    
    // Delete the attempt
    await Attempt.findByIdAndDelete(attemptId);

    return { message: "Attempt reset successfully. Student can retake the test." };
};
