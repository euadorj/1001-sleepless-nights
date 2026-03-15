import requests
from datetime import datetime 

def get_user_location():
    # Use a geolocation API to get the user's location based on their IP address
    try:
        response = requests.get("https://ipinfo.io/json")
        data = response.json()
        
        # Extract latitude and longitude
        location = data.get("loc", "").split(",")
        if len(location) == 2:
            lat = float(location[0])
            lon = float(location[1])
            ## debug test
            print(f"User's Location: Latitude = {lat}, Longitude = {lon}")  # Debugging line
            return (lat, lon)
        else:
            print("Unable to retrieve user's location.")
            return None
    except Exception as e:
        print(f"Error retrieving location: {e}")
        return None

def fetch_rainfall_data(lat, lon):
    # NEA API endpoint for rainfall data
    url = "https://api-open.data.gov.sg/v2/real-time/api/rainfall"
    
    # Make request to the rainfall API
    current_time = datetime.now()
    date_param = current_time.strftime("%Y-%m-%dT%H:%M:%S")
    
    # Calling the API without an API key
    params = {
        'date': date_param
    }
    
    response = requests.get(url, params=params)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None

def analyze_rainfall_data(data):
    if data and 'data' in data:
        readings = data['data']['readings']
        chance_of_rain = 0
        
        for reading in readings:
            for measurement in reading['data']:
                if measurement['stationId'] == "S111":  # Assume using a specific station
                    chance_of_rain = measurement['value']
                    break
        
        return chance_of_rain > 0  # Returning True or False
    return False

def suggest_umbrella(chance_of_rain, user_location):
    if chance_of_rain:
        print(f"Bring an umbrella, it will rain around {datetime.now().strftime('%X')} in your area!")
    else:
        print("Looks like no rain is expected. Enjoy your day!")

def main():
    user_location = get_user_location()
    if user_location is not None:
        rainfall_data = fetch_rainfall_data(*user_location)
        chance_of_rain = analyze_rainfall_data(rainfall_data)
        suggest_umbrella(chance_of_rain, user_location)
    else:
        print("Unable to provide rainfall information without location.")

if __name__ == "__main__":
    main()
