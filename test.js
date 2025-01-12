if (require.main === module) {
    const port = 3000;
    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
}
else{
    describe('Movie Ticket Booking API', () => {
        let server;

        beforeAll(() => {
            server = app.listen(0); // Start server on a random port
        });

        afterAll(() => {
            server.close(); // Close the server after tests
        });

        it('should book a movie ticket', async () => {
            const res = await request(app)
                .post('/bookings')
                .send({ name: 'Test User', email: 'test@example.com', movie: 'Movie A', showtime: '7:00 PM' })
                .expect(201);
            expect(res.body.message).toBe('Booking confirmed');
            expect(res.body.ticket.seatNumber).toBeDefined();
        });

        it('should not book a ticket if no seats are available', async () => {
            // Book all seats first
            const movie = 'Movie A';
            const showtime = '7:00 PM';
            const showtimeData = movies[movie]?.showtimes[showtime];
            if (showtimeData) {
                for (let i = 0; i < showtimeData.seats.length; i++) {
                    await request(app).post('/bookings').send({ name: `Test User ${i}`, email: `test${i}@example.com`, movie, showtime });
                }
            }


            const res = await request(app)
                .post('/bookings')
                .send({ name: 'Overbooked User', email: 'overbooked@example.com', movie: 'Movie A', showtime: '7:00 PM' })
                .expect(400);
            expect(res.body.error).toBe('No seats available for this showtime');
        });

        it('should get booking details by email', async () => {
             await request(app)
                .post('/bookings')
                .send({ name: 'test user 2', email: 'test2@example.com', movie: 'Movie B', showtime: '8:00 PM' })
                .expect(201);
            const res = await request(app)
                .get('/bookings/test2@example.com')
                .expect(200);
            expect(res.body).toBeDefined();
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
        });

        it('should cancel a booking', async () => {
            await request(app)
                .post('/bookings')
                .send({ name: 'test user 3', email: 'test3@example.com', movie: 'Movie A', showtime: '9:30 PM' })
                .expect(201);

            const res = await request(app)
                .delete('/bookings/test3@example.com/Movie A/9:30 PM')
                .expect(200);
            expect(res.body.message).toBe('Booking cancelled');
        });

        it('should modify a seat assignment', async () => {
            await request(app)
                .post('/bookings')
                .send({ name: 'test user 4', email: 'test4@example.com', movie: 'Movie A', showtime: '7:00 PM' })
                .expect(201);

            const res = await request(app)
                .put('/bookings/test4@example.com/Movie A/7:00 PM')
                .send({ newSeatNumber: 5 }) // Assuming seat 5 is available
                .expect(200);
            expect(res.body.message).toBe('Seat changed');
            expect(res.body.booking.seatNumber).toBe(5);
        });

        it('should not modify seat if seat is already booked', async () => {
            await request(app)
                .post('/bookings')
                .send({ name: 'test user 5', email: 'test5@example.com', movie: 'Movie A', showtime: '7:00 PM' })
                .expect(201);
            await request(app)
                .put('/bookings/test5@example.com/Movie A/7:00 PM')
                .send({ newSeatNumber: 6 }) // Assuming seat 6 is available
                .expect(200);
            const res = await request(app)
                .put('/bookings/test5@example.com/Movie A/7:00 PM')
                .send({ newSeatNumber: 6 })
                .expect(400);
            expect(res.body.error).toBe('Seat already booked');
        });
    });
}