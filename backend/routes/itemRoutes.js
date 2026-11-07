
const express = require("express");
const mongoose = require("mongoose");
const Item = require("../models/Item");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// Submit a lost or found item
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
            !["lost", "found"].includes(type)
        ) {
            return res.status(400).json({
                message: "Please provide all required item details"
            });
        }

        const newItem = new Item({
            itemName,
            category,
            description,
            date,
            location,
            image: image || "",
            contact,
            type,
            reportedBy: req.user.id
        });

        await newItem.save();

        res.status(201).json({
            message: "Item report submitted successfully!",
            item: newItem
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to submit item report",
            error: error.message
        });
    }
});


// Get all lost and found items
router.get("/", async (req, res) => {
    try {
        const items = await Item.find().sort({ createdAt: -1 });

        res.json(items);

    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve items",
            error: error.message
        });
    }
});


// Get one item using its ID
router.get("/:id", async (req, res) => {
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

        res.json(item);

    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve item",
            error: error.message
        });
    }
});


// Edit an item (only the person who reported it)
router.put("/:id", authMiddleware, async (req, res) => {
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

        // Check item ownership
        if (item.reportedBy.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You can only edit your own item reports"
            });
        }

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
            !["lost", "found"].includes(type)
        ) {
            return res.status(400).json({
                message: "Please provide all required item details"
            });
        }

        // Update item information
        item.itemName = itemName;
        item.category = category;
        item.description = description;
        item.date = date;
        item.location = location;
        item.image = image || "";
        item.contact = contact;
        item.type = type;

        await item.save();

        res.json({
            message: "Item updated successfully!",
            item: item
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update item",
            error: error.message
        });
    }
});


// Delete an item (only the person who reported it)
router.delete("/:id", authMiddleware, async (req, res) => {
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

        // Check item ownership
        if (item.reportedBy.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You can only delete your own item reports"
            });
        }

        await Item.findByIdAndDelete(req.params.id);

        res.json({
            message: "Item deleted successfully!"
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to delete item",
            error: error.message
        });
    }
});


module.exports = router;
