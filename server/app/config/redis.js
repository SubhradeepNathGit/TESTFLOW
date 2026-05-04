const { Queue, Worker, QueueEvents } = require("bullmq");
const IORedis = require("ioredis");

// Redis config
const redisConnection = new IORedis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false, // Don't queue if Redis is down
    connectTimeout: 500,       // Fail fast
    retryStrategy(times) {
        if (times > 1) {
            console.warn("Redis not found. Auto-submit disabled.");
            return null;
        }
        return 100;
    }
});

redisConnection.on('error', () => {}); // Suppress errors

// Submission queue
const submissionQueue = new Queue("test-submission", {
    connection: redisConnection,
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false
    }
});

submissionQueue.on('error', () => {});

// Schedule auto-submit
const scheduleAutoSubmit = async (attemptId, delay) => {
    await submissionQueue.add(
        "auto-submit",
        { attemptId },
        { delay, jobId: `submit-${attemptId}` }
    );
};

// Cancel auto-submit
const cancelAutoSubmit = async (attemptId) => {
    const job = await submissionQueue.getJob(`submit-${attemptId}`);
    if (job) await job.remove();
};

module.exports = { submissionQueue, redisConnection, scheduleAutoSubmit, cancelAutoSubmit };
