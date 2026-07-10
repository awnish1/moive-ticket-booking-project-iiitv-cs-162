const express = require("express");
const path = require("path");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const mongoose = require('mongoose');

require("./db/conn"); // Connects to MongoDB
const User = require("./models/userModel"); 
const Movie = require("./models/Movie");   
const Theater = require('./models/Theater');
const Booking = require('./models/Booking'); 
const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); 
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded request bodies
app.use(express.static(path.join(__dirname, "../public"))); // Serve frontend files

//helper function 

function ensureArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [value]; // Wrap single value in an array
}

//api routing

//User Authentication Routes
app.post("/register", async (req, res) => {
    try {
        const { firstName, lastName, email, password, mobile, gender, location } = req.body;
        if (!firstName || !lastName || !email || !password || !mobile || !gender || !location ) {
            return res.status(400).json({ message: "Missing required registration fields." });
        }
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered. Please login." });
        }
        const newUser = new User({ firstName, lastName, email: email.toLowerCase(), password, mobile, gender, location });
        await newUser.save(); // Hashing happens in pre-save hook
        console.log(`User registered: ${newUser.email}`);
        res.status(201).json({ message: "Registration successful! You can now log in." });
    } catch (error) {
        console.error("Registration Error:", error.message, error.stack);
        res.status(500).json({ message: "Server error during registration." });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid credentials provided." });
        }
        console.log(`User logged in: ${user.email}`);
        res.status(200).json({
            message: "Login successful! Redirecting...",
            user: { id: user._id, email: user.email, firstName: user.firstName, location: user.location }
        });
    } catch (error) {
        console.error("Login Error:", error.message, error.stack);
        res.status(500).json({ message: "Server error during login." });
    }
});

//movie api routing
app.get("/api/theaters/locations", async (req, res) => {

    try {

        const locations = await Theater.distinct("location");

        // Optional: sort alphabetically

        locations.sort();

        res.status(200).json(locations);

    } catch (err) {

        console.error("Error fetching locations:", err);

        res.status(500).json({ message: "Server error fetching locations." });

    }

});

// corrected parsing
app.get("/api/movies", async (req, res) => {
    try {
        const filterQuery = {};

        // Handle categories filter using the helper function
        const categoryFilters = ensureArray(req.query.categories);
        if (categoryFilters.length > 0) {
             const validCategories = categoryFilters.map(c => String(c).trim()).filter(c => c);
             if (validCategories.length > 0) {
                filterQuery.categories = { $in: validCategories };
             }
        }

        // Handle languages filter using the helper function
        const languageFilters = ensureArray(req.query.languages);
        if (languageFilters.length > 0) {
             const validLanguages = languageFilters.map(l => String(l).trim()).filter(l => l);
             if (validLanguages.length > 0) {
                 filterQuery.languages = { $in: validLanguages };
             }
        }

        console.log("Fetching movies with filter:", JSON.stringify(filterQuery));
        const movies = await Movie.find(filterQuery);
        res.status(200).json(movies);

    } catch (error) {
        console.error("Error fetching movie list:", error.message, error.stack);
        res.status(500).json({ message: "Server error fetching movies." });
    }
});

//Fetching details for a single movie
app.get("/api/movies/:id", async (req, res) => {
    try {
        const movieId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(movieId)) {
            return res.status(400).json({ message: "Invalid movie ID format." });
        }
        const movie = await Movie.findById(movieId);
        if (!movie) {
            return res.status(404).json({ message: "Movie not found." });
        }
        res.status(200).json(movie);
    } catch (error) {
        console.error(`Error fetching single movie (ID: ${req.params.id}):`, error.message, error.stack);
        res.status(500).json({ message: "Server error fetching movie details." });
    }
});

// Theater Route (Filters only by Location)
app.get("/api/theaters/relevant", async (req, res) => {
    console.log("\n--- Request: /api/theaters/relevant (Location Only) ---");
    try {
        const { selectedLocation } = req.query;
        console.log("Received Query Params:", req.query);
        if (!selectedLocation) {
            console.log("No location selected, returning empty array.");
            return res.status(200).json([]);
        }
        const theaterQuery = { location: { $regex: new RegExp(`^${selectedLocation}$`, 'i') } };
        console.log("Theater Query (Location Only):", JSON.stringify(theaterQuery));
        const relevantTheaters = await Theater.find(theaterQuery).select('name location address _id');
        console.log(`Found ${relevantTheaters.length} relevant theaters in SELECTED location "${selectedLocation}".`);
        res.status(200).json(relevantTheaters);
    } catch (error) {
        console.error("Error fetching relevant theaters (Location Only):", error.message, error.stack);
        res.status(500).json({ message: "Server error fetching relevant theaters." });
    }
});

//Booking Related Routes
app.get("/api/bookings/occupied-seats", async (req, res) => {
    console.log("\n--- Request: /api/bookings/occupied-seats ---");
    try {
        const { movieId, theaterId, bookingDate, showtimeSlot } = req.query;

        // Validation
        if (!movieId || !theaterId || !bookingDate || !showtimeSlot) {
            return res.status(400).json({ message: "Missing required parameters (movieId, theaterId, bookingDate, showtimeSlot)." });
        }
        if (!mongoose.Types.ObjectId.isValid(movieId) || !mongoose.Types.ObjectId.isValid(theaterId)) {
            return res.status(400).json({ message: "Invalid movie or theater ID format." });
        }
        const parsedDate = new Date(bookingDate); // Convert YYYY-MM-DD string to Date object
        if (isNaN(parsedDate.getTime())) {
             return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
        }

        console.log("Querying booked seats for:", { movieId, theaterId, bookingDate: parsedDate, showtimeSlot });

        const bookingsForSlot = await Booking.find({
            movieId: movieId,
            theaterId: theaterId,
            bookingDate: parsedDate, // Compare Date objects
            showtimeSlot: showtimeSlot
        }).select('seats -_id'); // Only get the seats array

        // Extract and flatten the seats array
        const occupiedSeats = bookingsForSlot.flatMap(booking => booking.seats || []);
        console.log(`Found occupied seats: ${occupiedSeats.join(', ')}`);

        res.status(200).json(occupiedSeats);

    } catch (error) {
        console.error("Error fetching occupied seats:", error.message, error.stack);
        res.status(500).json({ message: "Server error fetching occupied seats." });
    }
});

// POST a new booking with conflict check
app.post("/api/bookings", async (req, res) => {
     console.log("\n--- Request: POST /api/bookings ---");
     try {
         const { userId, movieId, theaterId, language, format, bookingDate, showtimeSlot, seats, totalPrice } = req.body;

         //Basic Validation
         if (!userId || !movieId || !theaterId || !language || !format || !bookingDate || !showtimeSlot || !Array.isArray(seats) || seats.length === 0 || typeof totalPrice !== 'number') {
             return res.status(400).json({ message: "Missing or invalid booking data." });
         }
         const parsedDate = new Date(bookingDate);
         if (isNaN(parsedDate.getTime())) {
              return res.status(400).json({ message: "Invalid bookingDate format. Use YYYY-MM-DD." });
         }

         // --- CONFLICT CHECK: Ensure seats aren't already in another booking for this slot ---
         console.log(`Checking for booking conflicts for seats: [${seats.join(', ')}]`);
         const conflictingBooking = await Booking.findOne({
             movieId: movieId,
             theaterId: theaterId,
             bookingDate: parsedDate, // Check against the specific date
             showtimeSlot: showtimeSlot,
             seats: { $in: seats } // Check if any requested seat is in an existing booking's seats array
         });

         if (conflictingBooking) {
             const conflictingSeats = seats.filter(seat => conflictingBooking.seats.includes(seat));
             console.warn(`Booking conflict detected! Seats [${conflictingSeats.join(', ')}] already booked.`);
             return res.status(409).json({ // 409 Conflict
                  message: `Sorry, the following seat(s) are no longer available: ${conflictingSeats.join(', ')}. Please select different seats.`
             });
         }
         console.log("No booking conflicts found. Proceeding to save.")

         // Create and save the new booking
         const newBooking = new Booking({
             userId, movieId, theaterId, language, format,
             bookingDate: parsedDate, // Store as Date object
             showtimeSlot, seats, totalPrice
         });
         await newBooking.save();
         console.log("Booking saved successfully:", newBooking._id);

         // Respond with success
         res.status(201).json({ message: "Booking confirmed successfully!", bookingId: newBooking._id });

     } catch (error) {
         console.error("Error creating booking:", error.message, error.stack);
         res.status(500).json({ message: "Server error creating booking." });
     }
});

// GET Booking Details by ID
app.get("/api/bookings/:bookingId", async (req, res) => {
    console.log(`\n--- Request: GET /api/bookings/${req.params.bookingId} ---`);
    try {
        const bookingId = req.params.bookingId;
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ message: "Invalid booking ID format." });
        }
        // Find booking and populate related details
        const booking = await Booking.findById(bookingId)
            .populate('userId', 'firstName email')
            .populate('movieId', 'title imageUrl bannerUrl')
            .populate('theaterId', 'name location address');

        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }
        // Construct response data
        const responseData = {
            _id: booking._id,
            user: booking.userId ? { firstName: booking.userId.firstName, email: booking.userId.email } : { firstName: 'N/A', email: 'N/A' },
            movie: booking.movieId ? { title: booking.movieId.title, imageUrl: booking.movieId.imageUrl, bannerUrl: booking.movieId.bannerUrl } : { title: 'N/A', imageUrl: '', bannerUrl: ''},
            theater: booking.theaterId ? { name: booking.theaterId.name, location: booking.theaterId.location, address: booking.theaterId.address } : { name: 'N/A', location: 'N/A', address: ''},
            language: booking.language,
            format: booking.format,
            bookingDate: booking.bookingDate, // Send Date object or format
            showtimeSlot: booking.showtimeSlot,
            seats: booking.seats,
            totalPrice: booking.totalPrice,
            createdAt: booking.createdAt
        };
        console.log("Found booking details:", responseData._id);
        res.status(200).json(responseData);

    } catch (error) {
        console.error(`Error fetching booking details (ID: ${req.params.bookingId}):`, error.message, error.stack);
        res.status(500).json({ message: "Server error fetching booking details." });
    }
});
app.listen(port, () => {
    console.log(`Server is Running and Listening at http://localhost:${port}`);
});