
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

const email = process.argv[2];

async function makeAdmin() {
    try {
        if (!email) {
            console.log("Usage: node makeAdmin.js user@email.com");
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {
            console.log("User not found. Register the account first.");
            return;
        }

        user.role = "admin";
        await user.save();

        console.log(`${user.email} is now an admin!`);
    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

makeAdmin();
