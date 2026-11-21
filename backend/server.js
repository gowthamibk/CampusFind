const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
    res.json({
        message: "CampusFind Backend API is running!"
    });
});

// Test route
app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "CampusFind API is working successfully!"
    });
});

// Database status
app.get("/api/db-status", (req, res) => {
    res.json({
        connected: mongoose.connection.readyState === 1,
        database: mongoose.connection.name
    });
});

// Authentication routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// Item routes
const itemRoutes = require("./routes/itemRoutes");
app.use("/api/items", itemRoutes);

// Claim routes
const claimRoutes = require("./routes/claimRoutes");
app.use("/api/claims", claimRoutes);

// Admin routes
const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

// Notification routes
const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);

// Statistics routes
const statsRoutes = require("./routes/statsRoutes");
app.use("/api/stats", statsRoutes);

// Database connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully!");

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(`CampusFind server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
    });