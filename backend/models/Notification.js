const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    message: {
        type: String,
        required: true
    },

    type: {
        type: String,
        enum: [
            "claim_received",
            "claim_approved",
            "claim_rejected",
            "item_recovered"
        ],
        required: true
    },

    relatedItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        default: null
    },

    relatedClaim: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Claim",
        default: null
    },

    read: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Notification", notificationSchema);