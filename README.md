# Weekly Reports System

A full-stack web application for managing teams, projects, and weekly reports with an AI chat assistant.

## Tech Stack
- **Frontend**: Next.js (App Router), Tailwind CSS, Recharts
- **Backend**: Node.js, Express.js
- **Database**: MySQL, Prisma ORM
- **AI Integration**: Google Gemini API

---

## Setup Instructions

Follow these steps to get the project running locally.

### 1. Prerequisites
- **Node.js**: v18.x or higher
- **MySQL**: Ensure you have a local MySQL server running
- **npm** or **yarn**

### 2. Database Setup

1. Create a new MySQL database for the project (e.g., `weekly_reports`).
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Copy the example environment file or create a `.env` file:
   ```env
   # backend/.env
   PORT=5000
   DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/weekly_reports"
   JWT_SECRET="your_super_secret_jwt_key_here"
   GEMINI_API_KEY="your_google_gemini_api_key_here"
   ```
   *(Replace `USER` and `PASSWORD` with your MySQL credentials, and provide a valid Gemini API key for the AI chat to work).*
4. Run Prisma migrations to create the database tables:
   ```bash
   npx prisma migrate dev --name init
   ```
5. (Optional) You may want to seed the database or manually insert an initial "Manager" user to access all dashboard features.

### 3. Running the Backend

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   node server.js
   ```
   *(The backend server will run on `http://localhost:5000`)*

### 4. Running the Frontend

1. Open a new, separate terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## Troubleshooting

- **Port 5000 in use:** If the backend fails to start because port 5000 is in use, you can kill the existing process (on Windows):
  ```powershell
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  ```
- **Gemini API Errors:** If the AI Chat widget throws an error, ensure your `GEMINI_API_KEY` is correct in `backend/.env` and that you have enabled access to the Gemini API in the Google Cloud Console.
- **CSS Import Errors:** If you see `@import` errors in the frontend, ensure that `globals.css` places standard CSS `@import` rules (like Google Fonts) *before* Tailwind CSS imports.
