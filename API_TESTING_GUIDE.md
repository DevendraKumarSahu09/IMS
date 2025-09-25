# API Testing Guide - Insurance Management System

This document provides comprehensive testing instructions for both GraphQL and REST APIs in the Insurance Management System.

## Table of Contents
1. [GraphQL API Testing](#graphql-api-testing)
2. [REST API Testing](#rest-api-testing)
3. [Authentication](#authentication)
4. [Testing Tools](#testing-tools)

---

## GraphQL API Testing

### GraphQL Endpoint
- **URL**: `http://localhost:4000/graphql`
- **Method**: POST
- **Content-Type**: `application/json`

### 1. User Registration

**Query:**
```graphql
mutation RegisterUser {
  register(
    name: "John Doe"
    email: "john.doe@example.com"
    password: "password123"
    role: "customer"
  ) {
    id
    name
    email
    role
  }
}
```

**Expected Response:**
```json
{
  "data": {
    "register": {
      "id": "64a1b2c3d4e5f6789012345",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "customer"
    }
  }
}
```

### 2. User Login

**Query:**
```graphql
mutation LoginUser {
  login(
    email: "john.doe@example.com"
    password: "password123"
  ) {
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

**Expected Response:**
```json
{
  "data": {
    "login": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "64a1b2c3d4e5f6789012345",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "role": "customer"
      }
    }
  }
}
```

### 3. Register Admin User

**Query:**
```graphql
mutation RegisterAdmin {
  register(
    name: "Admin User"
    email: "admin@example.com"
    password: "admin123"
    role: "admin"
  ) {
    id
    name
    email
    role
  }
}
```

### 4. Register Agent User

**Query:**
```graphql
mutation RegisterAgent {
  register(
    name: "Agent Smith"
    email: "agent@example.com"
    password: "agent123"
    role: "agent"
  ) {
    id
    name
    email
    role
  }
}
```

---

## REST API Testing

### Base URL
- **Base URL**: `http://localhost:4000/api/v1`

### Authentication
Most REST endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 1. Policy Management APIs

### 1.1 Get All Policies (Public)
- **Method**: GET
- **URL**: `/policies`
- **Auth**: Not required
- **Body**: None

**Example Request:**
```bash
curl -X GET http://localhost:4000/api/v1/policies
```

### 1.2 Get Policy by ID (Public)
- **Method**: GET
- **URL**: `/policies/:id`
- **Auth**: Not required
- **Body**: None

**Example Request:**
```bash
curl -X GET http://localhost:4000/api/v1/policies/64a1b2c3d4e5f6789012345
```

### 1.3 Create Policy (Admin Only)
- **Method**: POST
- **URL**: `/policies`
- **Auth**: Required (Admin role)
- **Body**:
```json
{
  "code": "POL001",
  "title": "Life Insurance Premium",
  "description": "Comprehensive life insurance coverage",
  "premium": 5000,
  "termMonths": 12,
  "minSumInsured": 100000
}
```

**Example Request:**
```bash
curl -X POST http://localhost:4000/api/v1/policies \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "POL001",
    "title": "Life Insurance Premium",
    "description": "Comprehensive life insurance coverage",
    "premium": 5000,
    "termMonths": 12,
    "minSumInsured": 100000
  }'
```

**Additional Policy Creation Examples:**

**Health Insurance Policy:**
```json
{
  "code": "POL002",
  "title": "Health Insurance Premium",
  "description": "Comprehensive health insurance coverage for medical expenses",
  "premium": 3000,
  "termMonths": 24,
  "minSumInsured": 500000
}
```

**Auto Insurance Policy:**
```json
{
  "code": "POL003",
  "title": "Auto Insurance Premium",
  "description": "Vehicle insurance coverage for accidents and damages",
  "premium": 8000,
  "termMonths": 12,
  "minSumInsured": 200000
}
```

### 1.4 Purchase Policy (Customer Only)
- **Method**: POST
- **URL**: `/policies/:id/purchase`
- **Auth**: Required (Customer role)
- **Body**:
```json
{
  "startDate": "2024-01-01",
  "termMonths": 12,
  "nominee": {
    "name": "Jane Doe",
    "relation": "spouse"
  }
}
```

**Example Request:**
```bash
curl -X POST http://localhost:4000/api/v1/policies/64a1b2c3d4e5f6789012345/purchase \
  -H "Authorization: Bearer <customer-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2024-01-01",
    "termMonths": 12,
    "nominee": {
      "name": "Jane Doe",
      "relation": "spouse"
    }
  }'
```

**Additional Policy Purchase Examples:**

**With Child as Nominee:**
```json
{
  "startDate": "2024-02-01",
  "termMonths": 24,
  "nominee": {
    "name": "John Doe Jr.",
    "relation": "child"
  }
}
```

**With Parent as Nominee:**
```json
{
  "startDate": "2024-03-01",
  "termMonths": 12,
  "nominee": {
    "name": "Robert Doe",
    "relation": "parent"
  }
}
```

---

## 2. Claim Management APIs

### 2.1 Get All Claims
- **Method**: GET
- **URL**: `/claims`
- **Auth**: Required (Admin, Agent, Customer)
- **Body**: None

**Example Request:**
```bash
curl -X GET http://localhost:4000/api/v1/claims \
  -H "Authorization: Bearer <token>"
```

### 2.2 Get Claim by ID
- **Method**: GET
- **URL**: `/claims/:id`
- **Auth**: Required (Admin, Agent, Customer)
- **Body**: None

**Example Request:**
```bash
curl -X GET http://localhost:4000/api/v1/claims/64a1b2c3d4e5f6789012345 \
  -H "Authorization: Bearer <token>"
```

### 2.3 Create Claim (Customer Only)
- **Method**: POST
- **URL**: `/claims`
- **Auth**: Required (Customer role)
- **Body**:
```json
{
  "policyId": "64a1b2c3d4e5f6789012346",
  "incidentDate": "2024-01-15",
  "description": "Car accident on highway",
  "amount": 25000
}
```

**Example Request:**
```bash
curl -X POST http://localhost:4000/api/v1/claims \
  -H "Authorization: Bearer <customer-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "policyId": "64a1b2c3d4e5f6789012346",
    "incidentDate": "2024-01-15",
    "description": "Car accident on highway",
    "amount": 25000
  }'
```

### 2.4 Update Claim Status (Agent/Admin Only)
- **Method**: PUT
- **URL**: `/claims/:id/status`
- **Auth**: Required (Agent or Admin role)
- **Body**:
```json
{
  "status": "APPROVED",
  "notes": "Claim approved after verification"
}
```

**Example Request:**
```bash
curl -X PUT http://localhost:4000/api/v1/claims/64a1b2c3d4e5f6789012345/status \
  -H "Authorization: Bearer <agent-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "notes": "Claim approved after verification"
  }'
```

**Additional Claim Examples:**

**Health Insurance Claim:**
```json
{
  "policyId": "64a1b2c3d4e5f6789012347",
  "incidentDate": "2024-02-10",
  "description": "Hospitalization for emergency surgery",
  "amount": 150000
}
```

**Auto Insurance Claim:**
```json
{
  "policyId": "64a1b2c3d4e5f6789012348",
  "incidentDate": "2024-02-20",
  "description": "Vehicle damage from collision",
  "amount": 45000
}
```

---

## 3. Payment Management APIs

### 3.1 Get All Payments
- **Method**: GET
- **URL**: `/payments`
- **Auth**: Required (Admin, Agent, Customer)
- **Body**: None

**Example Request:**
```bash
curl -X GET http://localhost:4000/api/v1/payments \
  -H "Authorization: Bearer <token>"
```

### 3.2 Get User Payments (Customer Only)
- **Method**: GET
- **URL**: `/payments/user`
- **Auth**: Required (Customer role)
- **Body**: None

**Example Request:**
```bash
curl -X GET http://localhost:4000/api/v1/payments/user \
  -H "Authorization: Bearer <customer-token>"
```

### 3.3 Get Payment by ID
- **Method**: GET
- **URL**: `/payments/:id`
- **Auth**: Required (Admin, Agent, Customer)
- **Body**: None

**Example Request:**
```bash
curl -X GET http://localhost:4000/api/v1/payments/64a1b2c3d4e5f6789012345 \
  -H "Authorization: Bearer <token>"
```

### 3.4 Create Payment (Customer Only)
- **Method**: POST
- **URL**: `/payments`
- **Auth**: Required (Customer role)
- **Body**:
```json
{
  "policyId": "64a1b2c3d4e5f6789012345",
  "amount": 5000,
  "method": "CARD",
  "reference": "TXN123456789"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:4000/api/v1/payments \
  -H "Authorization: Bearer <customer-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "policyId": "64a1b2c3d4e5f6789012345",
    "amount": 5000,
    "method": "CARD",
    "reference": "TXN123456789"
  }'
```

**Additional Payment Examples:**

**Net Banking Payment:**
```json
{
  "policyId": "64a1b2c3d4e5f6789012345",
  "amount": 5000,
  "method": "NETBANKING",
  "reference": "NB123456789"
}
```

**Offline Payment:**
```json
{
  "policyId": "64a1b2c3d4e5f6789012345",
  "amount": 5000,
  "method": "OFFLINE",
  "reference": "CASH001"
}
```

**Simulated Payment (for testing):**
```json
{
  "policyId": "64a1b2c3d4e5f6789012345",
  "amount": 5000,
  "method": "SIMULATED",
  "reference": "TEST123456"
}
```

---

## 4. Agent Management APIs

### 4.1 Get All Agents (Admin Only)
- **Method**: GET
- **URL**: `/agents`
- **Auth**: Required (Admin role)
- **Body**: None

**Example Request:**
```bash
curl -X GET http://localhost:4000/api/v1/agents \
  -H "Authorization: Bearer <admin-token>"
```

### 4.2 Get Agent by ID (Admin Only)
- **Method**: GET
- **URL**: `/agents/:id`
- **Auth**: Required (Admin role)
- **Body**: None

**Example Request:**
```bash
curl -X GET http://localhost:4000/api/v1/agents/64a1b2c3d4e5f6789012345 \
  -H "Authorization: Bearer <admin-token>"
```

### 4.3 Create Agent (Admin Only)
- **Method**: POST
- **URL**: `/agents`
- **Auth**: Required (Admin role)
- **Body**:
```json
{
  "name": "Agent Smith",
  "email": "agent.smith@example.com",
  "phone": "+1234567890",
  "specialization": "life_insurance",
  "commissionRate": 0.05
}
```

**Example Request:**
```bash
curl -X POST http://localhost:4000/api/v1/agents \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Agent Smith",
    "email": "agent.smith@example.com",
    "phone": "+1234567890",
    "specialization": "life_insurance",
    "commissionRate": 0.05
  }'
```

### 4.4 Assign Agent (Admin Only)
- **Method**: PUT
- **URL**: `/agents/:id/assign`
- **Auth**: Required (Admin role)
- **Body**:
```json
{
  "policyId": "64a1b2c3d4e5f6789012345"
}
```

**Example Request:**
```bash
curl -X PUT http://localhost:4000/api/v1/agents/64a1b2c3d4e5f6789012345/assign \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "policyId": "64a1b2c3d4e5f6789012345"
  }'
```

---

## 5. User Policy Management APIs

### 5.1 Get All User Policies
- **Method**: GET
- **URL**: `/user-policies`
- **Auth**: Required (Admin, Agent, Customer)
- **Body**: None

**Example Request:**
```bash
curl -X GET http://localhost:4000/api/v1/user-policies \
  -H "Authorization: Bearer <token>"
```

### 5.2 Get User Policy by ID
- **Method**: GET
- **URL**: `/user-policies/:id`
- **Auth**: Required (Admin, Agent, Customer)
- **Body**: None

**Example Request:**
```bash
curl -X GET http://localhost:4000/api/v1/user-policies/64a1b2c3d4e5f6789012345 \
  -H "Authorization: Bearer <token>"
```

### 5.3 Create User Policy (Admin Only)
- **Method**: POST
- **URL**: `/user-policies`
- **Auth**: Required (Admin role)
- **Body**:
```json
{
  "userId": "64a1b2c3d4e5f6789012345",
  "policyId": "64a1b2c3d4e5f6789012346",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "premiumPaid": 5000,
  "status": "ACTIVE"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:4000/api/v1/user-policies \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "64a1b2c3d4e5f6789012345",
    "policyId": "64a1b2c3d4e5f6789012346",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "premiumPaid": 5000,
    "status": "ACTIVE"
  }'
```

### 5.4 Update User Policy (Admin/Agent Only)
- **Method**: PUT
- **URL**: `/user-policies/:id`
- **Auth**: Required (Admin or Agent role)
- **Body**:
```json
{
  "status": "CANCELLED",
  "notes": "Policy cancelled by customer request"
}
```

**Example Request:**
```bash
curl -X PUT http://localhost:4000/api/v1/user-policies/64a1b2c3d4e5f6789012345 \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "CANCELLED",
    "notes": "Policy cancelled by customer request"
  }'
```

### 5.5 Delete User Policy (Admin Only)
- **Method**: DELETE
- **URL**: `/user-policies/:id`
- **Auth**: Required (Admin role)
- **Body**: None

**Example Request:**
```bash
curl -X DELETE http://localhost:4000/api/v1/user-policies/64a1b2c3d4e5f6789012345 \
  -H "Authorization: Bearer <admin-token>"
```

---

## 6. User Management APIs

### 6.1 Get User Policies (Customer Only)
- **Method**: GET
- **URL**: `/user/policies`
- **Auth**: Required (Customer role)
- **Body**: None

**Example Request:**
```bash
curl -X GET http://localhost:4000/api/v1/user/policies \
  -H "Authorization: Bearer <customer-token>"
```

### 6.2 Cancel User Policy (Customer Only)
- **Method**: PUT
- **URL**: `/user/policies/:id/cancel`
- **Auth**: Required (Customer role)
- **Body**: None

**Example Request:**
```bash
curl -X PUT http://localhost:4000/api/v1/user/policies/64a1b2c3d4e5f6789012345/cancel \
  -H "Authorization: Bearer <customer-token>"
```

---

## 7. Admin Management APIs

### 7.1 Get Audit Logs (Admin Only)
- **Method**: GET
- **URL**: `/admin/audit`
- **Auth**: Required (Admin role)
- **Query Parameters**: `?limit=50` (optional)
- **Body**: None

**Example Request:**
```bash
curl -X GET "http://localhost:4000/api/v1/admin/audit?limit=50" \
  -H "Authorization: Bearer <admin-token>"
```

### 7.2 Get System Summary (Admin Only)
- **Method**: GET
- **URL**: `/admin/summary`
- **Auth**: Required (Admin role)
- **Body**: None

**Example Request:**
```bash
curl -X GET http://localhost:4000/api/v1/admin/summary \
  -H "Authorization: Bearer <admin-token>"
```

---

## 8. Audit Management APIs

### 8.1 Get All Audit Logs (Admin Only)
- **Method**: GET
- **URL**: `/audits`
- **Auth**: Required (Admin role)
- **Body**: None

**Example Request:**
```bash
curl -X GET http://localhost:4000/api/v1/audits \
  -H "Authorization: Bearer <admin-token>"
```

### 8.2 Get Audit Log by ID (Admin Only)
- **Method**: GET
- **URL**: `/audits/:id`
- **Auth**: Required (Admin role)
- **Body**: None

**Example Request:**
```bash
curl -X GET http://localhost:4000/api/v1/audits/64a1b2c3d4e5f6789012345 \
  -H "Authorization: Bearer <admin-token>"
```

---

## Testing Tools

### 1. GraphQL Playground
- **URL**: `http://localhost:4000/graphql`
- Use the GraphQL Playground interface to test GraphQL queries interactively

### 2. Postman Collection
Create a Postman collection with the following structure:
- **Environment Variables**:
  - `base_url`: `http://localhost:4000`
  - `graphql_url`: `http://localhost:4000/graphql`
  - `customer_token`: (set after login)
  - `admin_token`: (set after login)
  - `agent_token`: (set after login)

### 3. cURL Commands
All examples above include cURL commands for command-line testing.

### 4. Testing Workflow
1. **Start the server**: `npm start` or `node src/index.js`
2. **Register users** via GraphQL (admin, agent, customer)
3. **Login users** via GraphQL to get JWT tokens
4. **Test REST APIs** using the obtained tokens
5. **Verify responses** match expected formats

---

## Common Response Formats

### Success Response
```json
{
  "data": "response_data_here"
}
```

### Error Response
```json
{
  "error": "Error message here"
}
```

### GraphQL Error Response
```json
{
  "errors": [
    {
      "message": "Error message here",
      "locations": [{"line": 2, "column": 3}],
      "path": ["fieldName"]
    }
  ]
}
```

---

## Authentication Notes

- JWT tokens expire after 1 hour
- Include `Authorization: Bearer <token>` header for protected endpoints
- Role-based access control is enforced:
  - **Admin**: Full access to all endpoints
  - **Agent**: Access to claims, payments, user policies (limited)
  - **Customer**: Access to own data only

---

## Testing Checklist

- [ ] GraphQL registration works for all roles
- [ ] GraphQL login returns valid JWT token
- [ ] REST APIs require authentication
- [ ] Role-based access control works correctly
- [ ] All CRUD operations work as expected
- [ ] Error handling returns appropriate status codes
- [ ] Request validation works correctly
- [ ] Audit logging captures actions properly

---

*This document covers all available APIs in the Insurance Management System. Use it as a reference for testing and integration.*
