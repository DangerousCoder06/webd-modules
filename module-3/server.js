const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: { type: String, default: 'user' },
});
const User = mongoose.model('User', userSchema);

const movieSchema = new mongoose.Schema({
  name: String,
  time: String,
  image: String,
  totalSeats: Number,
  seatsRemaining: Number,
  bookings: [{ userId: String, seats: Number }],
});
const Movie = mongoose.model('Movie', movieSchema);

const auth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ msg: 'Invalid token' });
  }
};

const checkRole = (role) => (req, res, next) => {
  if (req.user.role !== role) return res.status(403).json({ msg: 'Access denied' });
  next();
};

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });


app.post('/api/auth/signup', async (req, res) => {
  const { username, password } = req.body;
  const userExists = await User.findOne({ username });
  if (userExists) return res.json({ msg: 'User already exists' });
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashed });
  await user.save();
  res.json({ msg: 'Signup done' });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.json({ msg: 'User not found' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.json({ msg: 'Wrong password' });
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
  res.json({ token });
});

app.post('/api/auth/create-admin', async (req, res) => {
  const adminExists = await User.findOne({ username: 'admin' });
  if (adminExists) return res.json({ msg: 'Admin exists' });
  const hashed = await bcrypt.hash('123456', 10);
  const admin = new User({ username: 'admin', password: hashed, role: 'admin' });
  await admin.save();
  res.json({ msg: 'Admin created' });
});

app.post('/api/movies/admin', auth, checkRole('admin'), upload.single('image'), async (req, res) => {
  const { name, time, totalSeats } = req.body;
  const movie = new Movie({
    name,
    time,
    image: req.file.filename,
    totalSeats,
    seatsRemaining: totalSeats,
  });
  await movie.save();
  res.json({ msg: 'Movie added' });
});

app.get('/api/movies', async (req, res) => {
  const movies = await Movie.find();
  res.json(movies);
});

app.post('/api/movies/book/:id', auth, checkRole('user'), async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  const { seats } = req.body;
  if (seats < 1 || seats > 4) return res.json({ msg: 'Invalid seat number' });
  if (movie.seatsRemaining < seats) return res.json({ msg: 'Not enough seats' });
  const already = movie.bookings.find(b => b.userId === req.user.id);
  if (already) return res.json({ msg: 'Already booked' });
  movie.bookings.push({ userId: req.user.id, seats });
  movie.seatsRemaining -= seats;
  await movie.save();
  res.json({ msg: 'Booked' });
});

app.post('/api/movies/cancel/:id', auth, checkRole('user'), async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  const booking = movie.bookings.find(b => b.userId === req.user.id);
  if (!booking) return res.json({ msg: 'No booking found' });
  movie.seatsRemaining += booking.seats;
  movie.bookings = movie.bookings.filter(b => b.userId !== req.user.id);
  await movie.save();
  res.json({ msg: 'Cancelled' });
});

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected!');
    app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
  })
  .catch(err => console.log('DB Error:', err));
