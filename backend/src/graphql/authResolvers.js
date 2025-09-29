const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const register = async (_, { name, email, password, role }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error('Email already registered');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = new User({ name, email, passwordHash, role });
  await user.save();
  
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return {
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  };
};

const login = async (_, { email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error('Invalid login credentials');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('Invalid login credentials');

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return {
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  };
};

const me = async (_, __, { user }) => {
  if (!user) throw new Error('Not authenticated');
  
  // Fetch the full user data from database using the ID from JWT token
  const fullUser = await User.findById(user.id);
  if (!fullUser) throw new Error('User not found');
  
  return { 
    id: fullUser._id, 
    name: fullUser.name, 
    email: fullUser.email, 
    role: fullUser.role 
  };
};

module.exports = { 
  Query: { me },
  Mutation: { register, login } 
};
