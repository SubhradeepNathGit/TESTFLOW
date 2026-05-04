const AuditLog = require("../models/AuditLog");

// Log system activity
exports.createLog = async (data) => {
    try {
        const logData = {
            action: data.action,
            user: data.userId,
            details: data.details,
            target: data.target,
            targetId: data.targetId,
            institutionId: data.institutionId
        };

        if (data.req) {
            logData.ipAddress = data.req.ip;
            logData.userAgent = data.req.headers['user-agent'];
        }

        // Background create to save time
        AuditLog.create(logData).catch(err => console.error("Audit log error:", err));
    } catch (err) {
        console.error("Audit helper error:", err);
    }
};
