# Amashuri.rw — Technical Documentation

## Table of Contents

1. [System Overview](#1-system-overview)
2. [System Architecture](#2-system-architecture)
3. [Database Design](#3-database-design)
4. [Authentication and Authorization](#4-authentication-and-authorization)
5. [API Modules](#5-api-modules)
6. [AI Search System](#6-ai-search-system)
7. [Email System](#7-email-system)
8. [Security Implementation](#8-security-implementation)
9. [Testing](#9-testing)
10. [Environment Configuration](#10-environment-configuration)
11. [Error Handling](#11-error-handling)
12. [Future Improvements](#12-future-improvements)

---

## 1. System Overview

Amashuri.rw is a comprehensive RESTful API backend built with NestJS 
that powers Rwanda's Secondary School Directory platform. The system 
provides centralized access to secondary school information enabling 
parents, students, and educators to make informed educational decisions.

### Core Objectives
- Provide a centralized database of all secondary schools in Rwanda
- Enable intelligent AI-powered school search using natural language
- Support school comparison, reviews, and enquiry features
- Implement role-based access for users, school admins and platform admin

---

## 2. System Architecture

### Architecture Pattern
The system follows a **3-Tier Architecture**:
┌─────────────────────────────────────┐
│         PRESENTATION LAYER          │
│     Next.js Frontend (Port 3001)    │
└──────────────┬──────────────────────┘
│ HTTP Requests
▼
┌─────────────────────────────────────┐
│         APPLICATION LAYER           │
│      NestJS Backend (Port 3000)     │
│                                     │
│  ┌─────────┐  ┌─────────────────┐  │
│  │ Guards  │  │   Controllers   │  │
│  └─────────┘  └────────┬────────┘  │
│  ┌─────────┐  ┌────────▼────────┐  │
│  │  CORS   │  │    Services     │  │
│  └─────────┘  └────────┬────────┘  │
│  ┌─────────┐  ┌────────▼────────┐  │
│  │ Helmet  │  │  Prisma ORM     │  │
│  └─────────┘  └─────────────────┘  │
└──────────────┬──────────────────────┘
│
▼
┌─────────────────────────────────────┐
│           DATA LAYER                │
│      PostgreSQL Database            │
└─────────────────────────────────────┘

### Module Architecture
Each feature is encapsulated in its own NestJS module following the 
**Single Responsibility Principle**:
AppModule
├── AuthModule
├── UsersModule
├── SchoolsModule
├── FeesModule
├── CombinationsModule
├── ResourcesModule
├── ReviewsModule
├── FavouritesModule
├── CompareModule
├── EnquiriesModule
├── AdminModule
├── RecommendationsModule
├── SearchModule
└── PrismaModule (Global)

### Request Flow

HTTP Request
↓
Rate Limiter (Throttler)
↓
CORS Check
↓
Helmet Security Headers
↓
JwtAuthGuard (Authentication)
↓
RolesGuard (Authorization)
↓
ValidationPipe (Input Validation)
↓
Controller
↓
Service
↓
Prisma ORM
↓
PostgreSQL Database
↓
Response

---

## 3. Database Design

### Entity Relationship Overview

The database consists of 10 tables with the following relationships:

USERS ──────────► REVIEWS ◄────────── SCHOOLS
USERS ──────────► FAVOURITES ◄─────── SCHOOLS
USERS ──────────► ENQUIRIES ◄──────── SCHOOLS
USERS ──────────► COMPARISONS
USERS ──────────► SCHOOL_ADMINS ◄──── SCHOOLS
SCHOOLS ─────────► FEES
SCHOOLS ─────────► COMBINATIONS
SCHOOLS ─────────► SCHOOL_RESOURCES

### Table Descriptions

#### USERS Table
Stores all platform users regardless of role.

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key auto generated |
| name | VARCHAR | User full name |
| email | VARCHAR | Unique email address |
| passwordHash | VARCHAR | bcrypt hashed password |
| role | ENUM | USER, SCHOOL_ADMIN, ADMIN |
| createdAt | TIMESTAMP | Account creation date |

#### SCHOOLS Table
Central table storing all school information.

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| name | VARCHAR | Official school name |
| district | VARCHAR | Rwanda district |
| province | VARCHAR | Rwanda province |
| schoolType | ENUM | PUBLIC, PRIVATE, GOVERNMENT_AIDED |
| genderPolicy | ENUM | COED, BOYS_ONLY, GIRLS_ONLY |
| boarding | BOOLEAN | Boarding availability |
| email | VARCHAR | School contact email |
| phone | VARCHAR | School phone number |
| latitude | DECIMAL | GPS latitude coordinate |
| longitude | DECIMAL | GPS longitude coordinate |
| logoUrl | VARCHAR | School logo image URL |
| description | TEXT | School description |
| yearEstablished | INT | Year school was founded |
| totalStudents | INT | Total student enrollment |
| status | ENUM | DRAFT, PENDING, VERIFIED, REJECTED |
| isVerified | BOOLEAN | Admin verification status |
| createdAt | TIMESTAMP | Record creation date |

#### FEES Table
Stores fee structures for each school.

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| schoolId | UUID | Foreign key to SCHOOLS |
| level | VARCHAR | Class level (S1-S6) |
| studentType | ENUM | BOARDING, DAY |
| amount | DECIMAL | Fee amount in RWF |
| academicYear | VARCHAR | Academic year |

#### COMBINATIONS Table
Stores subject combinations offered by each school.

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| schoolId | UUID | Foreign key to SCHOOLS |
| name | VARCHAR | Combination code (PCM, HEG etc.) |
| subjects | TEXT | Full subject names |

#### SCHOOL_RESOURCES Table
Stores available resources and facilities for each school.

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| schoolId | UUID | Unique foreign key to SCHOOLS |
| laboratory | BOOLEAN | Has laboratory |
| library | BOOLEAN | Has library |
| computerRoom | BOOLEAN | Has computer room |
| sportsField | BOOLEAN | Has sports field |
| boardingHouse | BOOLEAN | Has boarding house |
| chapel | BOOLEAN | Has chapel |

#### REVIEWS Table
Stores user reviews and ratings for schools.

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| schoolId | UUID | Foreign key to SCHOOLS |
| userId | UUID | Foreign key to USERS |
| teachingRating | INT | Teaching quality (1-5) |
| facilitiesRating | INT | Facilities quality (1-5) |
| adminRating | INT | Administration quality (1-5) |
| overallRating | INT | Overall rating (1-5) |
| comment | TEXT | Optional review comment |
| createdAt | TIMESTAMP | Review date |

#### FAVOURITES Table
Records schools saved by users.

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| userId | UUID | Foreign key to USERS |
| schoolId | UUID | Foreign key to SCHOOLS |
| savedAt | TIMESTAMP | Date school was saved |

#### ENQUIRIES Table
Records enquiry messages sent to schools.

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| userId | UUID | Foreign key to USERS |
| schoolId | UUID | Foreign key to SCHOOLS |
| message | TEXT | Enquiry message content |
| senderEmail | VARCHAR | Sender email (auto from user) |
| sentAt | TIMESTAMP | Date enquiry was sent |
| status | ENUM | SENT, READ, REPLIED |

#### COMPARISONS Table
Records school comparison history.

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| userId | UUID | Foreign key to USERS |
| schoolIds | JSON | Array of compared school IDs |
| createdAt | TIMESTAMP | Comparison date |

#### SCHOOL_ADMINS Table
Links users to schools as administrators.

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| userId | UUID | Unique foreign key to USERS |
| schoolId | UUID | Unique foreign key to SCHOOLS |
| assignedAt | TIMESTAMP | Assignment date |

### Database Enums

```typescript
enum Role          { USER, SCHOOL_ADMIN, ADMIN }
enum SchoolType    { PUBLIC, PRIVATE, GOVERNMENT_AIDED }
enum GenderPolicy  { COED, BOYS_ONLY, GIRLS_ONLY }
enum StudentType   { BOARDING, DAY }
enum EnquiryStatus { SENT, READ, REPLIED }
enum SchoolStatus  { DRAFT, PENDING, VERIFIED, REJECTED }
```

---

## 4. Authentication and Authorization

### Authentication Flow

User submits email + password
↓
AuthService.login() called
↓
Find user by email in database
↓
Compare password with bcrypt.compare()
↓
If valid → JwtService.sign() generates token
↓
Token contains: { sub: userId, email, role }
↓
Token returned to client
↓
Client sends token in Authorization header
Bearer <token>
↓
JwtAuthGuard validates token on every request
↓
User object attached to request

### JWT Token Structure

```json
{
  "sub": "uuid-of-user",
  "email": "user@example.com",
  "role": "USER",
  "iat": 1234567890,
  "exp": 1235172690
}
```

### Role-Based Access Control (RBAC)

The system implements three roles with different permissions:

| Permission | USER | SCHOOL_ADMIN | ADMIN |
|---|---|---|---|
| Browse schools | ✅ | ✅ | ✅ |
| Write reviews | ✅ | ✅ | ✅ |
| Save favourites | ✅ | ✅ | ✅ |
| Send enquiries | ✅ | ✅ | ✅ |
| Compare schools | ✅ | ✅ | ✅ |
| Manage own school | ❌ | ✅ | ✅ |
| Create schools | ❌ | ❌ | ✅ |
| Verify schools | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| View all enquiries | ❌ | ❌ | ✅ |
| Platform statistics | ❌ | ❌ | ✅ |

### Guards Implementation

**JwtAuthGuard** — Applied globally. Checks JWT token on every request. Routes marked with `@Public()` decorator bypass this guard.

**RolesGuard** — Applied globally. Checks user role against required roles defined by `@Roles()` decorator.

**ThrottlerGuard** — Applied globally. Limits requests to 10 per second and 100 per minute per IP address.

---

## 5. API Modules

### Auth Module
Handles user registration and login.

**Endpoints:**
- `POST /auth/register` — Register with name, email, password
- `POST /auth/login` — Login and receive JWT token

**Validation Rules:**
- Name must be a string
- Email must be valid email format
- Password minimum 6 characters

### Schools Module
Core module managing all school data.

**Key Features:**
- Pagination with configurable page size
- Multi-criteria filtering (15+ parameters)
- Full-text search across name, district, description
- Geolocation search using Haversine formula
- Cascade delete for all related records

**Haversine Formula Implementation:**
```typescript
private calculateDistance(lat1, lon1, lat2, lon2): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
```

### Recommendations Module
Provides personalized school recommendations.

**Algorithm:**
1. Fetch user's favourite schools
2. Analyze patterns (district, schoolType, genderPolicy)
3. Find most common preference for each parameter
4. Query database with those preferences
5. Sort results by average rating
6. If no history → return top rated schools

---

## 6. AI Search System

### Overview
The AI search uses **Groq API** with **LLaMA 3.3 70B Versatile** model to understand natural language queries about schools.

### Intent Detection
Every query is analyzed and classified into one of 4 intents:

Intent: search
→ Extract filters from query
→ Query database with Prisma
→ Return matching schools
Intent: recommendation
→ Fetch top rated schools
→ Return top 10 with message
Intent: general_education
→ Groq answers from knowledge
→ Return educational explanation
Intent: out_of_scope
→ Politely decline
→ Provide example queries

### Groq API Call Structure

```typescript
const completion = await groq.chat.completions.create({
  model: 'llama-3.3-70b-versatile',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: query }
  ],
  temperature: 0,
});
```

### Extracted Parameters

| Parameter | Values | Example |
|---|---|---|
| genderPolicy | COED, GIRLS_ONLY, BOYS_ONLY | "girls school" |
| boarding | true, false | "boarding school" |
| district | Rwanda district name | "in Huye" |
| province | Kigali, Southern, Northern, Eastern, Western | "in Kigali" |
| schoolType | PUBLIC, PRIVATE, GOVERNMENT_AIDED | "private school" |
| maxFee | Number in RWF | "under 400,000" |
| combination | PCM, MCB, HEG, MEG, MPC | "with PCM" |

### Fallback System
If Groq API fails the system automatically falls back to basic keyword search ensuring zero downtime for users.

### Groq Free Tier Limits
- 30 requests per minute
- 14,400 requests per day
- 6,000 tokens per minute

---

## 7. Email System

### Overview
The email system uses **Nodemailer** with **Gmail SMTP** to deliver enquiry notifications to schools.

### Email Flow

User sends enquiry
↓
Backend saves enquiry to database
↓
Backend fetches user email from database
↓
Nodemailer sends email to school
From: amashuridirectory@gmail.com
Reply-To: user@email.com
↓
School receives email in inbox
↓
School replies directly to user email

### Email Template
The email includes:
- Amashuri.rw branded header
- Sender name and email
- Message content
- Direct reply link to parent email
- Footer with platform information

### Silent Failure
If email sending fails the enquiry is still saved in the database. The failure is handled silently ensuring the user experience is not affected.

---

## 8. Security Implementation

### Security Layers

**Layer 1 — Network Level**
- CORS configured to allow only trusted frontend domains
- Rate limiting: 10 requests/second, 100 requests/minute per IP

**Layer 2 — HTTP Level**
- Helmet adds 11 security headers including:
  - X-Content-Type-Options
  - X-Frame-Options
  - Strict-Transport-Security
  - X-XSS-Protection

**Layer 3 — Application Level**
- JWT authentication on all routes except public ones
- RBAC guards on sensitive endpoints
- Input validation with whitelist stripping

**Layer 4 — Data Level**
- Passwords hashed with bcrypt (10 salt rounds)
- Sensitive data never returned in responses
- UUID primary keys (non-sequential, harder to guess)

### Environment Variables Security
All sensitive credentials stored in `.env` file:
- Database connection string
- JWT secret key
- SMTP credentials
- Groq API key

The `.env` file is in `.gitignore` and never pushed to GitHub.

---

## 9. Testing

### Testing Strategy
The project uses **Jest** testing framework built into NestJS.

### Test Coverage

**AuthService Tests (5 tests)**

| Test | Expected Result |
|---|---|
| Register with valid data | Returns 201 with token |
| Register with existing email | Throws ConflictException |
| Login with correct credentials | Returns 200 with token |
| Login with non-existing email | Throws UnauthorizedException |
| Login with wrong password | Throws UnauthorizedException |

**SchoolsService Tests (6 tests)**

| Test | Expected Result |
|---|---|
| Get all schools | Returns array with meta |
| Get one school valid ID | Returns school object |
| Get one school invalid ID | Throws NotFoundException |
| Create school | Returns created school |
| Delete school valid ID | Returns success message |
| Delete school invalid ID | Throws NotFoundException |

### Running Tests
```bash
# Run all tests
npm run test

# Run with coverage report
npm run test:cov

# Run in watch mode
npm run test:watch
```

###### Email Template
The email includes:
- Amashuri.rw branded header
- Sender name and email
- Message content
- Direct reply link to parent email
- Footer with platform information

### Silent Failure
If email sending fails the enquiry is still saved in the database. The failure is handled silently ensuring the user experience is not affected.

---

## 8. Security Implementation

### Security Layers

**Layer 1 — Network Level**
- CORS configured to allow only trusted frontend domains
- Rate limiting: 10 requests/second, 100 requests/minute per IP

**Layer 2 — HTTP Level**
- Helmet adds 11 security headers including:
  - X-Content-Type-Options
  - X-Frame-Options
  - Strict-Transport-Security
  - X-XSS-Protection

**Layer 3 — Application Level**
- JWT authentication on all routes except public ones
- RBAC guards on sensitive endpoints
- Input validation with whitelist stripping

**Layer 4 — Data Level**
- Passwords hashed with bcrypt (10 salt rounds)
- Sensitive data never returned in responses
- UUID primary keys (non-sequential, harder to guess)

### Environment Variables Security
All sensitive credentials stored in `.env` file:
- Database connection string
- JWT secret key
- SMTP credentials
- Groq API key

The `.env` file is in `.gitignore` and never pushed to GitHub.

---

## 9. Testing

### Testing Strategy
The project uses **Jest** testing framework built into NestJS.

### Test Coverage

**AuthService Tests (5 tests)**

| Test | Expected Result |
|---|---|
| Register with valid data | Returns 201 with token |
| Register with existing email | Throws ConflictException |
| Login with correct credentials | Returns 200 with token |
| Login with non-existing email | Throws UnauthorizedException |
| Login with wrong password | Throws UnauthorizedException |

**SchoolsService Tests (6 tests)**

| Test | Expected Result |
|---|---|
| Get all schools | Returns array with meta |
| Get one school valid ID | Returns school object |
| Get one school invalid ID | Throws NotFoundException |
| Create school | Returns created school |
| Delete school valid ID | Returns success message |
| Delete school invalid ID | Throws NotFoundException |

### Running Tests
```bash
# Run all tests
npm run test

# Run with coverage report
npm run test:cov

# Run in watch mode
npm run test:watch
```

### Test Results
Test Suites: 2 passed, 2 total
Tests:       11 passed, 11 total
Time:        1.821s

### Mock Strategy
External dependencies are mocked using Jest mock functions:
- PrismaService — mocked to avoid real database calls
- UsersService — mocked in AuthService tests
- JwtService — mocked to return predictable tokens

---

## 10. Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|---|---|---|
| DATABASE_URL | PostgreSQL connection string | postgresql://user:pass@localhost:5432/db |
| JWT_SECRET | Secret key for JWT signing | your-secret-key |
| SMTP_HOST | Email server host | smtp.gmail.com |
| SMTP_PORT | Email server port | 587 |
| SMTP_USER | Email account username | email@gmail.com |
| SMTP_PASS | Gmail app password | xxxx xxxx xxxx xxxx |
| GROQ_API_KEY | Groq API key for AI search | gsk_xxxxxxxxxxxx |

### Configuration Module
NestJS ConfigModule is configured globally allowing all modules to access environment variables via `process.env`.

---

## 11. Error Handling

### HTTP Exception Types Used

| Exception | Status Code | When Used |
|---|---|---|
| BadRequestException | 400 | Invalid input data |
| UnauthorizedException | 401 | Invalid or missing token |
| ForbiddenException | 403 | Insufficient role permissions |
| NotFoundException | 404 | Resource not found |
| ConflictException | 409 | Duplicate resource |
| TooManyRequestsException | 429 | Rate limit exceeded |

### Global Validation
All request bodies are validated using `class-validator` decorators. Invalid requests return 400 with detailed error messages explaining exactly which fields are invalid.

### Error Response Format
```json
{
  "message": ["email must be an email"],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## 12. Future Improvements

### Short Term
- Email verification on registration
- Password reset via email
- School profile image upload via Cloudinary
- Bulk school import from CSV/Excel

### Medium Term
- Full text search with PostgreSQL FTS
- School performance metrics integration
- Mobile push notifications
- Multi-language support (Kinyarwanda, French, English)

### Long Term
- Expand to primary schools and universities
- Online application processing
- Real-time enrollment tracking
- Advanced analytics dashboard
- Mobile application (React Native)

---

## Appendix — Tech Stack Summary

| Category | Technology | Version |
|---|---|---|
| Runtime | Node.js | 22 |
| Framework | NestJS | 11 |
| Language | TypeScript | 5.9 |
| Database | PostgreSQL | 16 |
| ORM | Prisma | 5 |
| Authentication | JWT + Passport | - |
| Password Hashing | bcrypt | - |
| Email | Nodemailer | - |
| AI Search | Groq SDK (LLaMA 3.3 70B) | - |
| Security | Helmet + Throttler | - |
| Testing | Jest | - |
| Package Manager | npm | - |

---

