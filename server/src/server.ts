import * as dotenv from 'dotenv';
import express from 'express';
import path from 'path'; // Import path module for serving static files
import cors from 'cors'; // Import CORS middleware if needed
dotenv.config();

// Import the routes
import routes from './routes/index.js';

const app = express();

const PORT = process.env.PORT || 3001;

// **Serve static files from the client `dist` folder**  
app.use(express.static(path.resolve('client', 'dist')));

// **Middleware for parsing JSON and urlencoded form data**  
app.use(express.json());  
app.use(express.urlencoded({ extended: true }));  
app.use(cors()); // If your frontend is hosted separately, enable CORS

// **Middleware to connect the routes**  
app.use('/api', routes); // Prefix all routes with `/api`

// **Serve index.html for all unknown routes (SPA handling)**  
app.get('*', (_req, res) => {
    res.sendFile(path.resolve('client', 'dist', 'index.html'));

});

// **Start the server on the port**  
app.listen(PORT, () => console.log(`Listening on PORT: ${PORT}`));
