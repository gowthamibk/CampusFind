
const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: true,
        trim: true
    },

    category: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },

    description: {
        type: String,
        required: true
    },

    date: {
        type: Date,
        required: true
    },

    location: {
        type: String,
        required: true
    },

    image: {
        type: String,
        default: ""
    },

    contact: {
        type: String,
        required: true
    },

    type: {
        type: String,
        enum: ["lost", "found"],
        required: true
    },

    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Item", itemSchema);
