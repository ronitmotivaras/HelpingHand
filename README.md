# 🤝 HelpingHand

<p align="center">
  <strong>A Community-Driven Food Redistribution & Surplus Donation Platform</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/Express-5.2.1-000000?logo=express&logoColor=white" alt="Express 5" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose%209-47A248?logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Bootstrap-5.3.3-7952B3?logo=bootstrap&logoColor=white" alt="Bootstrap 5" />
  <img src="https://img.shields.io/badge/JWT-Protected-black?logo=jsonwebtokens&logoColor=white" alt="JWT" />
</p>

---

## 📖 Overview

**HelpingHand** connects food donors (households, restaurants, event organizers, caterers) with verified charitable organizations, shelters, and community kitchens to eliminate edible food waste and combat hunger.

The project is structured into two dedicated applications sharing a central database:
1. **User Portal (`portal/`)**: Dual-role public portal for food donors and verified NGOs.
2. **Admin Portal (`admin/`)**: Back-office operations interface for NGO credential verification, moderation, and fraud prevention.

---

## 🏛️ System Architecture & Ports

```
HelpingHand/
├── portal/                   # Donor & NGO Public Platform
│   ├── client/               # React 18 SPA (Port 3000)
│   └── server/               # Express 5 REST API (Port 5000)
│
└── admin/                    # Platform Admin & Moderation
    ├── client/               # React 18 SPA (Port 3001)
    └── server/               # Express 5 REST API (Port 5001)
```

| Component | Layer | Port | URL / Health Check | Description |
|---|---|:---:|---|---|
| **Portal Client** | Frontend | `3000` | [http://localhost:3000](http://localhost:3000) | Donor & NGO dashboard, listings, and notifications |
| **Portal Server** | Backend | `5000` | [http://localhost:5000/api/health](http://localhost:5000/api/health) | Auth, donation lifecycle, and automated expiry daemon |
| **Admin Client** | Frontend | `3001` | [http://localhost:3001](http://localhost:3001) | Administrative review, verification, and moderation |
| **Admin Server** | Backend | `5001` | [http://localhost:5001/api/admin/health](http://localhost:5001/api/admin/health) | Admin auth, analytics, and telephone blacklist APIs |
| **Database** | Storage | `27017` | `mongodb://127.0.0.1:27017/helpinghand` | Central MongoDB database |

---

## 🔄 How It Works

```mermaid
sequenceDiagram
    autonumber
    actor Donor as 🍱 Food Donor
    participant System as ⚙️ HelpingHand
    actor NGO as 🏢 Verified NGO
    actor Admin as 🛡️ Platform Admin

    Admin->>NGO: Reviews & Approves NGO Verification Application
    Donor->>System: Publishes Surplus Food Listing (Items, Quantities, Pickup Window)
    System->>NGO: Food Listing Appears on Feed & Alerts Verified NGOs
    NGO->>System: Submits Pickup Request
    System->>Donor: Real-Time In-App Alert of Incoming Request
    Donor->>System: Inspects NGO Credentials & Accepts Request
    System->>NGO: Confirms Handover Details & Direct Contact Info
    NGO->>Donor: Collects Food at Location
    Donor->>System: Marks Donation as "Picked Up"
```

---

## 🌟 Main Features

### 🍱 For Food Donors
- **Itemized Multi-Item Listings**: List multiple food items in a single post with custom quantities and units (`portions`, `kg`, `packets`, `pieces`, `litres`).
- **Dietary & Safety Details**: Categorize by dietary type (`veg`, `nonveg`, `mixed`) with precise pickup windows (`pickupFrom`, `pickupTo`) and expiration deadlines.
- **Request Management**: Inspect requesting NGOs (verification status, coordinator name, contact) and choose to **Accept** or **Decline**.
- **Handover Control**: Re-open/release a listing back to `available` if an NGO does not show up, or mark as `pickedUp` upon completion.
- **Real-Time Notifications**: Instant alerts for incoming requests, confirmations, and updates.
- **History & Tracking**: View active donations and past completed handovers.

### 🏢 For Verified NGOs
- **Verified Status Badge**: Apply for verified NGO status with organization and coordinator credentials.
- **Smart Food Feed**: Browse available surplus food filtered by city and dietary preference.
- **One-Click Requests**: Place pickup requests directly on available listings.
- **Direct Coordination**: Immediate access to donor phone and address once accepted.

### 🛡️ For Platform Administrators
- **Executive Analytics**: Real-time stats on registered donors, verified NGOs, pending applications, active listings, and completed handovers.
- **NGO Verification Pipeline**: Review organization credentials, coordinator phone, and address; **Approve**, **Reject**, or reset to **Pending** with confirmation modals and auto-focus for quick enter-key actions.
- **User Directory**: Search, inspect, edit, block, unblock, or delete registered donor and NGO accounts.
- **Fraud Prevention & Phone Blacklist**: Suspend bad actors with a mandatory audit reason. Blacklisted phone numbers are automatically blocked from future registrations.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, React Router v6, Bootstrap 5, Lucide React, React Hot Toast, Axios
- **Backend**: Node.js (v18+), Express 5, Mongoose 9, JWT (`jsonwebtoken`), bcryptjs
- **Database**: MongoDB
- **Background Jobs**: `node-cron` (auto-expires uncollected food listings past pickup deadlines)

---

## 🚀 Complete Setup & Run Guide

### Step 1: Prerequisites
Make sure the following are installed on the computer:
1. **[Node.js](https://nodejs.org/)** (v18 or higher) — check with `node -v`
2. **[Git](https://git-scm.com/)** — check with `git --version`
3. **[MongoDB Community Server](https://www.mongodb.com/try/download/community)** (Windows MSI Installer)
   * During installation, keep **"Install MongoD as a Service"** checked so MongoDB runs in the background.
   * You do **not** need to manually create any database tables or collections. When the backend boots, Mongoose automatically generates the `helpinghand` database and all required collections/indexes.

### Step 2: Clone Repository
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd HelpingHand
```

### Step 3: Configure Environment Files (`.env`)
Create the following **4 `.env` files** in their respective directories:

#### 1. User Portal Backend (`portal/server/.env`)
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/helpinghand
USER_JWT_SECRET=helpinghand_dev_secret_change_me
```

#### 2. User Portal Frontend (`portal/client/.env`)
```env
PORT=3000
REACT_APP_API_URL=http://localhost:5000
BROWSER=none
```

#### 3. Admin Backend (`admin/server/.env`)
```env
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/helpinghand
ADMIN_JWT_SECRET=helpinghand_admin_dev_secret_change_me
ADMIN_PASSWORD=admin123
ADMIN_PASSWORD_HASH=
```
*(Leave `ADMIN_PASSWORD_HASH` blank to auto-hash `ADMIN_PASSWORD` on startup)*

#### 4. Admin Frontend (`admin/client/.env`)
```env
PORT=3001
REACT_APP_API_URL=http://localhost:5001
BROWSER=none
```

### Step 4: Install Dependencies

**Option A — All in one command (PowerShell / Windows):**
```powershell
npm --prefix portal/server install; npm --prefix portal/client install; npm --prefix admin/server install; npm --prefix admin/client install
```

**Option B — Individually:**
```bash
# 1. User Portal
cd portal/server && npm install
cd ../client && npm install

# 2. Admin Portal
cd ../../admin/server && npm install
cd ../client && npm install
```

### Step 5: Start Services
Open **4 separate terminal windows** (or split terminals):

```bash
# Terminal 1: User Portal Backend (Port 5000)
cd portal/server && npm run dev

# Terminal 2: User Portal Frontend (Port 3000)
cd portal/client && npm start

# Terminal 3: Admin Backend (Port 5001)
cd admin/server && npm run dev

# Terminal 4: Admin Frontend (Port 3001)
cd admin/client && npm start
```

### Step 6: Default Credentials & Access

| Application | URL | Default Login |
|---|---|---|
| **User Portal** | [http://localhost:3000](http://localhost:3000) | Register directly as **Donor** or **NGO** |
| **Admin Portal** | [http://localhost:3001](http://localhost:3001) | Default Password: `admin123` |

---

## 💡 Troubleshooting & Database Reset

- **MongoDB Connection Error (`ECONNREFUSED 127.0.0.1:27017`)**:
  - Open Windows **Services** (`services.msc`) and verify that `MongoDB Server` status is **Running**.
- **Port Conflict (`EADDRINUSE`)**:
  - Verify that ports `3000`, `3001`, `5000`, or `5001` are not being used by other software.
- **Database Reset / Clear Data**:
  - To wipe test data while keeping the admin login intact, run:
    ```bash
    cd admin/server && node scripts/clearAllData.js
    ```
