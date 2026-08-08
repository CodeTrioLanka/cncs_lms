# 🎓 Learning Management System (LMS)

A modern, high-performance Learning Management System built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **MongoDB**, **Google Drive API**, and **YouTube Data API v3**.

This platform provides automated dual-cloud file routing: video lectures are hosted on YouTube as unlisted videos, while documents, presentations, spreadsheets, and course materials are stored securely in organized Google Drive subject folders. Centralized metadata, categories, and subject indexing are managed through MongoDB.

---

## 📋 Table of Contents

- [Key Features](#-key-features)
- [Architecture & Storage Routing](#-architecture--storage-routing)
- [Prerequisites](#-prerequisites)
- [Step-by-Step Installation & Setup](#-step-by-step-installation--setup)
  - [Step 1: Clone the Repository](#step-1-clone-the-repository)
  - [Step 2: Install Dependencies](#step-2-install-dependencies)
  - [Step 3: Setup MongoDB Database](#step-3-setup-mongodb-database)
  - [Step 4: Create a Google Account & YouTube Channel](#step-4-create-a-google-account--youtube-channel)
  - [Step 5: Setup Google Cloud Console Credentials](#step-5-setup-google-cloud-console-credentials)
  - [Step 6: Configure Environment Variables (`.env`)](#step-6-configure-environment-variables-env)
  - [Step 7: Generate Permanent Google OAuth Refresh Token](#step-7-generate-permanent-google-oauth-refresh-token)
  - [Step 8: Run the Development Server](#step-8-run-the-development-server)
- [Available Scripts](#-available-scripts)
- [API Endpoints](#-api-endpoints)
- [Tech Stack](#-tech-stack)
- [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 🌟 Key Features

- **Automated Dual-Cloud Storage Routing**: Automatically detects file types — videos are routed to YouTube and documents/spreadsheets/presentations to Google Drive.
- **Internal File & Video Preview**: View YouTube videos and Google Drive documents directly inside an internal modal preview player without opening external browser tabs.
- **Interactive Subject Autocomplete**: Smart filter-as-you-type subject input with full keyboard navigation (↑ / ↓ / Enter / Escape) and instant subject creation.
- **Post-Upload Subject Modification**: Owners can change a file's subject post-upload via an interactive modal (`✏️`). Changes instantly sync across MongoDB and update YouTube video metadata (descriptions & tags).
- **Structured Google Drive Storage**: Auto-creates nested folder structures per category (`Documents`, `Images`, `Assignments`, `Audio`, `Others`) and subject.
- **Secure File Deletion**: File deletion cleans up both cloud storage targets (Google Drive or YouTube) and MongoDB database records. Only file uploaders can modify or delete their files.
- **Unified Portal & Dashboard UI**: Identical, modern UI layout across public Home (`/`) and User Dashboard (`/dashboard`) with gradient category cards and real-time subject sidebar counts.
- **Automated OAuth CLI Helper**: Interactive script (`npm run get-token`) to obtain and save Google OAuth 2.0 refresh tokens directly to `.env`.

---

## 🏗️ Architecture & Storage Routing

```text
                       ┌──────────────────────┐
                       │  User File Upload    │
                       └──────────┬───────────┘
                                  │
                   Is file type a Video format?
                  (.mp4, .mkv, .avi, .mov, etc.)
                                 / \
                                /   \
                        YES   /       \   NO
                            /           \
                           ▼             ▼
              ┌──────────────────┐  ┌──────────────────┐
              │ YouTube Data API │  │ Google Drive API │
              │ (Unlisted Video) │  │  (Folder Tree)   │
              └────────┬─────────┘  └────────┬─────────┘
                       │                     │
                       └──────────┬──────────┘
                                  │
                                  ▼
                     ┌──────────────────────────┐
                     │     MongoDB Database     │
                     │  (Metadata & Indexing)   │
                     └──────────────────────────┘
```

---

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed and set up on your machine:

1. **Node.js**: `v18.x` or higher (Download from [nodejs.org](https://nodejs.org/))
2. **Package Manager**: `npm` (comes with Node.js)
3. **MongoDB**: Local MongoDB instance (e.g. MongoDB Community Server / Compass) or a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection URI
4. **Google Account**: An active Gmail account
5. **YouTube Channel**: A YouTube channel associated with your Google Account (required for video upload APIs)

---

## 🚀 Step-by-Step Installation & Setup

Follow these steps in order to get the project up and running smoothly.

### Step 1: Clone the Repository

Open your terminal or command prompt and clone the project repository:

```bash
git clone https://github.com/your-username/cncs_lms.git
cd cncs_lms
```

---

### Step 2: Install Dependencies

Run `npm install` to install all required dependencies listed in `package.json`:

```bash
npm install
```

---

### Step 3: Setup MongoDB Database

Create a MongoDB database for the LMS and copy the connection details into your environment file.

1. Create a MongoDB account and database.
   - If you use MongoDB Atlas, create a cluster and a database (for example, `cncs_lms`).
   - If you use a local MongoDB installation, make sure the server is running.
2. Create a database user and allow access to your IP address if you are using Atlas.
3. Copy your connection details:
   - **MongoDB URI**: the full connection string for your database
   - **Database name**: the name of the database you created
4. Add them to your `.env` file using the variables below.

Example:

```env
MONGODB_URI="Your MongoDB URI"
MONGODB_DBNAME="Your MongoDB Database Name"
```

> The application will automatically create the required collections (`users`, `subjects`, and `files`) when the APIs are first used.

---

### Step 4: Create a Google Account & YouTube Channel

1. Use or create a Google account at [accounts.google.com](https://accounts.google.com).
2. Create a YouTube channel linked to that Google account.
   - Go to [YouTube](https://www.youtube.com).
   - Sign in with your Google account.
   - Open your profile menu and choose **Create a channel**.
   - Complete the setup prompt.

> ⚠️ **Important**: YouTube uploads will fail with a `channelNotFound` error if the Google account does not have an active YouTube channel.

---

### Step 5: Setup Google Cloud Console Credentials

To enable Google Drive storage and YouTube uploads, configure Google Cloud Console and create OAuth credentials.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project, then name it `CNCS-LMS`.
3. Enable the required APIs:
   - **Google Drive API**
   - **YouTube Data API v3**
4. Open the **OAuth consent screen**:
   - Choose **External** as the user type.
   - Fill in the app name, support email, and developer contact details.
   - 🔴 **CRITICAL**: Change Publishing Status from **"Testing"** to **"In Production"** (Click **PUBLISH APP**). This ensures your refresh token **never expires after 7 days**.
5. Open **Credentials** and create a new credential:
   - Choose **OAuth client ID**
   - Select **Web application**
   - Give it a name such as `CNCS_LMS`
   - Add Authorized JavaScript origins:
   ```text
   http://localhost:3000
   ```
   - Add Authorized redirect URIs:
   ```text
   http://localhost:3000/api/auth/google/callback
   ```

6. Copy the **Client ID** and **Client Secret** into your `.env` file.

---

### Step 6: Configure Environment Variables (`.env`)

Create a `.env` file in the root directory:

```env
# MongoDB Configuration
MONGODB_URI="Your MongoDB URI"
MONGODB_DBNAME="Your MongoDB Database Name"

# Google OAuth Credentials
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"

# Google OAuth Refresh Token (generated in Step 7)
GOOGLE_REFRESH_TOKEN=""

# YouTube Upload Settings
YOUTUBE_PRIVACY_STATUS="unlisted"
```

---

### Step 7: Generate Permanent Google OAuth Refresh Token

The project includes an automated CLI helper to retrieve and automatically save your Google OAuth Refresh Token to `.env`.

1. Run the token generation script:

```bash
npm run get-token
```

2. Open the printed authorization URL in your web browser.
3. Sign in with your Google account and grant permissions for Google Drive and YouTube.
4. Google will redirect to your callback URL (`http://localhost:3000/api/auth/google/callback`), and the script will **automatically save `GOOGLE_REFRESH_TOKEN` into your `.env` file**!

---

### Step 8: Run the Development Server

Now you are ready to start the application:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to access the CNCS LMS portal.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server at `http://localhost:3000` |
| `npm run build` | Builds the application bundle for production |
| `npm run start` | Starts the production server |
| `npm run get-token` | Runs interactive OAuth CLI tool to fetch and save `GOOGLE_REFRESH_TOKEN` |
| `npm run lint` | Runs ESLint to check for code quality and formatting issues |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/upload` | Initializes resumable upload session (`filename`, `mimeType`, `fileSize`, `subject`, `storageType`). |
| `POST` | `/api/upload/chunk` | Streams chunked binary file slices (4MB per chunk) to bypass CORS and request body limits. |
| `POST` | `/api/upload/complete` | Finalizes upload and saves file metadata in MongoDB. |
| `GET` | `/api/files` | Query uploaded files (`?category=`, `?type=`, `?subject=`, `?userEmail=`, `?search=`). |
| `PATCH` | `/api/files` | Owner-only endpoint to update a file's subject (`{ fileId, newSubject }`). Automatically updates YouTube video tags and description for videos. |
| `DELETE` | `/api/files?id=<ID>` | Authenticated deletion of a file. Deletes target from YouTube or Google Drive and removes MongoDB record. |
| `GET` | `/api/subjects` | Fetches list of active subjects stored in MongoDB. |
| `POST` | `/api/auth/login` | Authenticates user credentials and sets `lms_session` cookie. |
| `POST` | `/api/auth/register` | Registers a new user account. |
| `GET` | `/api/auth/me` | Fetches currently authenticated user details from session cookie. |

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Frontend**: [React 19](https://react.dev/), Vanilla CSS Design System
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose 9](https://mongoosejs.com/)
- **APIs & Cloud Integrations**:
  - Google Drive API v3 (`googleapis`)
  - YouTube Data API v3 (`googleapis`)
- **Language**: TypeScript & Modern JavaScript (ES6+)

---

## ❓ Troubleshooting & FAQs

### 1. Error: `invalid_grant` or Refresh Token Expired Every 7 Days
- **Cause**: Google OAuth app is in **"Testing"** status on Google Cloud Console. Tokens issued under testing apps expire after 7 days.
- **Solution**: Go to Google Cloud Console ➔ **OAuth consent screen** ➔ Click **PUBLISH APP** (Set to Production). Then run `npm run get-token` once to generate a permanent refresh token.

### 2. Error: `channelNotFound` or YouTube API Upload Failed
- **Cause**: The Google account used to generate the refresh token does not have an active YouTube channel.
- **Solution**: Go to [YouTube](https://www.youtube.com), click your profile icon, click **Create a Channel**, complete setup, and re-run `npm run get-token`.

### 3. Database Connection Error (`MongooseServerSelectionError`)
- **Cause**: MongoDB server is not running or `MONGODB_URI` in `.env` is incorrect.
- **Solution**: Verify MongoDB service is running locally (`mongod` / MongoDB Compass) or check network access settings in MongoDB Atlas.

---

✨ **Happy Coding!** Developed by **[CodeTrioLanka](https://www.codetriolanka.lk/)**. Core Developer: **[CJ](https://www.codetriolanka.lk/team/chalana-jayod)**.
