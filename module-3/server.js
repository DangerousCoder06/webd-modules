let express = require('express');
let mongoose = require('mongoose');
let dotenv = require('dotenv');
let bcrypt = require('bcryptjs');
let jwt = require('jsonwebtoken');
let multer = require('multer');
let cors = require('cors');
let path = require('path');

dotenv.config();
let app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

let userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: { type: String, default: 'user' },
});
let User = mongoose.model('User', userSchema);

let movieSchema = new mongoose.Schema({
  name: String,
  time: String,
  image: String,
  totalSeats: Number,
  seatsRemaining: Number,
  bookings: [{ userId: String, seats: Number }],
});
let Movie = mongoose.model('Movie', movieSchema);

let auth = (req, res, next) => {
  let token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'No token' });
  try {
    let decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ msg: 'Invalid token' });
  }
};

let checkRole = (role) => (req, res, next) => {
  if (req.user.role !== role) return res.status(403).json({ msg: 'Access denied' });
  next();
};

let storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
let upload = multer({ storage });


app.post('/api/auth/signup', async (req, res) => {
  let { username, password } = req.body;
  let userExists = await User.findOne({ username });
  if (userExists) return res.json({ msg: 'User already exists' });
  let hashed = await bcrypt.hash(password, 10);
  let user = new User({ username, password: hashed });
  await user.save();
  res.json({ msg: 'Signup done' });
});

app.post('/api/auth/login', async (req, res) => {
  let { username, password } = req.body;
  let user = await User.findOne({ username });
  if (!user) return res.json({ msg: 'User not found' });
  let match = await bcrypt.compare(password, user.password);
  if (!match) return res.json({ msg: 'Wrong password' });
  let token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
  res.json({ token });
});

app.post('/api/auth/create-admin', async (req, res) => {
  let adminExists = await User.findOne({ username: 'admin' });
  if (adminExists) return res.json({ msg: 'Admin exists' });
  let hashed = await bcrypt.hash('123456', 10);
  let admin = new User({ username: 'admin', password: hashed, role: 'admin' });
  await admin.save();
  res.json({ msg: 'Admin created' });
});

app.post('/api/movies/admin', auth, checkRole('admin'), upload.single('image'), async (req, res) => {
  let { name, time, totalSeats } = req.body;
  let movie = new Movie({
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
  let movies = await Movie.find();
  res.json(movies);
});

app.post('/api/movies/book/:id', auth, checkRole('user'), async (req, res) => {
  let movie = await Movie.findById(req.params.id);
  let { seats } = req.body;
  if (seats < 1 || seats > 4) return res.json({ msg: 'Invalid seat number' });
  if (movie.seatsRemaining < seats) return res.json({ msg: 'Not enough seats' });
  let already = movie.bookings.find(b => b.userId === req.user.id);
  if (already) return res.json({ msg: 'Already booked' });
  movie.bookings.push({ userId: req.user.id, seats });
  movie.seatsRemaining -= seats;
  await movie.save();
  res.json({ msg: 'Booked' });
});

app.post('/api/movies/cancel/:id', auth, checkRole('user'), async (req, res) => {
  let movie = await Movie.findById(req.params.id);
  let booking = movie.bookings.find(b => b.userId === req.user.id);
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
