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
  if (!user) return res.json({ msg: 'User not found'
