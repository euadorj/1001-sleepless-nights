// ===========================
// WEATHER STATION LOCATOR APP
// ===========================

// Configuration
const CONFIG = {
    WEATHER_STATIONS_API: 'https://api.data.gov.sg/v1/environment/2-hour-weather-forecast',
    RAINFALL_API: 'https://api.data.gov.sg/v1/environment/rainfall',
    STATION_LOCATIONS_API: 'https://api.data.gov.sg/v1/environment/air-temperature',
    MAP_DEFAULT_ZOOM: 13,
    SEARCH_RADIUS_KM: 5
};

// State management
const appState = {
    userLocation: null,
    map: null,
    userMarker: null,
    stationMarkers: [],
    nearestStation: null,
    weatherData: null,
    rainfallData: null
};

// ===========================
// INITIALIZATION
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    try {
        await getUserLocation();
        await initializeMap();
        await fetchWeatherData();
        await fetchRainfallData();
        // displayNearestStation();
        displayRainForecast();
        displayUmbrellaRecommendation();
    } catch (error) {
        handleError(error);
    }
}

// ===========================
// GEOLOCATION
// ===========================

function getUserLocation() {
    return new Promise((resolve, reject) => {
        const statusEl = document.getElementById('status');
        
        if (!navigator.geolocation) {
            updateStatus('Geolocation is not supported by your browser.', 'error');
            reject(new Error('Geolocation not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                appState.userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                updateStatus(`Location found: ${appState.userLocation.lat.toFixed(4)}, ${appState.userLocation.lng.toFixed(4)}`, 'success');
                resolve();
            },
            (error) => {
                let errorMessage = 'Unable to retrieve your location. ';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += 'Permission denied. Please enable location access.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage += 'The request timed out.';
                        break;
                    default:
                        errorMessage += 'An unknown error occurred.';
                }
                updateStatus(errorMessage, 'error');
                showRetryButton();
                reject(new Error(errorMessage));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

// ===========================
// MAP INITIALIZATION
// ===========================

function initializeMap() {
    const mapContainer = document.getElementById('map');
    
    const mapOptions = {
        zoom: CONFIG.MAP_DEFAULT_ZOOM,
        center: {
            lat: appState.userLocation.lat,
            lng: appState.userLocation.lng
        },
        mapTypeControl: true,
        fullscreenControl: true,
        streetViewControl: false
    };

    appState.map = new google.maps.Map(mapContainer, mapOptions);

    // Add user location marker
    appState.userMarker = new google.maps.Marker({
        position: {
            lat: appState.userLocation.lat,
            lng: appState.userLocation.lng
        },
        map: appState.map,
        title: 'Your Location',
        icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
    });

    // Add accuracy circle
    new google.maps.Circle({
        center: {
            lat: appState.userLocation.lat,
            lng: appState.userLocation.lng
        },
        radius: appState.userLocation.accuracy,
        map: appState.map,
        fillColor: '#4285F4',
        fillOpacity: 0.1,
        strokeColor: '#4285F4',
        strokeOpacity: 0.3,
        strokeWeight: 1
    });
}

// ===========================
// WEATHER DATA FETCHING
// ===========================

async function fetchWeatherData() {
    try {
        const response = await fetch(CONFIG.WEATHER_STATIONS_API);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        appState.weatherData = await response.json();
        return appState.weatherData;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        throw error;
    }
}

async function fetchRainfallData() {
    try {
        const response = await fetch(CONFIG.RAINFALL_API);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        appState.rainfallData = await response.json();
        return appState.rainfallData;
    } catch (error) {
        console.error('Error fetching rainfall data:', error);
        throw error;
    }
}

// ===========================
// STATION PROCESSING
// ===========================

function findNearestStation() {
    if (!appState.weatherData || !appState.weatherData.metadata) {
        return null;
    }

    const stations = appState.weatherData.metadata.stations;
    let nearestStation = null;
    let minDistance = Infinity;

    stations.forEach(station => {
        const distance = calculateDistance(
            appState.userLocation.lat,
            appState.userLocation.lng,
            station.location.latitude,
            station.location.longitude
        );

        if (distance < minDistance) {
            minDistance = distance;
            nearestStation = {
                ...station,
                distance: distance
            };
        }
    });

    appState.nearestStation = nearestStation;
    return nearestStation;
}

function getNearbyStations(limit = 5) {
    if (!appState.weatherData || !appState.weatherData.metadata) {
        return [];
    }

    const stations = appState.weatherData.metadata.stations;
    const stationsWithDistance = stations.map(station => ({
        ...station,
        distance: calculateDistance(
            appState.userLocation.lat,
            appState.userLocation.lng,
            station.location.latitude,
            station.location.longitude
        )
    }));

    return stationsWithDistance
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);
}

// ===========================
// DISPLAY FUNCTIONS
// ===========================

function displayNearestStation() {
    const station = findNearestStation();
    const stationInfoEl = document.getElementById('stationInfo');

    if (!station) {
        stationInfoEl.innerHTML = '<p class="error">Unable to find nearest weather station.</p>';
        return;
    }

    const html = `
        <div class="station-card">
            <h3>${station.name}</h3>
            <div class="station-details">
                <p><strong>Distance:</strong> ${station.distance.toFixed(2)} km</p>
                <p><strong>Latitude:</strong> ${station.location.latitude.toFixed(4)}</p>
                <p><strong>Longitude:</strong> ${station.location.longitude.toFixed(4)}</p>
                <p><strong>ID:</strong> ${station.id}</p>
            </div>
        </div>
    `;

    stationInfoEl.innerHTML = html;

    // Add marker for nearest station
    new google.maps.Marker({
        position: {
            lat: station.location.latitude,
            lng: station.location.longitude
        },
        map: appState.map,
        title: station.name,
        icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
    });

    // Add line connecting user to station
    new google.maps.Polyline({
        path: [
            { lat: appState.userLocation.lat, lng: appState.userLocation.lng },
            { lat: station.location.latitude, lng: station.location.longitude }
        ],
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 0.7,
        strokeWeight: 2,
        map: appState.map
    });
}

function displayRainForecast() {
    const forecastEl = document.getElementById('rainForecast');

    if (!appState.weatherData || !appState.weatherData.items) {
        forecastEl.innerHTML = '<p class="error">Unable to load forecast data.</p>';
        return;
    }

    const items = appState.weatherData.items;
    const forecasts = items.slice(0, 5); // Get first 5 hours

    let html = '<div class="forecast-grid">';

    forecasts.forEach((item, index) => {
        const timestamp = new Date(item.valid_period.start);
        const hour = timestamp.getHours();
        const minute = timestamp.getMinutes();
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        // Find forecast for nearest station
        const stationForecast = item.forecasts.find(f => f.id === appState.nearestStation?.id);
        const forecast = stationForecast ? stationForecast.forecast : 'N/A';

        const rainChance = calculateRainProbability(forecast);
        const rainIcon = getRainIcon(forecast);

        html += `
            <div class="forecast-card">
                <div class="forecast-time">${timeStr}</div>
                <div class="forecast-icon">${rainIcon}</div>
                <div class="forecast-condition">${forecast}</div>
                <div class="rain-probability">
                    <span class="rain-chance">${rainChance}%</span>
                </div>
            </div>
        `;
    });

    html += '</div>';
    forecastEl.innerHTML = html;
}

function displayUmbrellaRecommendation() {
    const recommendationEl = document.getElementById('umbrellaRecommendation');

    if (!appState.weatherData || !appState.weatherData.items) {
        recommendationEl.innerHTML = '<p class="error">Unable to load weather data.</p>';
        return;
    }

    const items = appState.weatherData.items;
    const currentForecast = items[0];
    const stationForecast = currentForecast.forecasts.find(f => f.id === appState.nearestStation?.id);
    const forecast = stationForecast ? stationForecast.forecast : '';

    const recommendation = generateUmbrellaRecommendation(forecast);

    const html = `
        <div class="recommendation-content">
            <div class="recommendation-icon">${recommendation.icon}</div>
            <div class="recommendation-text">
                <h3>${recommendation.title}</h3>
                <p>${recommendation.description}</p>
                <p class="forecast-condition">Current forecast: <strong>${forecast}</strong></p>
            </div>
        </div>
    `;

    recommendationEl.innerHTML = html;
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

function calculateDistance(lat1, lon1, lat2, lon2) {
    // Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function calculateRainProbability(forecast) {
    const rainKeywords = ['rain', 'thundery', 'shower', 'storm'];
    const hasRain = rainKeywords.some(keyword => 
        forecast.toLowerCase().includes(keyword)
    );
    return hasRain ? 80 : 20;
}

function getRainIcon(forecast) {
    const forecastLower = forecast.toLowerCase();
    
    if (forecastLower.includes('thundery')) return '⛈️';
    if (forecastLower.includes('rain')) return '🌧️';
    if (forecastLower.includes('shower')) return '🌦️';
    if (forecastLower.includes('cloudy')) return '☁️';
    if (forecastLower.includes('clear') || forecastLower.includes('sunny')) return '☀️';
    
    return '🌤️';
}

function generateUmbrellaRecommendation(forecast) {
    const forecastLower = forecast.toLowerCase();

    if (forecastLower.includes('thundery') || forecastLower.includes('heavy rain')) {
        return {
            icon: '⛈️',
            title: 'Definitely Bring an Umbrella',
            description: 'Strong thunderstorms or heavy rain expected. An umbrella is essential. Consider staying indoors if possible.'
        };
    }

    if (forecastLower.includes('rain') || forecastLower.includes('shower')) {
        return {
            icon: '🌧️',
            title: 'Bring an Umbrella',
            description: 'Rain or showers are forecasted. An umbrella is recommended to stay dry.'
        };
    }

    if (forecastLower.includes('cloudy')) {
        return {
            icon: '☁️',
            title: 'Maybe Bring an Umbrella',
            description: 'Cloudy conditions. There\'s a chance of light rain. An umbrella wouldn\'t hurt, but it may not be necessary.'
        };
    }

    return {
        icon: '☀️',
        title: 'No Umbrella Needed',
        description: 'Clear or sunny weather expected. You should be fine without an umbrella today.'
    };
}

function updateStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status-message status-${type}`;
}

function showRetryButton() {
    const retryBtn = document.getElementById('retryBtn');
    retryBtn.style.display = 'block';
    retryBtn.addEventListener('click', () => {
        location.reload();
    });
}

function handleError(error) {
    console.error('Application error:', error);
    updateStatus(`Error: ${error.message}`, 'error');
    showRetryButton();
}
