const mongoose = require("mongoose");
const movieSchema = new mongoose.Schema({
    title:{
        type: String,
        required: [true, "Movie title is required."],
        trim: true
    },
    description: { 
        type: String,
        required: [true, "Movie desc is required."]
    },
    imageUrl: {
        type: String,
        required: [true, "Movie poster image URL is required."]
    },
    bannerUrl: { 
        type: String
    },
    trailerUrl: { 
        type: String
    },
    duration: {
        type: String 
    },
    releaseDate: {
        type: Date
    },
    certification: { 
        type: String
    },
    rating: {
        type: Number,
        min: 0,
        max: 10 
    },
    categories: { 
        type: [String],
        index: true
    },
    languages: { 
        type: [String], 
        index: true
    },
    formats: {
        type: [String] 
    },
    screen: {
        type: String
    },
    director: {
        type: String
    },
    cast: {
        type: [String]
    },

    price: {
        type: Number,
        min: 0
    },

    createdAt: { 
        
        type: Date,
        default: Date.now
    },
    updatedAt: { 
        type: Date,
        default: Date.now
    }
});

// Middleware to update the `updatedAt` field on save
movieSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});
const Movie = mongoose.model("Movie", movieSchema);
module.exports = Movie;