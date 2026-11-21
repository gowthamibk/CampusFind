const express = require("express");
const router = express.Router();

const Item = require("../models/Item");
const Claim = require("../models/Claim");
const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/authMiddleware");


// REPORT AN ITEM
router.post("/", authMiddleware, async (req, res) => {
    try {
        const {
            itemName,
            category,
            description,
            date,
            location,
            image,
            contact,
            type
        } = req.body;

        if (
            !itemName ||
            !category ||
            !description ||
            !date ||
            !location ||
            !contact ||
            !type
        ) {
            return res.status(400).json({
                message: "Please fill in all required fields"
            });
        }

        if (!["lost", "found"].includes(type)) {
            return res.status(400).json({
                message: "Invalid item type"
            });
        }

        const item = new Item({
            itemName,
            category,
            description,
            date,
            location,
            image: image || "",
            contact,
            type,
            reportedBy: req.user.id,
            status: "active"
        });

        await item.save();

        res.status(201).json({
            message: "Item reported successfully",
            item
        });

    } catch (error) {
        console.error("Report item error:", error);

        res.status(500).json({
            message: "Failed to report item",
            error: error.message
        });
    }
});


// GET ALL ITEMS
router.get("/", async (req, res) => {
    try {
        const items = await Item.find()
            .populate("reportedBy", "name email")
            .sort({ createdAt: -1 });

        res.json(items);

    } catch (error) {
        console.error("Fetch items error:", error);

        res.status(500).json({
            message: "Failed to fetch items",
            error: error.message
        });
    }
});


// GET MY ITEMS
router.get("/mine", authMiddleware, async (req, res) => {
    try {
        const items = await Item.find({
            reportedBy: req.user.id
        }).sort({ createdAt: -1 });

        res.json(items);

    } catch (error) {
        console.error("Fetch my items error:", error);

        res.status(500).json({
            message: "Failed to fetch your reports",
            error: error.message
        });
    }
});


// MARK ITEM AS RECOVERED
router.patch("/:id/recovered", authMiddleware, async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                message: "Item not found"
            });
        }

        // Only the original reporter can mark the item as recovered
        if (String(item.reportedBy) !== String(req.user.id)) {
            return res.status(403).json({
                message: "You are not authorized to update this item"
            });
        }

        // Found items must have an approved claim
        if (item.type === "found" && item.status !== "claimed") {
            return res.status(400).json({
                message: "A found item must have an approved claim before confirming its return"
            });
        }

        if (item.status === "recovered") {
            return res.status(400).json({
                message: "This item is already marked as recovered"
            });
        }

        item.status = "recovered";
        await item.save();

        // Notify the approved claimant for found items
        if (item.type === "found") {
            const approvedClaim = await Claim.findOne({
                item: item._id,
                status: "approved"
            });

            if (approvedClaim) {
                await Notification.create({
                    recipient: approvedClaim.claimedBy,
                    message: `The item "${item.itemName}" has been marked as recovered.`,
                    type: "item_recovered",
                    relatedItem: item._id,
                    relatedClaim: approvedClaim._id
                });
            }
        }

        // Notify the reporter for lost items
        if (item.type === "lost") {
            await Notification.create({
                recipient: item.reportedBy,
                message: `Your lost item "${item.itemName}" has been marked as recovered.`,
                type: "item_recovered",
                relatedItem: item._id
            });
        }

        res.json({
            message: "Item marked as recovered successfully",
            item
        });

    } catch (error) {
        console.error("Mark recovered error:", error);

        res.status(500).json({
            message: "Failed to mark item as recovered",
            error: error.message
        });
    }
});


// GET SINGLE ITEM
router.get("/:id", async (req, res) => {
    try {
        const item = await Item.findById(req.params.id)
            .populate("reportedBy", "name email");

        if (!item) {
            return res.status(404).json({
                message: "Item not found"
            });
        }

        res.json(item);

    } catch (error) {
        console.error("Fetch single item error:", error);

        res.status(500).json({
            message: "Failed to fetch item",
            error: error.message
        });
    }
});


// UPDATE ITEM
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                message: "Item not found"
            });
        }

        // TEMPORARY DEBUGGING
        console.log("ITEM OWNER:", String(item.reportedBy));
        console.log("LOGGED IN USER:", String(req.user.id));
        console.log("USER OBJECT:", req.user);

        // Only the original reporter can edit
        if (String(item.reportedBy) !== String(req.user.id)) {
            return res.status(403).json({
                message: "You are not authorized to edit this item"
            });
        }

        // Recovered items cannot be edited
        if (item.status === "recovered") {
            return res.status(400).json({
                message: "Recovered items cannot be edited"
            });
        }

        // Only allow safe editable fields
        const allowedFields = [
            "itemName",
            "category",
            "description",
            "date",
            "location",
            "image",
            "contact"
        ];

        const updateData = {};

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                message: "No valid fields provided for update"
            });
        }

        const updatedItem = await Item.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        res.json({
            message: "Item updated successfully",
            item: updatedItem
        });

    } catch (error) {
        console.error("Update item error:", error);

        res.status(500).json({
            message: "Failed to update item",
            error: error.message
        });
    }
});


// DELETE ITEM
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                message: "Item not found"
            });
        }

        // Only the original reporter can delete
        if (String(item.reportedBy) !== String(req.user.id)) {
            return res.status(403).json({
                message: "You are not authorized to delete this item"
            });
        }

        // Remove claims associated with this item
        await Claim.deleteMany({
            item: item._id
        });

        // Remove notifications associated with this item
        await Notification.deleteMany({
            relatedItem: item._id
        });

        // Delete item
        await item.deleteOne();

        res.json({
            message: "Item deleted successfully"
        });

    } catch (error) {
        console.error("Delete item error:", error);

        res.status(500).json({
            message: "Failed to delete item",
            error: error.message
        });
    }
});


module.exports = router;