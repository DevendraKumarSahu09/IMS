# Backend Testing Guide

This guide provides comprehensive instructions for testing the Insurance Management System backend.

## 🧪 **Testing Strategy Overview**

According to the project requirements, we need to implement:

1. **Unit Tests** (Jest) - Critical endpoints (auth, purchase, claims)
2. **Manual Tests** - Postman collection for all endpoints
3. **E2E Tests** (Playwright) - Optional but recommended

## 🚀 **Quick Start Testing**

### **1. Start the Backend Server**

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Start the server
npm run dev
```

### **2. Run Unit Tests**

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### **3. Manual Testing with Postman**

1. Import the Postman collection: `Insurance_Management_API.postman_collection.json`
2. Set the `baseUrl` variable to `http://localhost:4000`
3. Run the collection in order (Authentication → Policies → Claims → etc.)

## 📋 **Unit Tests**

### **Test Files Structure**

```
backend/src/tests/
├── setup.js              # Test environment setup
├── auth.test.js          # Authentication tests
├── policy.test.js        # Policy management tests
└── claim.test.js         # Claims processing tests
```

### **Running Specific Tests**

```bash
# Run only authentication tests
npm test -- auth.test.js

# Run only policy tests
npm test -- policy.test.js

# Run only claim tests
npm test -- claim.test.js
```

### **Test Coverage**

The tests cover:

#### **Authentication Tests**
- ✅ User registration (GraphQL)
- ✅ User login (GraphQL)
- ✅ Duplicate email handling
- ✅ Invalid credentials handling
- ✅ Non-existent user handling

#### **Policy Tests**
- ✅ Get all policies (public endpoint)
- ✅ Get policy by ID
- ✅ Policy creation (admin only)
- ✅ Policy purchase (customer)
- ✅ Input validation
- ✅ Authentication requirements
- ✅ Role-based access control

#### **Claim Tests**
- ✅ Claim submission (customer)
- ✅ Claim retrieval (role-based filtering)
- ✅ Claim status updates (agent/admin)
- ✅ Authorization checks
- ✅ Input validation
- ✅ Business logic validation

## 🔧 **Manual Testing with Postman**

### **Collection Overview**

The Postman collection includes:

1. **Authentication** - Register and login for all user types
2. **Policies** - CRUD operations and policy purchase
3. **User Policies** - User-specific policy management
4. **Claims** - Claim submission and processing
5. **Payments** - Payment recording and retrieval
6. **Agents** - Agent management and assignment
7. **Admin** - Audit logs and system summary

### **Testing Workflow**

#### **Step 1: Setup**
1. Import the Postman collection
2. Set `baseUrl` to `http://localhost:4000`
3. Ensure backend server is running

#### **Step 2: Authentication Flow**
1. **Register Customer** - Creates a customer account
2. **Register Agent** - Creates an agent account
3. **Register Admin** - Creates an admin account
4. **Login Customer** - Gets customer token (auto-saved)
5. **Login Agent** - Gets agent token (auto-saved)
6. **Login Admin** - Gets admin token (auto-saved)

#### **Step 3: Policy Management**
1. **Get All Policies** - Verify public access
2. **Create Policy** - Admin creates a new policy
3. **Purchase Policy** - Customer purchases a policy
4. **Get User Policies** - Customer views their policies

#### **Step 4: Claims Processing**
1. **Submit Claim** - Customer submits a claim
2. **Get Claims** - Test role-based filtering
3. **Update Claim Status** - Agent/Admin processes claim

#### **Step 5: Payment Processing**
1. **Record Payment** - Customer makes a payment
2. **Get User Payments** - Customer views payment history
3. **Get All Payments** - Admin views all payments

#### **Step 6: Agent Management**
1. **Get All Agents** - Admin views agents
2. **Create Agent** - Admin creates new agent
3. **Assign Agent** - Admin assigns agent to policy/claim

#### **Step 7: Admin Functions**
1. **Get Audit Logs** - Admin views system audit trail
2. **Get System Summary** - Admin views system statistics

### **Environment Variables**

The collection uses these variables:
- `baseUrl` - Backend server URL
- `authToken` - Current authentication token
- `customerToken` - Customer authentication token
- `agentToken` - Agent authentication token
- `adminToken` - Admin authentication token
- `policyId` - Policy ID for testing
- `userPolicyId` - User policy ID for testing
- `claimId` - Claim ID for testing

## 🎯 **E2E Testing (Optional)**

### **Playwright Setup**

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install
```

### **E2E Test Scenario**

The E2E test should cover the complete user journey:

1. **User Registration** → **Login** → **View Policies** → **Purchase Policy** → **Submit Claim** → **View Claim Status**

### **Sample E2E Test**

```javascript
// e2e/login-purchase-claim.spec.js
const { test, expect } = require('@playwright/test');

test('Complete user journey: login → purchase → submit claim', async ({ page }) => {
  // 1. Navigate to login page
  await page.goto('http://localhost:4200/login');
  
  // 2. Login
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');
  
  // 3. View policies
  await page.goto('http://localhost:4200/policies');
  await expect(page.locator('[data-testid="policy-list"]')).toBeVisible();
  
  // 4. Purchase policy
  await page.click('[data-testid="purchase-button"]');
  await page.fill('[data-testid="nominee-name"]', 'Test Nominee');
  await page.selectOption('[data-testid="nominee-relation"]', 'spouse');
  await page.click('[data-testid="confirm-purchase"]');
  
  // 5. Submit claim
  await page.goto('http://localhost:4200/claims');
  await page.click('[data-testid="submit-claim-button"]');
  await page.fill('[data-testid="incident-description"]', 'Test incident');
  await page.fill('[data-testid="claim-amount"]', '10000');
  await page.click('[data-testid="submit-claim"]');
  
  // 6. Verify claim submission
  await expect(page.locator('[data-testid="claim-status"]')).toContainText('PENDING');
});
```

## 🔍 **Testing Checklist**

### **Authentication**
- [ ] User registration works
- [ ] User login works
- [ ] JWT tokens are generated
- [ ] Invalid credentials are rejected
- [ ] Duplicate emails are handled

### **Policies**
- [ ] Public policy listing works
- [ ] Policy details are accessible
- [ ] Policy creation requires admin role
- [ ] Policy purchase works for customers
- [ ] Input validation works
- [ ] Authentication is required for protected endpoints

### **Claims**
- [ ] Claim submission works
- [ ] Role-based filtering works
- [ ] Claim status updates work
- [ ] Authorization is enforced
- [ ] Business logic validation works

### **Payments**
- [ ] Payment recording works
- [ ] Payment history is accessible
- [ ] Payment simulation works
- [ ] User-specific filtering works

### **Agents**
- [ ] Agent listing works (admin only)
- [ ] Agent creation works (admin only)
- [ ] Agent assignment works
- [ ] Role-based access is enforced

### **Admin**
- [ ] Audit logs are accessible
- [ ] System summary is available
- [ ] Admin-only access is enforced

## 🐛 **Troubleshooting**

### **Common Issues**

#### **1. Database Connection Issues**
```bash
# Check MongoDB connection
mongosh "mongodb://localhost:27017/insurance_management_test"

# Verify environment variables
echo $MONGO_URI
echo $JWT_SECRET
```

#### **2. Test Failures**
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test with debug
npm test -- --testNamePattern="should register a new user"
```

#### **3. Postman Issues**
- Verify `baseUrl` is set correctly
- Check that tokens are being saved in variables
- Ensure backend server is running
- Check network connectivity

#### **4. Authentication Issues**
- Verify JWT_SECRET is set
- Check token expiration
- Ensure proper Authorization header format

### **Debug Mode**

```bash
# Run backend in debug mode
DEBUG=* npm run dev

# Run tests with debug output
DEBUG=* npm test
```

## 📊 **Test Results**

### **Expected Test Results**

When all tests pass, you should see:

```
Test Suites: 3 passed, 3 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        5.234 s
```

### **Coverage Report**

```bash
npm run test:coverage
```

Expected coverage:
- **Statements**: > 80%
- **Branches**: > 70%
- **Functions**: > 80%
- **Lines**: > 80%

## 🚀 **CI/CD Integration**

The tests are integrated with GitHub Actions:

```yaml
# .github/workflows/ci.yml
- name: Run backend tests
  run: |
    cd backend
    npm test
  env:
    NODE_ENV: test
    JWT_SECRET: test-secret-key
    MONGO_URI: mongodb://localhost:27017/insurance_management_test
```

## 📝 **Test Data Management**

### **Test Database**

- Uses separate test database: `insurance_management_test`
- Automatically cleaned between tests
- Isolated from development data

### **Test Users**

The tests create these test users:
- **Customer**: `customer@test.com`
- **Agent**: `agent@test.com`
- **Admin**: `admin@test.com`

### **Cleanup**

Tests automatically clean up:
- Created users
- Created policies
- Created claims
- Created payments
- Audit logs

## 🎯 **Performance Testing**

### **Load Testing (Optional)**

```bash
# Install artillery for load testing
npm install -g artillery

# Run load test
artillery run load-test.yml
```

### **Sample Load Test**

```yaml
# load-test.yml
config:
  target: 'http://localhost:4000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "API Load Test"
    requests:
      - get:
          url: "/api/v1/policies"
```

## 📚 **Additional Resources**

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Postman Documentation](https://learning.postman.com/docs/)
- [Playwright Documentation](https://playwright.dev/docs/intro)

---

**Last Updated**: January 2025
**Testing Status**: ✅ **Complete**
