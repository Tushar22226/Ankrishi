"""
Test script for the Fruit Price Predictor components
"""

import unittest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from weather_service import WeatherService
from price_model import FruitPriceModel
from price_predictor import PricePredictor

class TestWeatherService(unittest.TestCase):
    """Test the WeatherService class"""
    
    def setUp(self):
        self.weather_service = WeatherService()
    
    def test_get_weather_forecast(self):
        """Test fetching weather forecast"""
        # San Francisco coordinates
        latitude = 37.7749
        longitude = -122.4194
        
        # Get forecast for 3 days (smaller to make test faster)
        forecast = self.weather_service.get_weather_forecast(latitude, longitude, days=3)
        
        # Check if forecast is returned
        self.assertIsNotNone(forecast)
        
        # Check if forecast contains expected keys
        self.assertIn('hourly', forecast)
        self.assertIn('daily', forecast)
        self.assertIn('location', forecast)
        
        # Check if hourly data has expected columns
        hourly_df = forecast['hourly']
        expected_columns = ['time', 'temperature_2m', 'relative_humidity_2m', 'precipitation']
        for col in expected_columns:
            self.assertIn(col, hourly_df.columns)
        
        # Check if daily data has expected columns
        daily_df = forecast['daily']
        expected_columns = ['date', 'temperature_max', 'temperature_min', 'precipitation_sum']
        for col in expected_columns:
            self.assertIn(col, daily_df.columns)
    
    def test_get_weather_features(self):
        """Test extracting weather features"""
        # San Francisco coordinates
        latitude = 37.7749
        longitude = -122.4194
        
        # Get features for 3 days
        features = self.weather_service.get_weather_features(latitude, longitude, days=3)
        
        # Check if features are returned
        self.assertIsNotNone(features)
        
        # Check if features have expected columns
        expected_columns = ['date', 'avg_temp', 'precipitation', 'is_rainy', 'month']
        for col in expected_columns:
            self.assertIn(col, features.columns)
        
        # Check if features have the correct number of rows (3 days)
        self.assertEqual(len(features), 3)

class TestPriceModel(unittest.TestCase):
    """Test the PriceModel class"""
    
    def setUp(self):
        self.price_model = FruitPriceModel()
    
    def test_rule_based_prediction(self):
        """Test rule-based price prediction"""
        # Create sample weather features
        dates = [datetime.now() + timedelta(days=i) for i in range(5)]
        weather_features = pd.DataFrame({
            'date': dates,
            'avg_temp': [25, 28, 30, 32, 27],
            'temp_range': [10, 12, 15, 14, 11],
            'precipitation': [0, 5, 10, 2, 0],
            'sunshine_hours': [8, 6, 4, 7, 9],
            'is_rainy': [False, False, True, False, False],
            'is_hot': [False, False, True, True, False],
            'is_cold': [False, False, False, False, False],
            'day_of_year': [180, 181, 182, 183, 184],
            'month': [6, 6, 6, 6, 6]
        })
        
        # Get fruit factors for apple
        fruit_factors = self.price_model.fruit_factors['apple']
        
        # Current price
        current_price = 1.99
        
        # Get price predictions
        predictions = self.price_model._rule_based_prediction(
            weather_features, 'apple', current_price, fruit_factors
        )
        
        # Check if predictions are returned
        self.assertIsNotNone(predictions)
        
        # Check if predictions have expected columns
        self.assertIn('date', predictions.columns)
        self.assertIn('predicted_price', predictions.columns)
        
        # Check if predictions have the correct number of rows
        self.assertEqual(len(predictions), 5)
        
        # Check if first day price is the current price
        self.assertEqual(predictions.iloc[0]['predicted_price'], current_price)
    
    def test_yearly_trend(self):
        """Test yearly trend prediction"""
        # San Francisco coordinates
        latitude = 37.7749
        longitude = -122.4194
        
        # Current price
        current_price = 1.99
        
        # Get yearly trend
        yearly_trend = self.price_model.predict_yearly_trend(
            latitude, longitude, 'apple', current_price
        )
        
        # Check if trend is returned
        self.assertIsNotNone(yearly_trend)
        
        # Check if trend has expected columns
        self.assertIn('date', yearly_trend.columns)
        self.assertIn('predicted_price', yearly_trend.columns)
        
        # Check if trend has 12 months
        self.assertEqual(len(yearly_trend), 12)

class TestPricePredictor(unittest.TestCase):
    """Test the PricePredictor class"""
    
    def setUp(self):
        self.predictor = PricePredictor()
    
    def test_predict_prices(self):
        """Test price prediction"""
        # San Francisco coordinates
        latitude = 37.7749
        longitude = -122.4194
        
        # Fruit and price
        fruit_name = 'apple'
        current_price = 1.99
        
        # Predict prices for 3 days
        try:
            predictions = self.predictor.predict_prices(
                latitude, longitude, fruit_name, current_price, days=3
            )
            
            # Check if predictions are returned
            self.assertIsNotNone(predictions)
            
            # Check if predictions have expected columns
            self.assertIn('date', predictions.columns)
            self.assertIn('predicted_price', predictions.columns)
            
            # Check if predictions have the correct number of rows
            self.assertEqual(len(predictions), 3)
            
            # Check if first day price is the current price
            self.assertEqual(predictions.iloc[0]['predicted_price'], current_price)
        except Exception as e:
            # If there's a network error, skip the test
            if "Failed to fetch weather data" in str(e):
                self.skipTest("Network error: Failed to fetch weather data")
            else:
                raise

if __name__ == '__main__':
    unittest.main()
