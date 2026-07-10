const mongoose = require('mongoose');
const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "User ID is required for booking."],
        index: true 
    },
    movieId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie', 
        required: [true, "Movie ID is required for booking."],
        index: true
    },
    theaterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Theater', 
        required: [true, "Theater ID is required for booking."],
        index: true
    },
    // Details selected by the user
    language: {
        type: String,
        required: [true, "Language selection is required."]
    },
    format: {
        type: String,
        required: [true, "Format selection is required."]
    },
    bookingDate: {
        type: Date, // Store as a full Date object
        required: [true, "Booking date is required."]
    },
    showtimeSlot: {
        type: String,
        required: [true, "Showtime slot is required."]
    },
    seats: {
        type: [String],
        required: [true, "At least one seat must be selected."]
        // You could add validation here to ensure the array is not empty if needed elsewhere
    },
    totalPrice: {
        type: Number,
        required: [true, "Total price is required."],
        min: [0, "Price cannot be negative."]
    },

}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields
bookingSchema.index({ movieId: 1, theaterId: 1, bookingDate: 1, showtimeSlot: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;