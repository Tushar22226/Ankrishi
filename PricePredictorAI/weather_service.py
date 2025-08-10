import requests
import pandas as pd
from datetime import datetime, timedelta

class WeatherService:
    """
    Service to fetch weather data from Open-Meteo API
    """
    
    def __init__(self):
        self.base_url = "https://api.open-meteo.com/v1/forecast"
    
    def get_weather_forecast(self, latitude, longitude, days=14):
        """
        Get weather forecast for a specific location
        
        Args:
            latitude (float): Location latitude
            longitude (float): Location longitude
            days (int): Number of forecast days (max 16)
            
        Returns:
            pandas.DataFrame: Weather forecast data
        """
        # Ensure days is within the API limit
        if days > 16:
            days = 16
            
        # Define weather variables to fetch
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "forecast_days": days,
            "hourly": [
                "temperature_2m", 
                "relative_humidity_2m",
                "precipitation",
                "rain",
                "snowfall",
                "soil_temperature_6cm",
                "soil_moisture_0_to_1cm",
                "sunshine_duration"
            ],
            "daily": [
                "temperature_2m_max",
                "temperature_2m_min",
                "temperature_2m_mean",
                "precipitation_sum",
                "rain_sum",
                "sunshine_duration"
            ],
            "timezone": "auto"
        }
        
        try:
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()  # Raise exception for HTTP errors
            
            data = response.json()
            
            # Process hourly data
            hourly_df = pd.DataFrame({
                'time': pd.to_datetime(data['hourly']['time']),
                'temperature_2m': data['hourly']['temperature_2m'],
                'relative_humidity_2m': data['hourly']['relative_humidity_2m'],
                'precipitation': data['hourly']['precipitation'],
                'rain': data['hourly']['rain'],
                'snowfall': data['hourly']['snowfall'],
                'soil_temperature_6cm': data['hourly']['soil_temperature_6cm'],
                'soil_moisture_0_to_1cm': data['hourly']['soil_moisture_0_to_1cm'],
                'sunshine_duration': data['hourly']['sunshine_duration']
            })
            
            # Process daily data
            daily_df = pd.DataFrame({
                'date': pd.to_datetime(data['daily']['time']),
                'temperature_max': data['daily']['temperature_2m_max'],
                'temperature_min': data['daily']['temperature_2m_min'],
                'temperature_mean': data['daily']['temperature_2m_mean'],
                'precipitation_sum': data['daily']['precipitation_sum'],
                'rain_sum': data['daily']['rain_sum'],
                'sunshine_duration': data['daily']['sunshine_duration']
            })
            
            return {
                'hourly': hourly_df,
                'daily': daily_df,
                'location': {
                    'latitude': data['latitude'],
                    'longitude': data['longitude'],
                    'elevation': data.get('elevation', None),
                    'timezone': data.get('timezone', None)
                }
            }
            
        except requests.exceptions.RequestException as e:
            print(f"Error fetching weather data: {e}")
            return None
    
    def get_weather_features(self, latitude, longitude, days=14):
        """
        Extract relevant weather features for price prediction
        
        Args:
            latitude (float): Location latitude
            longitude (float): Location longitude
            days (int): Number of forecast days
            
        Returns:
            pandas.DataFrame: Weather features for prediction
        """
        weather_data = self.get_weather_forecast(latitude, longitude, days)
        
        if not weather_data:
            return None
        
        # Extract daily data
        daily_df = weather_data['daily']
        
        # Create features relevant for price prediction
        features_df = pd.DataFrame({
            'date': daily_df['date'],
            'avg_temp': daily_df['temperature_mean'],
            'temp_range': daily_df['temperature_max'] - daily_df['temperature_min'],
            'precipitation': daily_df['precipitation_sum'],
            'sunshine_hours': daily_df['sunshine_duration'] / 3600  # Convert seconds to hours
        })
        
        # Add derived features
        features_df['is_rainy'] = features_df['precipitation'] > 5.0  # Rainy if more than 5mm
        features_df['is_hot'] = features_df['avg_temp'] > 30.0  # Hot if average temp > 30°C
        features_df['is_cold'] = features_df['avg_temp'] < 10.0  # Cold if average temp < 10°C
        
        # Add day of year to capture seasonality
        features_df['day_of_year'] = features_df['date'].dt.dayofyear
        features_df['month'] = features_df['date'].dt.month
        
        return features_df
