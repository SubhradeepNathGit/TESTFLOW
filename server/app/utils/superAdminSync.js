const User = require("../models/User");
const bcrypt = require("bcryptjs");

/**
 * Ensures the Super Admin in the database matches the .env configuration.
 * This runs on every server startup to keep credentials in sync with the environment.
 */
const syncSuperAdmin = async () => {
    try {
        const adminEmail = process.env.SUPER_ADMIN_EMAIL;
        const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            console.warn("⚠️  SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not found in .env. Skipping sync.");
            return;
        }

        // Find existing super_admin
        let admin = await User.findOne({ role: "super_admin" }).select("+password");

        if (!admin) {
            // Create if not exists
            console.log("🛠️  No Super Admin found. Creating from .env...");
            await User.create({
                name: "Platform Administrator",
                email: adminEmail,
                password: adminPassword,
                role: "super_admin",
                isVerified: true,
                isActive: true
            });
            console.log(`✅ Super Admin created with email: ${adminEmail}`);
        } else {
            // Check for changes
            const isEmailDifferent = admin.email !== adminEmail;
            const isPasswordDifferent = !(await bcrypt.compare(adminPassword, admin.password));

            if (isEmailDifferent || isPasswordDifferent) {
                console.log("🔄  Super Admin credentials in .env differ from database. Synchronizing...");
                
                if (isEmailDifferent) admin.email = adminEmail;
                if (isPasswordDifferent) admin.password = adminPassword; // Pre-save hook will hash this

                await admin.save();
                console.log("✅ Super Admin synchronized with .env successfully.");
            } else {
                // console.log("✨  Super Admin credentials are in sync with .env.");
            }
        }
    } catch (err) {
        console.error("❌  Failed to synchronize Super Admin:", err.message);
    }
};

module.exports = syncSuperAdmin;
