const express = require("express");
const router = express.Router();

const Claim = require("../models/Claim");
const Item = require("../models/Item");
const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/authMiddleware");


// SUBMIT A CLAIM
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { itemId, message, contact } = req.body;

        if (!itemId || !message?.trim() || !contact?.trim()) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const item = await Item.findById(itemId);

        if (!item) {
            return res.status(404).json({
                message: "Item not found"
            });
        }

        if (item.type !== "found") {
            return res.status(400).json({
                message: "Only found items can be claimed"
            });
        }

        if (item.reportedBy.toString() === req.user.id) {
            return res.status(400).json({
                message: "You cannot claim your own item"
            });
        }

        if (item.status !== "active") {
            return res.status(400).json({
                message: "This item is no longer available for claiming"
            });
        }

        // Prevent duplicate pending claims
        const existingClaim = await Claim.findOne({
            item: itemId,
            claimedBy: req.user.id,
            status: "pending"
        });

        if (existingClaim) {
            return res.status(400).json({
                message: "You already have a pending claim for this item"
            });
        }

        const claim = new Claim({
            item: itemId,
            claimedBy: req.user.id,
            message: message.trim(),
            contact: contact.trim()
        });

        await claim.save();

        // Notify the reporter
        await Notification.create({
            recipient: item.reportedBy,
            message: `Someone has submitted a claim for "${item.itemName}".`,
            type: "claim_received",
            relatedItem: item._id,
            relatedClaim: claim._id
        });

        res.status(201).json({
            message: "Claim submitted successfully",
            claim
        });

    } catch (error) {
        console.error("Submit claim error:", error);

        res.status(500).json({
            message: "Failed to submit claim",
            error: error.message
        });
    }
});


// GET MY CLAIMS
router.get("/mine", authMiddleware, async (req, res) => {
    try {
        const claims = await Claim.find({
            claimedBy: req.user.id
        })
            .populate("item")
            .sort({ createdAt: -1 });

        res.json(claims);

    } catch (error) {
        console.error("Fetch my claims error:", error);

        res.status(500).json({
            message: "Failed to fetch claims",
            error: error.message
        });
    }
});


// GET CLAIMS RECEIVED ON MY ITEMS
router.get("/received", authMiddleware, async (req, res) => {
    try {
        const myItems = await Item.find({
            reportedBy: req.user.id
        }).select("_id");

        const itemIds = myItems.map(item => item._id);

        const claims = await Claim.find({
            item: { $in: itemIds }
        })
            .populate("item")
            .populate("claimedBy", "name email")
            .sort({ createdAt: -1 });

        res.json(claims);

    } catch (error) {
        console.error("Fetch received claims error:", error);

        res.status(500).json({
            message: "Failed to fetch received claims",
            error: error.message
        });
    }
});


// APPROVE OR REJECT CLAIM
router.patch("/:id/status", authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({
                message: "Invalid claim status"
            });
        }

        const claim = await Claim.findById(req.params.id)
            .populate("item");

        if (!claim) {
            return res.status(404).json({
                message: "Claim not found"
            });
        }

        const item = claim.item;

        if (!item) {
            return res.status(404).json({
                message: "Associated item not found"
            });
        }

        // Only the reporter can manage claims
        if (item.reportedBy.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You are not authorized to manage this claim"
            });
        }

        // Only pending claims can be processed
        if (claim.status !== "pending") {
            return res.status(400).json({
                message: "This claim has already been processed"
            });
        }

        if (status === "approved") {

            // Item must still be available
            if (item.status !== "active") {
                return res.status(400).json({
                    message: "This item is no longer available"
                });
            }

            // Approve claim
            claim.status = "approved";
            await claim.save();

            // Update item status
            item.status = "claimed";
            await item.save();

            // Reject all other pending claims for this item
            const otherClaims = await Claim.find({
                item: item._id,
                _id: { $ne: claim._id },
                status: "pending"
            });

            for (const otherClaim of otherClaims) {

                otherClaim.status = "rejected";
                await otherClaim.save();

                await Notification.create({
                    recipient: otherClaim.claimedBy,
                    message: `Your claim for "${item.itemName}" was rejected because another claim was approved.`,
                    type: "claim_rejected",
                    relatedItem: item._id,
                    relatedClaim: otherClaim._id
                });
            }

            // Notify the approved claimant
            await Notification.create({
                recipient: claim.claimedBy,
                message: `Your claim for "${item.itemName}" has been approved!`,
                type: "claim_approved",
                relatedItem: item._id,
                relatedClaim: claim._id
            });

        } else {

            // Reject claim
            claim.status = "rejected";
            await claim.save();

            // Notify claimant
            await Notification.create({
                recipient: claim.claimedBy,
                message: `Your claim for "${item.itemName}" has been rejected.`,
                type: "claim_rejected",
                relatedItem: item._id,
                relatedClaim: claim._id
            });
        }

        res.json({
            message: `Claim ${status} successfully`,
            claim
        });

    } catch (error) {
        console.error("Update claim error:", error);

        res.status(500).json({
            message: "Failed to update claim",
            error: error.message
        });
    }
});


module.exports = router;