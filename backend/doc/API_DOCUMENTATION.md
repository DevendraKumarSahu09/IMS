# Insurance Management System API Documentation

## Overview
This API provides endpoints for managing insurance policies, claims, payments, and user authentication for an insurance management system.

## Base URL
- Development: `http://localhost:4000`
- Production: `https://your-domain.com`

## Authentication
- **GraphQL Authentication**: `/graphql` endpoint for user registration and login
- **JWT Tokens**: Required for all protected REST endpoints
- **Authorization Header**: `Bearer <token>`

## GraphQL Authentication

### Register User
```graphql
mutation Register($name: String!, $email: String!, $password: String!, $role: String!) {
  register(name: $name, email: $email, password: $password, role: $role) {
    id
    name
    email
    role
  }
}
```

### Login User
```graphql
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    token
    user {
      id
      name
      email
      role
    }
  }
}
```

## REST API Endpoints

### Policies

#### Get All Policies (Public)
```http
GET /api/v1/policies
```

#### Get Policy by ID (Public)
```http
GET /api/v1/policies/:id
```

#### Create Policy (Admin Only)
```http
POST /api/v1/policies
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "POL001",
  "title": "Health Insurance",
  "description": "Comprehensive health coverage",
  "premium": 5000,
  "termMonths": 12,
  "minSumInsured": 100000
}
```

#### Purchase Policy (Customer Only)
```http
POST /api/v1/policies/:id/purchase
Authorization: Bearer <token>
Content-Type: application/json

{
  "startDate": "2025-01-01",
  "termMonths": 12,
  "nominee": {
    "name": "John Doe",
    "relation": "spouse"
  }
}
```

### User Policies

#### Get User Policies
```http
GET /api/v1/user/policies
Authorization: Bearer <token>
```

#### Cancel User Policy
```http
PUT /api/v1/user/policies/:id/cancel
Authorization: Bearer <token>
```

### Claims

#### Get Claims
```http
GET /api/v1/claims
Authorization: Bearer <token>
```

#### Get Claim by ID
```http
GET /api/v1/claims/:id
Authorization: Bearer <token>
```

#### Create Claim (Customer Only)
```http
POST /api/v1/claims
Authorization: Bearer <token>
Content-Type: application/json

{
  "policyId": "policy_id_here",
  "incidentDate": "2025-01-15",
  "description": "Car accident description",
  "amount": 50000
}
```

#### Update Claim Status (Agent/Admin Only)
```http
PUT /api/v1/claims/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "APPROVED",
  "notes": "Claim approved after verification"
}
```

### Payments

#### Get All Payments
```http
GET /api/v1/payments
Authorization: Bearer <token>
```

#### Get User Payments
```http
GET /api/v1/payments/user
Authorization: Bearer <token>
```

#### Create Payment (Customer Only)
```http
POST /api/v1/payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "policyId": "policy_id_here",
  "amount": 5000,
  "method": "CARD",
  "reference": "TXN123456789"
}
```

### Agents

#### Get All Agents (Admin Only)
```http
GET /api/v1/agents
Authorization: Bearer <token>
```

#### Create Agent (Admin Only)
```http
POST /api/v1/agents
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Agent Name",
  "email": "agent@example.com",
  "phone": "+1234567890"
}
```

#### Assign Agent (Admin Only)
```http
PUT /api/v1/agents/:id/assign
Authorization: Bearer <token>
Content-Type: application/json

{
  "policyId": "policy_id_here",
  "claimId": "claim_id_here"
}
```

### Admin

#### Get Audit Logs (Admin Only)
```http
GET /api/v1/admin/audit?limit=50
Authorization: Bearer <token>
```

#### Get Summary (Admin Only)
```http
GET /api/v1/admin/summary
Authorization: Bearer <token>
```

## Response Formats

### Success Response
```json
{
  "data": "response_data_here"
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## User Roles

- **customer**: Can purchase policies, submit claims, make payments
- **agent**: Can view and update claims, view assigned policies
- **admin**: Full access to all endpoints and data

## Rate Limiting
Currently no rate limiting implemented. Consider adding for production use.

## CORS
CORS is enabled for development. Configure appropriately for production.
