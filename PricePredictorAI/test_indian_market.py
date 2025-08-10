"""
Test suite for the Indian Market Price Prediction components
"""

import unittest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import json

from indian_market_config import (
    INDIAN_REGIONS, 
    INDIAN_AGRICULTURAL_PRODUCTS,
    PRODUCT_CATEGORIES
)
from indian_price_model import IndianPriceModel
from indian_price_predictor import IndianPricePredictor

class TestIndianMarketConfig(unittest.TestCase):
    """Test the Indian market configuration"""
    
    def test_regions_exist(self):
        """Test that regions are defined"""
        self.assertTrue(len(INDIAN_REGIONS) > 0)
        
        # Check that each region has required fields
        for region_code, region_data in INDIAN_REGIONS.items():
            self.assertIn('name', region_data)
            self.assertIn('center_lat', region_data)
            self.assertIn('center_lon', region_data)
            self.assertIn('states', region_data)
    
    def test_products_exist(self):
        """Test that agricultural products are defined"""
        self.assertTrue(len(INDIAN_AGRICULTURAL_PRODUCTS) > 0)
        
        # Check that each product has required fields
        for product_name, product_data in INDIAN_AGRICULTURAL_PRODUCTS.items():
            self.assertIn('hindi_name', product_data)
            self.assertIn('varieties', product_data)
            self.assertIn('temp_sensitivity', product_data)
            self.assertIn('rain_sensitivity', product_data)
            self.assertIn('growing_season', product_data)
            self.assertIn('harvest_months', product_data)
            self.assertIn('shelf_life', product_data)
            self.assertIn('price_volatility', product_data)
            self.assertIn('primary_regions', product_data)
            self.assertIn('base_price_inr', product_data)
            self.assertIn('seasonal_price_factor', product_data)
            self.assertIn('category', product_data)
    
    def test_categories_exist(self):
        """Test that product categories are defined"""
        self.assertTrue(len(PRODUCT_CATEGORIES) > 0)
        
        # Check that each category has a name
        for category_code, category_name in PRODUCT_CATEGORIES.items():
            self.assertTrue(isinstance(category_name, str))
            self.assertTrue(len(category_name) > 0)
    
    def test_products_have_valid_categories(self):
        """Test that products have valid categories"""
        valid_categories = PRODUCT_CATEGORIES.keys()
        
        for product_name, product_data in INDIAN_AGRICULTURAL_PRODUCTS.items():
            self.assertIn('category', product_data)
            self.assertIn(product_data['category'], valid_categories)

class TestIndianPriceModel(unittest.TestCase):
    """Test the Indian price model"""
    
    def setUp(self):
        """Set up test environment"""
        self.model = IndianPriceModel(region="north")
    
    def test_initialization(self):
        """Test model initialization"""
        self.assertEqual(self.model.region, "north")
        self.assertIsNotNone(self.model.region_data)
        self.assertIsNotNone(self.model.transportation_cost)
        self.assertIsNotNone(self.model.storage_cost)
        self.assertIsNotNone(self.model.demand_factor)
    
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
        
        # Test with a fruit
        fruit_name = "mango"
        current_price = 100
        fruit_data = INDIAN_AGRICULTURAL_PRODUCTS[fruit_name]
        
        predictions = self.model._rule_based_prediction(
            weather_features, fruit_name, current_price, fruit_data
        )
        
        # Check predictions
        self.assertEqual(len(predictions), 5)
        self.assertIn('date', predictions.columns)
        self.assertIn('predicted_price', predictions.columns)
        self.assertEqual(predictions.iloc[0]['predicted_price'], current_price)
        
        # Test with a vegetable
        vegetable_name = "potato"
        current_price = 25
        vegetable_data = INDIAN_AGRICULTURAL_PRODUCTS[vegetable_name]
        
        predictions = self.model._rule_based_prediction(
            weather_features, vegetable_name, current_price, vegetable_data
        )
        
        # Check predictions
        self.assertEqual(len(predictions), 5)
        self.assertEqual(predictions.iloc[0]['predicted_price'], current_price)
        
        # Test with a cereal
        cereal_name = "rice"
        current_price = 50
        cereal_data = INDIAN_AGRICULTURAL_PRODUCTS[cereal_name]
        
        predictions = self.model._rule_based_prediction(
            weather_features, cereal_name, current_price, cereal_data
        )
        
        # Check predictions
        self.assertEqual(len(predictions), 5)
        self.assertEqual(predictions.iloc[0]['predicted_price'], current_price)
    
    def test_yearly_trend(self):
        """Test yearly trend prediction"""
        # Test with a fruit
        fruit_name = "mango"
        current_price = 100
        
        predictions = self.model.predict_yearly_trend(
            28.6139, 77.2090, fruit_name, current_price
        )
        
        # Check predictions
        self.assertEqual(len(predictions), 12)  # 12 months
        self.assertIn('date', predictions.columns)
        self.assertIn('predicted_price', predictions.columns)
        
        # Test with a vegetable
        vegetable_name = "potato"
        current_price = 25
        
        predictions = self.model.predict_yearly_trend(
            28.6139, 77.2090, vegetable_name, current_price
        )
        
        # Check predictions
        self.assertEqual(len(predictions), 12)  # 12 months
        
        # Test with a cereal
        cereal_name = "rice"
        current_price = 50
        
        predictions = self.model.predict_yearly_trend(
            28.6139, 77.2090, cereal_name, current_price
        )
        
        # Check predictions
        self.assertEqual(len(predictions), 12)  # 12 months
    
    def test_currency_conversion(self):
        """Test currency conversion in predictions"""
        # Test with INR
        predictions_inr = self.model.predict_yearly_trend(
            28.6139, 77.2090, "mango", 100, currency="INR"
        )
        
        # Test with USD
        predictions_usd = self.model.predict_yearly_trend(
            28.6139, 77.2090, "mango", 100, currency="USD"
        )
        
        # Check that USD prices are lower than INR prices (due to conversion)
        self.assertTrue(predictions_usd['predicted_price'].mean() < predictions_inr['predicted_price'].mean())

class TestIndianPricePredictor(unittest.TestCase):
    """Test the Indian price predictor"""
    
    def setUp(self):
        """Set up test environment"""
        self.predictor = IndianPricePredictor(region="north")
        
        # Create output directories if they don't exist
        os.makedirs('predictions/indian', exist_ok=True)
    
    def test_initialization(self):
        """Test predictor initialization"""
        self.assertEqual(self.predictor.region, "north")
        self.assertIsNotNone(self.predictor.weather_service)
        self.assertIsNotNone(self.predictor.price_model)
    
    def test_get_available_products(self):
        """Test getting available products"""
        products = self.predictor.get_available_products()
        self.assertTrue(len(products) > 0)
        
        # Check that we can get products by category
        fruits = self.predictor.get_available_fruits()
        vegetables = self.predictor.get_available_vegetables()
        cereals = self.predictor.get_available_cereals()
        rice_varieties = self.predictor.get_available_rice_varieties()
        wheat_varieties = self.predictor.get_available_wheat_varieties()
        
        self.assertTrue(len(fruits) > 0)
        self.assertTrue(len(vegetables) > 0)
        self.assertTrue(len(cereals) > 0)
        self.assertTrue(len(rice_varieties) > 0)
        self.assertTrue(len(wheat_varieties) > 0)
        
        # Check that we can get products by category using the helper method
        fruits2 = self.predictor.get_products_by_category('fruits')
        self.assertEqual(set(fruits), set(fruits2))
    
    def test_get_product_info(self):
        """Test getting product information"""
        # Test with a fruit
        fruit_info = self.predictor.get_product_info("mango")
        self.assertIsNotNone(fruit_info)
        self.assertEqual(fruit_info['category'], 'fruits')
        
        # Test with a vegetable
        vegetable_info = self.predictor.get_product_info("potato")
        self.assertIsNotNone(vegetable_info)
        self.assertEqual(vegetable_info['category'], 'vegetables')
        
        # Test with a cereal
        cereal_info = self.predictor.get_product_info("rice")
        self.assertIsNotNone(cereal_info)
        self.assertEqual(cereal_info['category'], 'cereals')
        
        # Test with a rice variety
        rice_info = self.predictor.get_product_info("basmati")
        self.assertIsNotNone(rice_info)
        self.assertEqual(rice_info['category'], 'rice')
        
        # Test with a wheat variety
        wheat_info = self.predictor.get_product_info("hd_2967")
        self.assertIsNotNone(wheat_info)
        self.assertEqual(wheat_info['category'], 'wheat')
    
    def test_get_region_info(self):
        """Test getting region information"""
        region_info = self.predictor.get_region_info("north")
        self.assertIsNotNone(region_info)
        self.assertEqual(region_info['name'], 'North India')
        
        region_info = self.predictor.get_region_info("south")
        self.assertIsNotNone(region_info)
        self.assertEqual(region_info['name'], 'South India')
    
    def test_save_predictions(self):
        """Test saving predictions to file"""
        # Create sample predictions
        dates = [datetime.now() + timedelta(days=i) for i in range(5)]
        predictions = pd.DataFrame({
            'date': dates,
            'predicted_price': [100, 102, 98, 105, 103]
        })
        
        # Save predictions
        filename = "test_predictions"
        self.predictor.save_predictions(predictions, filename)
        
        # Check that file exists
        filepath = f'predictions/indian/{filename}.json'
        self.assertTrue(os.path.exists(filepath))
        
        # Check file contents
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        self.assertEqual(len(data), 5)
        self.assertIn('date', data[0])
        self.assertIn('predicted_price', data[0])
        
        # Clean up
        os.remove(filepath)

if __name__ == '__main__':
    unittest.main()
