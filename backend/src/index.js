const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { ApolloServer } = require('apollo-server-express');
const authResolvers = require('./graphql/authResolvers');
const typeDefs = require('./graphql/typeDefs');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect MongoDB with connection pooling and options
const mongoOptions = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  bufferCommands: false, // Disable mongoose buffering
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  retryWrites: true, // Retry failed writes
  w: 'majority' // Write concern
};

// Only connect to MongoDB if not in test environment
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGO_URI, mongoOptions)
    .then(() => {
      console.log('MongoDB Connected with connection pooling');
      console.log(`Connection pool size: ${mongoOptions.maxPoolSize}`);
    })
    .catch((err) => {
      console.error('MongoDB connection error', err);
      process.exit(1);
    });
}

// Handle connection events (only in non-test environment)
if (process.env.NODE_ENV !== 'test') {
  mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected from MongoDB');
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    } catch (err) {
      console.error('Error during MongoDB disconnection:', err);
      process.exit(1);
    }
  });
}

// Start Apollo Server (needed for both test and production)
const server = new ApolloServer({ typeDefs, resolvers: authResolvers });
(async () => {
  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });
})();

// Import and use REST routes for policies, claims, payments, users, agents, audit logging etc.
app.use('/api/v1/policies', require('./routes/policyRoutes'));
app.use('/api/v1/claims', require('./routes/claimRoutes'));
app.use('/api/v1/payments', require('./routes/paymentRoutes'));
app.use('/api/v1/agents', require('./routes/agentRoutes'));
app.use('/api/v1/audits', require('./routes/auditRoutes'));
app.use('/api/v1/user-policies', require('./routes/userPolicyRoutes'));
app.use('/api/v1/user', require('./routes/userRoutes'));
app.use('/api/v1/admin', require('./routes/adminRoutes'));


const PORT = process.env.PORT || 4000;

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} - REST API on /api/v1/*, GraphQL auth on /graphql`);
  });
}

module.exports = app;
