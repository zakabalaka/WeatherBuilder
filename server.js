const express = require('express');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
const axios = require('axios');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(express.json()); // Parse JSON requests
app.use(cors()); // Allow cross-origin requests

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// @ts-ignore
app.get('/api/weather/history', (req, res) => {
    fs.readFile('searchHistory.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read search history' });
        }
        res.json(JSON.parse(data));
    });
});

// @ts-ignore
app.post('/api/weather', async (req, res) => {
    const { city } = req.body;
    if (!city) {
        return res.status(400).json({ error: 'City name is required' });
    }

    try {
        const geoResponse = await axios.get(`http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${process.env.API_KEY}`);
        if (!geoResponse.data.length) {
            return res.status(404).json({ error: 'City not found' });
        }
        const { lat, lon } = geoResponse.data[0];

        const weatherResponse = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.API_KEY}`);

        const newEntry = { id: uuidv4(), city };
        fs.readFile('searchHistory.json', 'utf8', (err, data) => {
            const history = err ? [] : JSON.parse(data);
            history.push(newEntry);
            fs.writeFile('searchHistory.json', JSON.stringify(history, null, 2), () => {});
        });
        res.json(weatherResponse.data);
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving weather data' });
    }
});

// @ts-ignore
app.delete('/api/weather/history/:id', (req, res) => {
    fs.readFile('searchHistory.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read search history' });
        }
        let history = JSON.parse(data);
        // @ts-ignore
        history = history.filter(entry => entry.id !== req.params.id);
        fs.writeFile('searchHistory.json', JSON.stringify(history, null, 2), (writeErr) => {
            if (writeErr) {
                return res.status(500).json({ error: 'Failed to update search history' });
            }
            res.json({ message: 'City deleted successfully' });
        });
    });
});

// @ts-ignore
async function getWeather(city) {
    const response = await fetch('/api/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city })
    });
    const data = await response.json();
    updateUI(data);
}

/**
 * @param {{ city: { name: string | null; }; list: { main: { temp: any; }; }[]; }} data
 */
function updateUI(data) {
    // @ts-ignore
    document.getElementById('city-name').textContent = data.city.name;
    // @ts-ignore
    document.getElementById('temperature').textContent = `Temperature: ${data.list[0].main.temp}°C`;
}


// @ts-ignore
document.getElementById('history').addEventListener('click', (event) => {
    // @ts-ignore
    if (event.target.classList.contains('city-item')) {
        getWeather(event.target.textContent);
    }
});