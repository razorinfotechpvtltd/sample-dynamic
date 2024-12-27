const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const { connectMainDB } = require('./config/database');
const { workspaceDomain } = require('./middlewares/workspaceMiddleware');
const workspaceRoutes = require('./routes/workspaceRoutes');
const handleValidation = require("./validation/errorHandler");
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to the main database
connectMainDB();

// Middleware
app.use(cors());
app.use(helmet()); // Adds security headers
app.use(bodyParser.json()); // Parses incoming JSON payloads
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files
app.use(workspaceDomain); // Subdomain middleware

// Routes
app.use('/api', workspaceRoutes); // API-specific routes

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ message: 'API route not found.' });
});
app.use(handleValidation.handleError());
// Fallback for all other undefined routes (Serve 404 HTML)
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
