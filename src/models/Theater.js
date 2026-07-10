// src/models/Theater.js
const mongoose = require('mongoose');

const theaterSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true, index: true }, 
    address: { type: String, trim: true }, // Optional full address
}, { timestamps: true });

const Theater = mongoose.model('Theater', theaterSchema);
module.exports = Theater;