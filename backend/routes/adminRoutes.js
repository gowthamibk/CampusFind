const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/User");
const Item = require("../models/Item");
const Claim = require("../models/Claim");
const Notification = require("../models/Notification");
const adminMiddleware = require("../adminMiddleware");

const router = express.Router();


// ===============================
// GET ALL USERS
// ===============================
router.get("/users", adminMiddleware, async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 });

        res.json(users);

    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve users",
            error: error.message
        });
    }
});


// ===============================
// GET ALL ITEMS
// ===============================
router.get("/items", adminMiddleware, async (req, res) => {
    try {
        const items = await Item.find()
            .populate("reportedBy", "name email")
            .sort({ createdAt: -1 });

        res.json(items);

    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve items",
            error: error.message
        });
    }
});


// ===============================
// DELETE ANY ITEM (ADMIN)
// ===============================
router.delete("/items/:id", adminMiddleware, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid item ID"
            });
        }

        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                message: "Item not found"
            });
        }

        // Find all claims associated with this item
        const claims = await Claim.find({ item: item._id }).select("_id");

        const claimIds = claims.map(claim => claim._id);

        // Delete notifications associated with this item or its claims
        await Notification.deleteMany({
            $or: [
                { relatedItem: item._id },
                { relatedClaim: { $in: claimIds } }
            ]
        });

        // Remove associated claims
        await Claim.deleteMany({ item: item._id });

        // Remove the item
        await Item.findByIdAndDelete(item._id);

        res.json({
            message: "Item report removed successfully by admin"
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to delete item",
            error: error.message
        });
    }
});


// ===============================
// GET ALL CLAIMS (ADMIN)
// ===============================
router.get("/claims", adminMiddleware, async (req, res) => {
    try {
        const claims = await Claim.find()
            .populate("item")
            .populate("claimedBy", "name email")
            .sort({ createdAt: -1 });

        res.json(claims);

    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve claims",
            error: error.message
        });
    }
});


module.exports = router;