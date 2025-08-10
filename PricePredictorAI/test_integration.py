"""
Integration tests for the entire price prediction system
"""

import unittest
import os
import pandas as pd
from datetime import datetime, timedelta
import matplotlib.pyplot as plt

from weather_service import WeatherService
from price_model import FruitPriceModel
from price_predictor import PricePredictor
from indian_price_model import IndianPriceModel
from indian_price_predictor import IndianPricePredictor

class TestWeatherIntegration(unittest.TestCase):
    """Test weather service integration"""
    
    def setUp(self):
        """Set up test environment"""
        self.weather_service = WeatherService()
    
    def test_weather_forecast(self):
        """Test fetching weather forecast for different locations"""
        try:
            # Test for a location in the US
            us_forecast = self.weather_service.get_weather_forecast(
                37.7749, -122.4194, days=3  # San Francisco
            )
            
            # Test for a location in India
            india_forecast = self.weather_service.get_weather_forecast(
                28.6139, 77.2090, days=3  # Delhi
            )
            
            # Check that forecasts are returned
            self.assertIsNotNone(us_forecast)
            self.assertIsNotNone(india_forecast)
            
            # Check that forecasts have expected structure
            for forecast in [us_forecast, india_forecast]:
                self.assertIn('hourly', forecast)
                self.assertIn('daily', forecast)
                self.assertIn('location', forecast)
        except Exception as e:
            # Skip test if there's a network error
            if "Failed to fetch weather data" in str(e):
                self.skipTest("Network error: Failed to fetch weather data")
            else:
                raise
    
    def test_weather_features(self):
        """Test extracting weather features for different locations"""
        try:
            # Test for a location in the US
            us_features = self.weather_service.get_weather_features(
                37.7749, -122.4194, days=3  # San Francisco
            )
            
            # Test for a location in India
            india_features = self.weather_service.get_weather_features(
                28.6139, 77.2090, days=3  # Delhi
            )
            
            # Check that features are returned
            self.assertIsNotNone(us_features)
            self.assertIsNotNone(india_features)
            
            # Check that features have expected columns
            expected_columns = ['date', 'avg_temp', 'precipitation', 'is_rainy', 'month']
            for features in [us_features, india_features]:
                for col in expected_columns:
                    self.assertIn(col, features.columns)
        except Exception as e:
            # Skip test if there's a network error
            if "Failed to fetch weather data" in str(e):
                self.skipTest("Network error: Failed to fetch weather data")
            else:
                raise

class TestGlobalIndianIntegration(unittest.TestCase):
    """Test integration between global and Indian models"""
    
    def setUp(self):
        """Set up test environment"""
        self.global_predictor = PricePredictor()
        self.indian_predictor = IndianPricePredictor(region="north")
        
        # Create output directories if they don't exist
        os.makedirs('predictions', exist_ok=True)
        os.makedirs('predictions/indian', exist_ok=True)
    
    def test_global_indian_predictions(self):
        """Test predictions from both global and Indian models"""
        try:
            # Common parameters
            fruit_name = "apple"
            days = 5
            
            # Global model prediction
            global_prediction = self.global_predictor.predict_prices(
                37.7749, -122.4194, fruit_name, 1.99, days
            )
            
            # Indian model prediction
            indian_prediction = self.indian_predictor.predict_prices(
                28.6139, 77.2090, fruit_name, 150, days
            )
            
            # Check that predictions are returned
            self.assertIsNotNone(global_prediction)
            self.assertIsNotNone(indian_prediction)
            
            # Check that predictions have expected columns
            self.assertIn('date', global_prediction.columns)
            self.assertIn('predicted_price', global_prediction.columns)
            self.assertIn('date', indian_prediction.columns)
            self.assertIn('predicted_price', indian_prediction.columns)
            
            # Check that predictions have the correct number of rows
            self.assertEqual(len(global_prediction), days)
            self.assertEqual(len(indian_prediction), days)
        except Exception as e:
            # Skip test if there's a network error
            if "Failed to fetch weather data" in str(e):
                self.skipTest("Network error: Failed to fetch weather data")
            else:
                raise
    
    def test_yearly_trend_comparison(self):
        """Test yearly trend predictions from both global and Indian models"""
        try:
            # Common parameters
            fruit_name = "apple"
            
            # Global model prediction
            global_prediction = self.global_predictor.predict_yearly_trend(
                37.7749, -122.4194, fruit_name, 1.99
            )
            
            # Indian model prediction
            indian_prediction = self.indian_predictor.predict_yearly_trend(
                28.6139, 77.2090, fruit_name, 150
            )
            
            # Check that predictions are returned
            self.assertIsNotNone(global_prediction)
            self.assertIsNotNone(indian_prediction)
            
            # Check that predictions have expected columns
            self.assertIn('date', global_prediction.columns)
            self.assertIn('predicted_price', global_prediction.columns)
            self.assertIn('date', indian_prediction.columns)
            self.assertIn('predicted_price', indian_prediction.columns)
            
            # Check that predictions have 12 months
            self.assertEqual(len(global_prediction), 12)
            self.assertEqual(len(indian_prediction), 12)
            
            # Optional: Plot comparison
            if os.environ.get('PLOT_TESTS', 'False').lower() == 'true':
                plt.figure(figsize=(12, 6))
                plt.plot(global_prediction['date'], global_prediction['predicted_price'], 
                         marker='o', linestyle='-', label='Global Model')
                plt.plot(indian_prediction['date'], indian_prediction['predicted_price'], 
                         marker='s', linestyle='--', label='Indian Model')
                plt.title(f'Yearly Price Trend Comparison for {fruit_name.capitalize()}')
                plt.xlabel('Month')
                plt.ylabel('Price')
                plt.legend()
                plt.grid(True)
                plt.savefig(f'predictions/yearly_comparison_{fruit_name}.png')
                plt.close()
        except Exception as e:
            # Skip test if there's a network error
            if "Failed to fetch weather data" in str(e):
                self.skipTest("Network error: Failed to fetch weather data")
            else:
                raise

class TestMultiCategoryIntegration(unittest.TestCase):
    """Test integration across different product categories"""
    
    def setUp(self):
        """Set up test environment"""
        self.predictor = IndianPricePredictor(region="north")
        
        # Create output directories if they don't exist
        os.makedirs('predictions/indian', exist_ok=True)
        
        # Sample products from different categories
        self.products = {
            'fruits': 'mango',
            'vegetables': 'potato',
            'cereals': 'rice',
            'rice': 'basmati',
            'wheat': 'hd_2967'
        }
        
        # Sample prices
        self.prices = {
            'mango': 100,
            'potato': 25,
            'rice': 50,
            'basmati': 90,
            'hd_2967': 32
        }
    
    def test_multi_category_predictions(self):
        """Test predictions for multiple product categories"""
        try:
            # Get region coordinates
            region_info = self.predictor.get_region_info("north")
            latitude = region_info['center_lat']
            longitude = region_info['center_lon']
            
            # Test short-term predictions for each product
            for category, product_name in self.products.items():
                price = self.prices[product_name]
                
                # Make prediction
                prediction = self.predictor.predict_prices(
                    latitude, longitude, product_name, price, days=5
                )
                
                # Check prediction
                self.assertIsNotNone(prediction)
                self.assertEqual(len(prediction), 5)
                self.assertIn('date', prediction.columns)
                self.assertIn('predicted_price', prediction.columns)
                self.assertEqual(prediction.iloc[0]['predicted_price'], price)
        except Exception as e:
            # Skip test if there's a network error
            if "Failed to fetch weather data" in str(e):
                self.skipTest("Network error: Failed to fetch weather data")
            else:
                raise
    
    def test_multi_category_yearly_trends(self):
        """Test yearly trends for multiple product categories"""
        try:
            # Get region coordinates
            region_info = self.predictor.get_region_info("north")
            latitude = region_info['center_lat']
            longitude = region_info['center_lon']
            
            # Test yearly trends for each product
            yearly_predictions = {}
            
            for category, product_name in self.products.items():
                price = self.prices[product_name]
                
                # Make prediction
                prediction = self.predictor.predict_yearly_trend(
                    latitude, longitude, product_name, price
                )
                
                # Check prediction
                self.assertIsNotNone(prediction)
                self.assertEqual(len(prediction), 12)
                self.assertIn('date', prediction.columns)
                self.assertIn('predicted_price', prediction.columns)
                
                yearly_predictions[product_name] = prediction
            
            # Optional: Plot comparison
            if os.environ.get('PLOT_TESTS', 'False').lower() == 'true':
                plt.figure(figsize=(12, 6))
                
                for product_name, prediction in yearly_predictions.items():
                    plt.plot(prediction['date'], prediction['predicted_price'], 
                             marker='o', linestyle='-', label=product_name.capitalize())
                
                plt.title('Yearly Price Trends for Different Product Categories')
                plt.xlabel('Month')
                plt.ylabel('Price (₹)')
                plt.legend()
                plt.grid(True)
                plt.savefig('predictions/indian/multi_category_comparison.png')
                plt.close()
        except Exception as e:
            # Skip test if there's a network error
            if "Failed to fetch weather data" in str(e):
                self.skipTest("Network error: Failed to fetch weather data")
            else:
                raise

if __name__ == '__main__':
    unittest.main()
