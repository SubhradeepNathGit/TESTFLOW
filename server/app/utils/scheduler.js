const cron = require("node-cron");
const Task = require("../models/Task");
const { sendTaskReminderEmail } = require("./emailService");

// Init schedulers
const initSchedulers = () => {
    // Task reminders at 9 AM daily
    cron.schedule("0 9 * * *", async () => {
        console.log("Running Task Reminders...");
        
        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            // Tasks due within 24h
            const tasksDueSoon = await Task.find({
                status: { $ne: "Completed" },
                isDeleted: false,
                dueDate: { 
                    $gte: new Date(),
                    $lte: tomorrow
                }
            }).populate("assignedTo", "name email");

            console.log(`Found ${tasksDueSoon.length} tasks.`);

            for (const task of tasksDueSoon) {
                if (task.assignedTo?.email) {
                    await sendTaskReminderEmail({
                        to: task.assignedTo.email,
                        userName: task.assignedTo.name,
                        taskTitle: task.title,
                        dueDate: task.dueDate
                    });
                }
            }
        } catch (err) {
            console.error("Scheduler error:", err);
        }
    });

    console.log("Schedulers started.");
};

module.exports = { initSchedulers };
