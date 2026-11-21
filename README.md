# CampusFind

CampusFind is a campus lost-and-found web application built with HTML, CSS, JavaScript, Node.js, Express, MongoDB, and JWT authentication.

## Requirements
- Node.js (LTS)
- MongoDB (local instance or MongoDB Atlas)

## Run the backend
1. Open a terminal in the `backend` folder.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env`.
4. Set `MONGO_URI` to your MongoDB connection string and set `JWT_SECRET` to a long random value.
5. Start the server: `npm start`
6. Open `https://campusfind-cl7z.onrender.com/api/test` to confirm the API is running.

## Open the frontend
For local development, serve the project root with a local static server (for example, VS Code Live Server). The current frontend pages call the backend at `https://campusfind-cl7z.onrender.com`; deployment configuration will be handled in a later step.

## Security note
Never commit or share your `.env` file. This refreshed project archive intentionally excludes `.env`, `.git`, and `node_modules`. Keep your original local `.env` file safe and copy its values into your new local `.env` file when setting up the project.
