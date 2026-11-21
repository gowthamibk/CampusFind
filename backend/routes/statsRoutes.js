const express = require("express");
const router = express.Router();

const Item = require("../models/Item");
const Claim = require("../models/Claim");

// GET CAMPUS STATISTICS
router.get("/", async (req, res) => {
    try {
        const [
            totalLost,
            totalFound,
            totalRecovered,
            pendingClaims,
            totalClaims,
            recentItems
        ] = await Promise.all([
            Item.countDocuments({ type: "lost" }),
            Item.countDocuments({ type: "found" }),
            Item.countDocuments({ status: "recovered" }),
            Claim.countDocuments({ status: "pending" }),
            Claim.countDocuments(),
            Item.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate("reportedBy", "name")
        ]);

        const totalItems = totalLost + totalFound;

        const recoveryRate = totalItems > 0
            ? Math.round((totalRecovered / totalItems) * 100)
            : 0;

        res.json({
            totalLost,
            totalFound,
            totalRecovered,
            pendingClaims,
            totalClaims,
            recoveryRate,
            recentItems
        });

    } catch (error) {
        console.error("Stats error:", error);

        res.status(500).json({
            message: "Failed to load statistics"
        });
    }
});

module.exports = router;