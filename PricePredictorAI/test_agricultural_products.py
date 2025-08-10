"""
Test suite for the agricultural products functionality
"""

import unittest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import matplotlib.pyplot as plt

from indian_market_config import (
    INDIAN_AGRICULTURAL_PRODUCTS,
    PRODUCT_CATEGORIES,
    INDIAN_FRUITS,
    INDIAN_VEGETABLES,
    INDIAN_CEREALS,
    INDIAN_RICE_VARIETIES,
    INDIAN_WHEAT_VARIETIES
)
from indian_price_predictor import IndianPricePredictor

class TestAgriculturalProducts(unittest.TestCase):
    """Test the agricultural products functionality"""
    
    def setUp(self):
        """Set up test environment"""
        self.predictor = IndianPricePredictor(region="north")
        
        # Create output directories if they don't exist
        os.makedirs('predictions/indian', exist_ok=True)
        
        # Sample products from each category
        self.sample_products = {
            'fruits': ['mango', 'apple', 'banana'],
            'vegetables': ['potato', 'onion', 'tomato'],
            'cereals': ['rice', 'wheat', 'maize'],
            'rice': ['basmati', 'sona_masuri', 'ponni'],
            'wheat': ['hd_2967', 'pbw_550', 'lok_1']
        }
    
    def test_product_categories(self):
        """Test that all product categories are properly defined"""
        # Check that all categories exist
        for category in PRODUCT_CATEGORIES.keys():
            self.assertTrue(len(self.predictor.get_products_by_category(category)) > 0)
        
        # Check that all products have a valid category
        for product_name, product_data in INDIAN_AGRICULTURAL_PRODUCTS.items():
            self.assertIn('category', product_data)
            self.assertIn(product_data['category'], PRODUCT_CATEGORIES.keys())
    
    def test_product_counts(self):
        """Test that we have the expected number of products in each category"""
        # Check counts
        self.assertEqual(len(INDIAN_FRUITS), len(self.predictor.get_available_fruits()))
        self.assertEqual(len(INDIAN_VEGETABLES), len(self.predictor.get_available_vegetables()))
        self.assertEqual(len(INDIAN_CEREALS), len(self.predictor.get_available_cereals()))
        self.assertEqual(len(INDIAN_RICE_VARIETIES), len(self.predictor.get_available_rice_varieties()))
        self.assertEqual(len(INDIAN_WHEAT_VARIETIES), len(self.predictor.get_available_wheat_varieties()))
        
        # Check total count
        total_products = (
            len(INDIAN_FRUITS) +
            len(INDIAN_VEGETABLES) +
            len(INDIAN_CEREALS) +
            len(INDIAN_RICE_VARIETIES) +
            len(INDIAN_WHEAT_VARIETIES)
        )
        self.assertEqual(total_products, len(INDIAN_AGRICULTURAL_PRODUCTS))
    
    def test_product_info(self):
        """Test that we can get information about products in each category"""
        for category, products in self.sample_products.items():
            for product_name in products:
                # Get product info
                product_info = self.predictor.get_product_info(product_name)
                
                # Check that info is returned
                self.assertIsNotNone(product_info)
                
                # Check that it has the correct category
                self.assertEqual(product_info['category'], category)
                
                # Check that it has all required fields
                required_fields = [
                    'hindi_name', 'varieties', 'temp_sensitivity', 'rain_sensitivity',
                    'growing_season', 'harvest_months', 'shelf_life', 'price_volatility',
                    'primary_regions', 'base_price_inr', 'seasonal_price_factor'
                ]
                for field in required_fields:
                    self.assertIn(field, product_info)
    
    def test_price_predictions(self):
        """Test price predictions for products in each category"""
        try:
            # Get region coordinates
            region_info = self.predictor.get_region_info("north")
            latitude = region_info['center_lat']
            longitude = region_info['center_lon']
            
            for category, products in self.sample_products.items():
                for product_name in products:
                    # Get product info
                    product_info = self.predictor.get_product_info(product_name)
                    current_price = product_info['base_price_inr']
                    
                    # Make short-term prediction
                    short_term = self.predictor.predict_prices(
                        latitude, longitude, product_name, current_price, days=5
                    )
                    
                    # Check short-term prediction
                    self.assertIsNotNone(short_term)
                    self.assertEqual(len(short_term), 5)
                    self.assertIn('date', short_term.columns)
                    self.assertIn('predicted_price', short_term.columns)
                    
                    # Make yearly prediction
                    yearly = self.predictor.predict_yearly_trend(
                        latitude, longitude, product_name, current_price
                    )
                    
                    # Check yearly prediction
                    self.assertIsNotNone(yearly)
                    self.assertEqual(len(yearly), 12)
                    self.assertIn('date', yearly.columns)
                    self.assertIn('predicted_price', yearly.columns)
        except Exception as e:
            # Skip test if there's a network error
            if "Failed to fetch weather data" in str(e):
                self.skipTest("Network error: Failed to fetch weather data")
            else:
                raise
    
    def test_seasonal_patterns(self):
        """Test that different categories have different seasonal patterns"""
        try:
            # Get region coordinates
            region_info = self.predictor.get_region_info("north")
            latitude = region_info['center_lat']
            longitude = region_info['center_lon']
            
            # Get yearly predictions for one product from each category
            predictions = {}
            for category, products in self.sample_products.items():
                product_name = products[0]  # Take first product from each category
                product_info = self.predictor.get_product_info(product_name)
                current_price = product_info['base_price_inr']
                
                # Make yearly prediction
                yearly = self.predictor.predict_yearly_trend(
                    latitude, longitude, product_name, current_price
                )
                
                # Normalize prices (as percentage of yearly average)
                avg_price = yearly['predicted_price'].mean()
                yearly['price_ratio'] = (yearly['predicted_price'] / avg_price) * 100
                
                predictions[category] = yearly
            
            # Check that different categories have different seasonal patterns
            # This is a simple check - we just verify that the month with the highest
            # price is different for at least some categories
            peak_months = {}
            for category, prediction in predictions.items():
                peak_month = prediction.loc[prediction['predicted_price'].idxmax(), 'date'].month
                peak_months[category] = peak_month
            
            # There should be at least 2 different peak months across categories
            self.assertTrue(len(set(peak_months.values())) >= 2)
            
            # Optional: Plot seasonal patterns
            if os.environ.get('PLOT_TESTS', 'False').lower() == 'true':
                plt.figure(figsize=(12, 6))
                
                for category, prediction in predictions.items():
                    plt.plot(prediction['date'], prediction['price_ratio'], 
                             marker='o', linestyle='-', label=category.capitalize())
                
                plt.title('Seasonal Price Patterns by Product Category')
                plt.xlabel('Month')
                plt.ylabel('Price (% of yearly average)')
                plt.legend()
                plt.grid(True)
                plt.savefig('predictions/indian/test_seasonal_patterns.png')
                plt.close()
        except Exception as e:
            # Skip test if there's a network error
            if "Failed to fetch weather data" in str(e):
                self.skipTest("Network error: Failed to fetch weather data")
            else:
                raise

if __name__ == '__main__':
    unittest.main()
