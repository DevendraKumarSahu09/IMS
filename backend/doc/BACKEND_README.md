# Insurance Management Backend Documentation

## Overview

This backend is a Node.js, Express, and MongoDB (Mongoose) RESTful API service with Apollo GraphQL integrated only for Authentication (login and signup). The project aims to deliver a scalable, secure, and maintainable insurance management system backend.

***

## Current Project Status

### 1. Project Setup & Dependencies

- Initialized with Node.js & NPM.
- Core packages:
  - `express` for the HTTP server and REST API routing.
  - `mongoose` for MongoDB ORM modeling.
  - `jsonwebtoken` (JWT), `bcryptjs` for secure user authentication.
  - `apollo-server-express` and `graphql` for GraphQL authentication endpoints.
  - Middlewares including CORS, JWT authentication, role-based authorization.

***

### 2. Project Structure & Pattern

```
src/
  controllers/            # Business logic for each resource
  middlewares/            # Authentication and authorization middlewares
  models/                 # Mongoose models for all entities
  routes/                 # Lightweight route handlers delegating to controllers
  graphql/                # GraphQL schema and resolvers for auth only
  index.js                # Main server entry - combines REST + GraphQL
docs/                     # Documentation files
.env                      # Environment variables for configs
```

- **Separation of concerns**: Controllers hold logic, routes only map endpoints to controllers.
- **Hybrid API**: REST for business modules; GraphQL only for login/signup to leverage Apollo benefits.

***

### 3. Implemented Entities and Modules

- **User**: Stored with hashed password, roles (customer, agent, admin)
- **Policy**: Insurance products with codes, premiums, terms, etc.
- **UserPolicy**: Purchased policies linked to users.
- **Claim**: Claims against user policies.
- **Payment**: Payments made on user policies.
- **Agent**: Agents managing policies.
- **AuditLog**: Logs actions for accountability.

***

### 4. Authentication & Authorization

- JWT-based middleware validates bearer tokens for all REST requests.
- Role-based access control enforces permissions on each route.
- GraphQL exposes `register` and `login` mutations:
  - `register` hashes password, checks email uniqueness.
  - `login` verifies credentials and returns JWT + user info.

***

### 5. Sample REST Workflow

- `GET /api/v1/policies` - list policies for authorized users.
- `POST /api/v1/policies` - create a policy (admins only).
- Protected by JWT and roles middleware.

***

### 6. Testing Strategy

- Using **Jest** for unit and integration tests.
- **Supertest** for HTTP endpoint testing.
- Tests will cover:
  - GraphQL auth mutations.
  - REST endpoints for policies, claims, user policies, payments.
  - Middleware auth and role scenarios.

***

## How to Run Locally

1. Clone the repo.
2. Run `npm install`.
3. Define `.env` file with `PORT`, `MONGO_URI`, `JWT_SECRET`.
4. Start dev server with:

```bash
npm run dev
```

5. Access GraphQL Playground at `/graphql` for auth testing.
6. Use REST endpoint base `/api/v1/`.

***