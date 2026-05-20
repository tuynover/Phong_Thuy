const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    const { email, password, name, day, month, year, hour, minute, gender } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    user = new User({
      email,
      password: hashedPassword,
      name,
      baziInfo: (day && month && year && hour && minute) ? {
        day: parseInt(day),
        month: parseInt(month),
        year: parseInt(year),
        hour: parseInt(hour),
        minute: parseInt(minute)
      } : undefined,
      gender: gender !== undefined ? parseInt(gender) : 1
    });

    await user.save();

    // Create token
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, email: user.email, name: user.name, baziInfo: user.baziInfo, gender: user.gender } });
      }
    );
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).send('Server error');
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    // Create token
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, email: user.email, name: user.name, baziInfo: user.baziInfo, gender: user.gender } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

const updateBaziInfo = async (req, res) => {
  try {
    const { userId, day, month, year, hour, minute } = req.body;
    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.baziInfo = {
      day: parseInt(day),
      month: parseInt(month),
      year: parseInt(year),
      hour: parseInt(hour),
      minute: parseInt(minute)
    };
    await user.save();
    
    res.json({ user: { id: user.id, email: user.email, name: user.name, baziInfo: user.baziInfo, gender: user.gender } });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

module.exports = {
  register,
  login,
  updateBaziInfo,
};
