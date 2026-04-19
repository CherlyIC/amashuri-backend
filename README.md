# Amashuri.rw — Rwanda's Secondary School Directory

![Amashuri.rw](https://img.shields.io/badge/Amashuri.rw-Rwanda's%20School%20Directory-1F4E79)
![NestJS](https://img.shields.io/badge/NestJS-11-red)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Prisma](https://img.shields.io/badge/Prisma-5-green)
![Jest](https://img.shields.io/badge/Tests-11%20Passing-brightgreen)

## Overview
Amashuri.rw is a comprehensive digital platform designed to 
revolutionize access to secondary school information across Rwanda. 
The system enables parents, students, and educators to make informed 
educational decisions through accessible, accurate, and comparable 
school data.


## Technology Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | v22 | Runtime environment |
| NestJS | 11 | Backend framework |
| PostgreSQL | 16 | Relational database |
| Prisma | 5 | ORM |
| JWT | - | Authentication |
| bcrypt | - | Password hashing |
| Nodemailer | - | Email service |
| Groq SDK | - | AI search (LLaMA 3.3 70B) |
| Helmet | - | Security headers |
| Throttler | - | Rate limiting |

### Frontend (Coming Soon)
| Technology | Purpose |
|---|---|
| Next.js 14 | Frontend framework |
| Tailwind CSS | Styling |
| Redux Toolkit | State management |
| Leaflet.js | Interactive maps |
| Chart.js | Comparison charts |

---

## Features

-  **School Directory** — Comprehensive database of secondary schools across all provinces of Rwanda
-  **AI-Powered Search** — Natural language search using LLaMA 3.3 70B via Groq API with 4 intent types
-  **Advanced Filtering** — Filter by district, province, school type, gender policy, fees, combinations and resources
-  **School Comparison** — Compare up to 5 schools side by side with full profile data
-  **Reviews and Ratings** — Community driven school reviews with multi-dimensional ratings
-  **Favourites** — Save and manage favourite schools
-  **Enquiry System** — Contact schools directly with automatic email delivery
-  **Geolocation** — Find schools near your location using Haversine formula
-  **Recommendations** — Personalized school recommendations based on user history
-  **Role-Based Access Control** — USER, SCHOOL_ADMIN, and ADMIN roles
- **Security** — Helmet, CORS, Rate Limiting, JWT authentication

---

## AI Search — How It Works

The AI search uses **Groq API with LLaMA 3.3 70B Versatile** model to understand natural language queries.

### Query Flow
User types a query
↓
Controller receives it
↓
Service checks if query is empty or too short
↓
Single Groq call analyzes the query and returns:

intent (what the user wants)
params (extracted filters)
pendingMessage (initial response)
↓
Route to the right handler based on intent
↓
Return results + friendly message

### 4 Intent Types

| Intent | Example Query | What Happens |
|---|---|---|
| `search` | "girls boarding school in Kigali" | Extract filters → query DB → return schools |
| `recommendation` | "best school in Rwanda" | Fetch top rated schools → return top 10 |
| `general_education` | "what is the difference between PCM and MCB" | Groq answers from its own knowledge |
| `out_of_scope` | "what is the weather today" | Politely decline and give example queries |

### Fallback System
If Groq API fails, the system automatically falls back to basic keyword search in the database ensuring users never see a broken experience.

---

## Prerequisites

Make sure you have the following installed:
- Node.js v18 or higher
- PostgreSQL 16
- npm

---

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/CherlyIC/amashuri-backend.git
cd amashuri-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Create a `.env` file in the root directory:
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/amashuri_db?schema=public"
JWT_SECRET=your-jwt-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
GROQ_API_KEY=your-groq-api-key

### 4. Set Up the Database
```bash
# Run migrations
npx prisma migrate dev

# Seed the database with initial data
npm run seed
```

### 5. Run the Application
```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

The API will be available at `http://localhost:3000`

---

## Running Tests

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:cov
```
---

## API Endpoints Summary

###  Authentication
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /auth/register | Register new user | Public |
| POST | /auth/login | Login user | Public |

###  Schools
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /schools | Get all schools with filters | Public |
| GET | /schools/:id | Get one school full profile | Public |
| GET | /schools/nearby | Get nearby schools | Public |
| POST | /schools | Create school | Admin |
| PUT | /schools/:id | Update school | Admin/School Admin |
| DELETE | /schools/:id | Delete school | Admin |
| PUT | /schools/:id/submit | Submit for verification | Admin/School Admin |

###  Fees
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /schools/:id/fees | Get school fees | Public |
| POST | /schools/:id/fees | Add fee | Admin/School Admin |
| PUT | /schools/fee/:id | Update fee | Admin/School Admin |
| DELETE | /schools/fee/:id | Delete fee | Admin |

###  Combinations
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /schools/:id/combinations | Get combinations | Public |
| POST | /schools/:id/combinations | Add combination | Admin/School Admin |
| DELETE | /schools/combinations/:id | Delete combination | Admin |

###  School Resources
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /schools/:id/resources | Get resources | Public |
| POST | /schools/:id/resources | Add resources | Admin/School Admin |
| PUT | /schools/resources/:id | Update resources | Admin/School Admin |

###  Reviews
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /schools/:id/reviews | Get reviews | Public |
| POST | /schools/:id/reviews | Create review | User |
| PUT | /schools/reviews/:id | Update review | User |
| DELETE | /schools/reviews/:id | Delete review | User/Admin |

###  Favourites
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /users/favourites | Get my favourites | User |
| POST | /users/favourites/:schoolId | Save to favourites | User |
| DELETE | /users/favourites/:schoolId | Remove from favourites | User |

### Compare
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /compare | Compare schools | User |
| GET | /compare/history | Get comparison history | User |

###  Enquiries
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /enquiries | Send enquiry | User |
| GET | /enquiries/my | Get my enquiries | User |
| GET | /enquiries/school/:id | Get school enquiries | School Admin |
| GET | /enquiries | Get all enquiries | Admin |

### Users
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /users/me | Get my profile | User |
| PUT | /users/me | Update my profile | User |
| DELETE | /users/me | Delete my account | User |

### Admin
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /admin/stats | Platform statistics | Admin |
| GET | /admin/users | Get all users | Admin |
| PUT | /admin/users/:id/role | Change user role | Admin |
| GET | /admin/schools/pending | Get pending schools | Admin |
| PUT | /admin/schools/:id/verify | Verify school | Admin |
| POST | /admin/schools/assign-admin | Assign school admin | Admin |

### AI Search
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /search/ai?q= | AI natural language search | Public |

### Recommendations
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /recommendations | Get my recommendations | User |
| GET | /recommendations/schools/:id/similar | Get similar schools | Public |

---

## Database Schema

The system uses **10 database tables**:

| Table | Description |
|---|---|
| User | Platform users with roles |
| School | Secondary school profiles |
| Fee | School fee structures |
| Combination | Subject combinations |
| SchoolResource | School facilities |
| Review | User reviews and ratings |
| Favourite | User saved schools |
| Enquiry | School enquiry messages |
| Comparison | Comparison history |
| SchoolAdmin | School admin assignments |

---

## Project Structure
src/
├── admin/              ← Admin dashboard module
├── auth/               ← Authentication and authorization
│   ├── jwt.strategy.ts
│   ├── jwt-auth.guard.ts
│   ├── roles.guard.ts
│   ├── roles.decorator.ts
│   └── public.decorator.ts
├── combinations/       ← Subject combinations module
├── compare/            ← School comparison module
├── enquiries/          ← Enquiry and email module
├── favourites/         ← Favourites module
├── fees/               ← School fees module
├── prisma/             ← Database service
├── recommendations/    ← Recommendations module
├── resources/          ← School resources module
├── reviews/            ← Reviews and ratings module
├── schools/            ← Schools module
├── search/             ← AI Search module (Groq)
└── users/              ← User profile module
---

## Security Features

| Feature | Implementation |
|---|---|
| Password Hashing | bcrypt with salt rounds 10 |
| Authentication | JWT tokens with 7 day expiry |
| Authorization | Role-based access control (RBAC) |
| Rate Limiting | 10 requests/second, 100 requests/minute |
| Security Headers | Helmet middleware |
| CORS | Configured for frontend domains |
| Input Validation | class-validator on all DTOs |
| Environment Variables | Secured in .env file |

---

## Seeded Data

After running `npm run seed` the database will contain:
- **1 Admin account** 
- **24 verified schools** across all 5 provinces of Rwanda
- Each school has combinations, resources and fees

---



## Groq API

This project uses **Groq API** with **LLaMA 3.3 70B Versatile** model for AI search.

### Free Tier Limits
- 30 requests per minute
- 14,400 requests per day
- 6,000 tokens per minute

Get your free API key at: **console.groq.com**

---

