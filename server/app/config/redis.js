const { Queue, Worker, QueueEvents } = require("bullmq");
const IORedis = require("ioredis");

// Configure Redis Connection
const redisConnection = new IORedis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false, // Don't queue commands if Redis is down
    connectTimeout: 500,       // Fail fast if not found locally
    retryStrategy(times) {
        if (times > 1) {       // Reduce retries for local dev
            console.warn("⚠️ Redis not found. Auto-submit feature is disabled.");
            return null;
        }
        return 100;
    }
});

redisConnection.on('error', () => {
    // Suppress connection spam
});


// Create Submission Queue
const submissionQueue = new Queue("test-submission", {
    connection: redisConnection,
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false
    }
});

submissionQueue.on('error', () => {
    // Suppress connection spam
});

/**

 * Schedule an auto-submission job
 */
const scheduleAutoSubmit = async (attemptId, delay) => {
    await submissionQueue.add(
        "auto-submit",
        { attemptId },
        { delay, jobId: `submit-${attemptId}` }
    );
};

/**
 * Remove a scheduled auto-submission if user submits early
 */
const cancelAutoSubmit = async (attemptId) => {
    const job = await submissionQueue.getJob(`submit-${attemptId}`);
    if (job) await job.remove();
};

module.exports = { submissionQueue, redisConnection, scheduleAutoSubmit, cancelAutoSubmit };
