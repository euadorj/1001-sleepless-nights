import requests
from datetime import datetime
from geopy.distance import geodesic

def get_user_location():
    try:
        # Comment this block for testing with hardcoded values
        response = requests.get("https://ipinfo.io/json")
        data = response.json()
        
        # Extract latitude and longitude
        location = data.get("loc", "").split(",")
        if len(location) == 2:
            lat = float(location[0])
            lon = float(location[1])
            print(f"User's Location: Latitude = {lat}, Longitude = {lon}")  # Debugging line
            return (lat, lon)
        else:
            print("Unable to retrieve user's location.")
            return None
    except Exception as e:
        print(f"Error retrieving location: {e}")
        return None


def fetch_stations():
    url = "https://api-open.data.gov.sg/v2/real-time/api/rainfall"
    response = requests.get(url)
    if response.status_code == 200:
        return {station['id']: (station['location']['latitude'], station['location']['longitude']) for station in response.json()["data"]["stations"]}
    else:
        print(f"Error fetching stations: {response.status_code}")
        return {}

def find_closest_station(user_location, stations):
    closest_station_id = min(stations.keys(), key=lambda station_id: geodesic(user_location, stations[station_id]).meters)
    return closest_station_id

def fetch_rainfall_data(station_id):
    url = "https://api-open.data.gov.sg/v2/real-time/api/rainfall"
    current_time = datetime.now()
    date_param = current_time.strftime("%Y-%m-%dT%H:%M:%S")
    
    params = {'date': date_param}
    response = requests.get(url, params=params)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None

def analyze_rainfall_data(data, station_id):
    if data and 'data' in data:
        readings = data['data']['readings']
        
        for reading in readings:
            for measurement in reading['data']:
                if measurement['stationId'] == station_id:
                    return measurement['value'] > 0  # Returning True if there's rain
    return False

def suggest_umbrella(chance_of_rain, user_location):
    if chance_of_rain:
        print(f"Bring an umbrella, it will rain around {datetime.now().strftime('%X')} in your area!")
    else:
        print("Looks like no rain is expected. Enjoy your day!")

def main():
    user_location = get_user_location()
    if user_location is not None:
        stations = fetch_stations()
        closest_station_id = find_closest_station(user_location, stations)
        rainfall_data = fetch_rainfall_data(closest_station_id)
        chance_of_rain = analyze_rainfall_data(rainfall_data, closest_station_id)
        suggest_umbrella(chance_of_rain)
    else:
        print("Unable to provide rainfall information without location.")

if __name__ == "__main__":
    main()
