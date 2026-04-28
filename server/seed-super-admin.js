const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./app/models/User');


dotenv.config({ path: path.join(__dirname, '.env') });

const seedSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        
        const email = process.env.SUPER_ADMIN_EMAIL || 'subhradeepnath2.o@gmail.com';
        const password = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123';

        const adminData = {
            name: 'Super Admin',
            email: email.toLowerCase().trim(),
            password: password,
            role: 'super_admin',
            isActive: true,
            isVerified: true
        };

        // Delete existing and re-create
        await User.deleteMany({ role: 'super_admin' });
        await User.create(adminData);

        console.log('✅ SUPER ADMIN SEEDED SUCCESSFULLY');
        console.log(`📧 EMAIL: ${email}`);
        console.log(`🔑 PASSWORD: ${password}`);
        
        // --- SELF-TEST ---
        const bcrypt = require('bcryptjs');
        const testUser = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
        const isMatch = await bcrypt.compare(password, testUser.password);
        
        if (isMatch) {
            console.log('🏁 SELF-TEST: ✅ Password matches hash correctly!');
        } else {
            console.log('🏁 SELF-TEST: ❌ ERROR! Password does NOT match hash!');
        }
        console.log('------------------------------------');
        process.exit(0);
    } catch (error) {
        console.error('Failed to seed Super Admin:', error);
        process.exit(1);
    }
};

seedSuperAdmin();
