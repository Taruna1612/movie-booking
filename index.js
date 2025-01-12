const express = require('express');
const bodyParser = require('body-parser');
const request = require('supertest'); // For testing

const app = express();
app.use(bodyParser.json());

// In-memory data (replace with a database in production)
const movies = {
    "Movie A": {
        showtimes: {
            "7:00 PM": { seats: Array.from({ length: 20 }, (_, i) => ({ number: i + 1, booked: false })) },
            "9:30 PM": { seats: Array.from({ length: 20 }, (_, i) => ({ number: i + 1, booked: false })) },
        },
    },
    "Movie B": {
        showtimes: {
            "8:00 PM": { seats: Array.from({ length: 20 }, (_, i) => ({ number: i + 1, booked: false })) },
        },
    },
};

const bookings = [];

// Helper function to find available seat
function findAvailableSeat(movie, showtime) {
    const showtimeData = movies[movie]?.showtimes[showtime];
    if (!showtimeData) return null;
    return showtimeData.seats.find(seat => !seat.booked);
}

// Book Movie Ticket API
app.post('/bookings', (req, res) => {
    const { name, email, movie, showtime } = req.body;

    if (!name || !email || !movie || !showtime) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const availableSeat = findAvailableSeat(movie, showtime);
    if (!availableSeat) {
        return res.status(400).json({ error: 'No seats available for this showtime' });
    }

    availableSeat.booked = true;
    const booking = { name, email, movie, showtime, seatNumber: availableSeat.number };
    bookings.push(booking);

    res.status(201).json({ message: 'Booking confirmed', ticket: booking });
});

// View Movie Ticket Details API
app.get('/bookings/:email', (req, res) => {
    const { email } = req.params;
    const userBookings = bookings.filter(b => b.email === email);

    if (userBookings.length === 0) {
        return res.status(404).json({ error: 'No bookings found for this email' });
    }

    res.json(userBookings);
});

// View All Attendees for a Movie API
app.get('/attendees/:movie/:showtime', (req, res) => {
    const { movie, showtime } = req.params;
    const attendees = bookings.filter(b => b.movie === movie && b.showtime === showtime);

    if (attendees.length === 0) {
        return res.status(404).json({ error: 'No attendees found for this movie and showtime' });
    }

    res.json(attendees);
});

// Cancel Movie Ticket API
app.delete('/bookings/:email/:movie/:showtime', (req, res) => {
    const { email, movie, showtime } = req.params;
    const bookingIndex = bookings.findIndex(b => b.email === email && b.movie === movie && b.showtime === showtime);

    if (bookingIndex === -1) {
        return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[bookingIndex];
    const showtimeData = movies[booking.movie].showtimes[booking.showtime];
    const seat = showtimeData.seats.find(s => s.number === booking.seatNumber);
    if (seat) seat.booked = false;

    bookings.splice(bookingIndex, 1);
    res.json({ message: 'Booking cancelled' });
});

// Modify Seat Assignment API
app.put('/bookings/:email/:movie/:showtime', (req, res) => {
    const { email, movie, showtime } = req.params;
    const { newSeatNumber } = req.body;

    if (!newSeatNumber) {
        return res.status(400).json({ error: 'New seat number is required' });
    }

    const booking = bookings.find(b => b.email === email && b.movie === movie && b.showtime === showtime);
    if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
    }

    const showtimeData = movies[movie].showtimes[showtime];
    if (newSeatNumber < 1 || newSeatNumber > showtimeData.seats.length) {
        return res.status(400).json({ error: 'Invalid seat number' });
    }

    //Check if new seat is already booked
      if(showtimeData.seats[newSeatNumber-1].booked){
        return res.status(400).json({ error: 'Seat already booked' });
      }

    //Free the existing seat
    const oldSeat = showtimeData.seats.find(s => s.number === booking.seatNumber);
    if(oldSeat) oldSeat.booked = false;

    showtimeData.seats[newSeatNumber - 1].booked = true;
    booking.seatNumber = newSeatNumber;

    res.json({ message: 'Seat changed', booking });
});

// Export the app for testing
module.exports = app;


//// Include Test file here to run test(test.js)

