const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Sync Super Admin with .env
const syncSuperAdmin = async () => {
    try {
        const adminEmail = process.env.SUPER_ADMIN_EMAIL;
        const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            console.warn("Super Admin env missing. Skipping sync.");
            return;
        }

        // Check for super_admin
        let admin = await User.findOne({ role: "super_admin" }).select("+password");

        if (!admin) {
            // Create admin
            console.log("No Super Admin. Creating from env...");
            await User.create({
                name: "Platform Administrator",
                email: adminEmail,
                password: adminPassword,
                role: "super_admin",
                isVerified: true,
                isActive: true
            });
        } else {
            // Sync credentials
            const isEmailDifferent = admin.email !== adminEmail;
            const isPasswordDifferent = !(await bcrypt.compare(adminPassword, admin.password));

            if (isEmailDifferent || isPasswordDifferent) {
                console.log("Syncing Super Admin...");
                
                if (isEmailDifferent) admin.email = adminEmail;
                if (isPasswordDifferent) admin.password = adminPassword;

                await admin.save();
                console.log("Super Admin synced.");
            }
        }
    } catch (err) {
        console.error("Super Admin sync error:", err.message);
    }
};

module.exports = syncSuperAdmin;
