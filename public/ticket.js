document.addEventListener('DOMContentLoaded', () => {
    // --- Config ---
    const API_BASE_URL = 'http://localhost:3000';

    // --- DOM Elements ---
    const loadingMsgEl = document.getElementById('loading-message');
    const errorMsgAreaEl = document.getElementById('error-message-area');
    const ticketContentEl = document.getElementById('ticket-details'); // Main container for details sections

    // Specific Detail Elements
    const bannerEl = document.getElementById('ticket-banner');
    const movieTitleOverlayEl = document.getElementById('ticket-movie-title-overlay');
    // const movieRatingOverlayEl = document.getElementById('ticket-movie-rating-overlay'); // If you add rating
    const bookingIdEl = document.getElementById('ticket-booking-id');
    const userNameEl = document.getElementById('ticket-user-name');
    const userEmailEl = document.getElementById('ticket-user-email');
    const bookingTimeEl = document.getElementById('ticket-booking-time');
    const theaterNameEl = document.getElementById('ticket-theater-name');
    const theaterLocationEl = document.getElementById('ticket-theater-location');
    const bookingDateEl = document.getElementById('ticket-booking-date');
    const showtimeSlotEl = document.getElementById('ticket-showtime-slot');
    const langFormatEl = document.getElementById('ticket-lang-format');
    const seatsListEl = document.getElementById('ticket-seats-list');
    const seatCountEl = document.getElementById('ticket-seat-count'); // Added element for quantity
    const totalPriceEl = document.getElementById('ticket-total-price');

    // Detail Section Containers (to hide/show them)
    const bookingInfoSection = document.getElementById('booking-info');
    const showInfoSection = document.getElementById('show-info');
    const seatInfoSection = document.getElementById('seat-info');
    const paymentInfoSection = document.getElementById('payment-info');
    const actionsSection = document.querySelector('.ticket-actions');

    //  Get Booking ID from URL
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get('bookingId');

    // Fetch and Display Booking Details
    async function fetchAndDisplayTicket() {
        if (!bookingId) {
            displayError("Booking ID missing from URL.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}`);

            if (response.status === 404) {
                 displayError("Booking not found."); return;
            }
            if (!response.ok) {
                const errData = await response.json().catch(()=> ({message: response.statusText}));
                throw new Error(`Failed to load booking (${response.status}): ${errData.message}`);
            }

            const booking = await response.json();
            console.log("Booking data received:", booking);

            //Populate the page

            // Banner and Title Overlay
            const bannerSrc = booking.movie?.bannerUrl || booking.movie?.imageUrl || '';
            if (bannerEl && bannerSrc) { bannerEl.style.backgroundImage = `url('${bannerSrc}')`; }
            if (movieTitleOverlayEl) { movieTitleOverlayEl.textContent = booking.movie?.title || 'Movie Title'; }
            // Update page title too
            document.title = `Ticket: ${booking.movie?.title || 'Booking'}`;

            // Booking Info Section
            if (bookingIdEl) bookingIdEl.textContent = booking._id;
            if (userNameEl) userNameEl.textContent = booking.user?.firstName || 'N/A';
            if (userEmailEl) userEmailEl.textContent = booking.user?.email || 'N/A';
            if (bookingTimeEl && booking.createdAt) {
                 bookingTimeEl.textContent = new Date(booking.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short'}); // Format booking time
            }
             if(bookingInfoSection) bookingInfoSection.style.display = 'block';

             // Show Info Section
             if (theaterNameEl) theaterNameEl.textContent = booking.theater?.name || 'N/A';
             if (theaterLocationEl) theaterLocationEl.textContent = booking.theater?.location || 'N/A';
             if (bookingDateEl && booking.bookingDate) {
                  bookingDateEl.textContent = new Date(booking.bookingDate).toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
             }
             if (showtimeSlotEl) showtimeSlotEl.textContent = booking.showtimeSlot || 'N/A';
             if (langFormatEl) langFormatEl.textContent = `${booking.language || 'N/A'} / ${booking.format || 'N/A'}`;
             if(showInfoSection) showInfoSection.style.display = 'block';

             // Seat Info Section
             const seatCount = booking.seats?.length || 0;
             if (seatsListEl) seatsListEl.textContent = seatCount > 0 ? booking.seats.join(', ') : 'N/A';
             if (seatCountEl) seatCountEl.textContent = `${seatCount} Person${seatCount !== 1 ? 's' : ''}`;
             if(seatInfoSection) seatInfoSection.style.display = 'block';

             // Payment Info Section
             if (totalPriceEl) totalPriceEl.textContent = booking.totalPrice?.toFixed(2) || '0.00';
             if(paymentInfoSection) paymentInfoSection.style.display = 'block';

             // Show Action Buttons
             if(actionsSection) actionsSection.style.display = 'block';

            // Hide loading message
            if(loadingMsgEl) loadingMsgEl.style.display = 'none';


        } catch (error) {
            console.error("Error fetching ticket:", error);
            displayError(`Error loading ticket: ${error.message}`);
        }
    }

    function displayError(message) {
        if (loadingMsgEl) loadingMsgEl.style.display = 'none'; // Hide loading
        errorMsgAreaEl.innerHTML = `<p class="error-message">${message}</p>`; // Show error
    }
    fetchAndDisplayTicket();

});