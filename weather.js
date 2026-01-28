// API Key - Using Open-Meteo (free, no API key needed)
const API_BASE = 'https://api.open-meteo.com/v1';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const cityNameEl = document.getElementById('cityName');
const currentDateEl = document.getElementById('currentDate');
const currentTimeEl = document.getElementById('currentTime');
const temperatureEl = document.getElementById('temperature');
const weatherIconEl = document.getElementById('weatherIcon');
const weatherDescEl = document.getElementById('weatherDesc');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('windSpeed');
const feelsLikeEl = document.getElementById('feelsLike');
const pressureEl = document.getElementById('pressure');
const hourlyForecastEl = document.getElementById('hourlyForecast');
const dailyForecastEl = document.getElementById('dailyForecast');
const loadingSpinnerEl = document.getElementById('loadingSpinner');
const errorMessageEl = document.getElementById('errorMessage');

// Weather icon mapping
const weatherIcons = {
    0: '☀️',      // Clear sky
    1: '🌤️',     // Mainly clear
    2: '⛅',      // Partly cloudy
    3: '☁️',      // Overcast
    45: '🌫️',    // Foggy
    48: '🌫️',    // Depositing rime fog
    51: '🌧️',    // Light drizzle
    53: '🌧️',    // Moderate drizzle
    55: '🌧️',    // Dense drizzle
    61: '🌧️',    // Slight rain
    63: '🌧️',    // Moderate rain
    65: '⛈️',    // Heavy rain
    71: '❄️',     // Slight snow
    73: '❄️',     // Moderate snow
    75: '❄️',     // Heavy snow
    77: '❄️',     // Snow grains
    80: '🌧️',    // Slight rain showers
    81: '🌧️',    // Moderate rain showers
    82: '⛈️',    // Violent rain showers
    85: '❄️',     // Slight snow showers
    86: '❄️',     // Heavy snow showers
    95: '⛈️',    // Thunderstorm
    96: '⛈️',    // Thunderstorm with slight hail
    99: '⛈️',    // Thunderstorm with heavy hail
};

const weatherDescriptions = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
};

// Get weather icon and description
function getWeatherInfo(code) {
    return {
        icon: weatherIcons[code] || '🌤️',
        description: weatherDescriptions[code] || 'Unknown'
    };
}

// Show/hide loading spinner
function showLoading(show = true) {
    loadingSpinnerEl.classList.toggle('hidden', !show);
}

// Show error message
function showError(message) {
    errorMessageEl.textContent = message;
    errorMessageEl.classList.remove('hidden');
    setTimeout(() => {
        errorMessageEl.classList.add('hidden');
    }, 5000);
}

// Update time display
function updateTime() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    const timeStr = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    currentDateEl.textContent = dateStr;
    currentTimeEl.textContent = timeStr;
}

// Fetch coordinates from city name
async function getCoordinates(cityName) {
    try {
        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`
        );
        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            throw new Error('City not found');
        }
        
        const result = data.results[0];
        return {
            lat: result.latitude,
            lon: result.longitude,
            name: result.name,
            country: result.country
        };
    } catch (error) {
        showError('Could not find city. Please try again.');
        throw error;
    }
}

// Fetch weather data
async function fetchWeather(lat, lon, cityName) {
    try {
        showLoading(true);
        
        const response = await fetch(
            `${API_BASE}/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl&hourly=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`
        );
        
        if (!response.ok) throw new Error('Failed to fetch weather data');
        
        const data = await response.json();
        updateWeatherDisplay(data, cityName);
        showLoading(false);
    } catch (error) {
        showError('Failed to fetch weather data');
        showLoading(false);
        console.error(error);
    }
}

// Update weather display
function updateWeatherDisplay(data, cityName) {
    const current = data.current;
    const hourly = data.hourly;
    const daily = data.daily;
    
    // Update city name
    cityNameEl.textContent = cityName;
    
    // Update current weather
    const { icon, description } = getWeatherInfo(current.weather_code);
    temperatureEl.textContent = Math.round(current.temperature_2m) + '°C';
    weatherIconEl.textContent = icon;
    weatherDescEl.textContent = description;
    
    // Update details
    humidityEl.textContent = current.relative_humidity_2m + '%';
    windSpeedEl.textContent = current.wind_speed_10m.toFixed(1) + ' m/s';
    feelsLikeEl.textContent = Math.round(current.apparent_temperature) + '°C';
    pressureEl.textContent = Math.round(current.pressure_msl) + ' hPa';
    
    // Update hourly forecast
    updateHourlyForecast(hourly);
    
    // Update daily forecast
    updateDailyForecast(daily);
}

// Update hourly forecast
function updateHourlyForecast(hourly) {
    hourlyForecastEl.innerHTML = '';
    const now = new Date();
    
    for (let i = 0; i < Math.min(24, hourly.time.length); i++) {
        const time = new Date(hourly.time[i]);
        const temp = hourly.temperature_2m[i];
        const code = hourly.weather_code[i];
        const { icon } = getWeatherInfo(code);
        
        const hourlyItem = document.createElement('div');
        hourlyItem.className = 'hourly-item';
        hourlyItem.innerHTML = `
            <div class="hourly-time">${time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
            <div class="hourly-icon">${icon}</div>
            <div class="hourly-temp">${Math.round(temp)}°C</div>
        `;
        hourlyForecastEl.appendChild(hourlyItem);
    }
}

// Update daily forecast
function updateDailyForecast(daily) {
    dailyForecastEl.innerHTML = '';
    
    for (let i = 0; i < Math.min(5, daily.time.length); i++) {
        const date = new Date(daily.time[i]);
        const maxTemp = daily.temperature_2m_max[i];
        const minTemp = daily.temperature_2m_min[i];
        const code = daily.weather_code[i];
        const { icon } = getWeatherInfo(code);
        
        const dailyItem = document.createElement('div');
        dailyItem.className = 'daily-item';
        dailyItem.innerHTML = `
            <div class="daily-day">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <div class="daily-icon">${icon}</div>
            <div class="daily-temps">
                <div>
                    <div class="daily-max">${Math.round(maxTemp)}°</div>
                </div>
                <div>
                    <div class="daily-min">${Math.round(minTemp)}°</div>
                </div>
            </div>
        `;
        dailyForecastEl.appendChild(dailyItem);
    }
}

// Search weather
async function searchWeather() {
    const cityName = searchInput.value.trim();
    if (!cityName) {
        showError('Please enter a city name');
        return;
    }
    
    try {
        const coords = await getCoordinates(cityName);
        await fetchWeather(coords.lat, coords.lon, `${coords.name}, ${coords.country}`);
    } catch (error) {
        console.error(error);
    }
}

// Get current location
function getCurrentLocation() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser');
        return;
    }
    
    showLoading(true);
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                // Get city name from coordinates
                const response = await fetch(
                    `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=en`
                );
                const data = await response.json();
                const cityName = data.results?.[0]?.name || 'Your Location';
                
                await fetchWeather(latitude, longitude, cityName);
            } catch (error) {
                showError('Failed to get location weather');
                showLoading(false);
            }
        },
        (error) => {
            showError('Unable to access your location');
            showLoading(false);
            console.error(error);
        }
    );
}

// Event listeners
searchBtn.addEventListener('click', searchWeather);
locationBtn.addEventListener('click', getCurrentLocation);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchWeather();
});

// Initialize
updateTime();
setInterval(updateTime, 1000);

// Load default city
window.addEventListener('load', () => {
    searchInput.value = 'London';
    searchWeather();
});
