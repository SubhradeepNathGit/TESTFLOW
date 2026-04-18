const { Worker } = require("bullmq");
const { redisConnection } = require("./redis");
const Attempt = require("../models/Attempt");
const Question = require("../models/Question");

/**
 * Worker to process auto-submissions when timer expires
 */
const submissionWorker = new Worker(
    "test-submission",
    async (job) => {
        const { attemptId } = job.data;
        
        const attempt = await Attempt.findById(attemptId);
        
        // Only auto-submit if still in progress
        if (attempt && attempt.status === "IN_PROGRESS") {
            const questions = await Question.find({ testId: attempt.testId });
            
            let score = 0;
            attempt.answers.forEach(ans => {
                const question = questions.find(q => q._id.toString() === ans.questionId.toString());
                if (question && question.correctAnswer === ans.selectedOption) {
                    score += (question.marks || 1);
                }
            });

            attempt.score = score;
            attempt.status = "AUTO_SUBMITTED";
            attempt.submittedAt = new Date();
            await attempt.save();
            
            console.log(`Auto-submitted attempt: ${attemptId}`);
        }
    },
    { connection: redisConnection }
);

submissionWorker.on("completed", (job) => {
    console.log(`Job ${job.id} completed successfully`);
});

submissionWorker.on("failed", (job, err) => {
    console.error(`Job ${job.id} failed: ${err.message}`);
});

submissionWorker.on("error", (err) => {
    // Suppress connection errors safely
});

module.exports = submissionWorker;
