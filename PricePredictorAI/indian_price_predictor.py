"""
Price predictor for Indian markets
"""

from weather_service import WeatherService
from indian_price_model import IndianPriceModel
from indian_market_config import INDIAN_REGIONS, INDIAN_FRUITS
import pandas as pd
import matplotlib.pyplot as plt
import os
import json

class IndianPricePredictor:
    """
    Main class for predicting fruit prices for Indian markets based on weather data
    """
    
    def __init__(self, region="north"):
        """
        Initialize the Indian price predictor
        
        Args:
            region (str): Region in India ('north', 'south', 'east', 'west', 'central', 'northeast')
        """
        self.weather_service = WeatherService()
        self.price_model = IndianPriceModel(region=region)
        self.region = region
        
        # Create directories if they don't exist
        os.makedirs('models/indian', exist_ok=True)
        os.makedirs('predictions/indian', exist_ok=True)
    
    def predict_prices(self, latitude, longitude, fruit_name, current_price, days=14, currency="INR"):
        """
        Predict fruit prices for the next N days for Indian markets
        
        Args:
            latitude (float): Location latitude
            longitude (float): Location longitude
            fruit_name (str): Name of the fruit
            current_price (float): Current price of the fruit
            days (int): Number of days to predict (max 16)
            currency (str): Currency of the price ('INR' or 'USD')
            
        Returns:
            pandas.DataFrame: Predicted prices with dates
        """
        # Get weather features for the location
        weather_features = self.weather_service.get_weather_features(latitude, longitude, days)
        
        if weather_features is None:
            raise ValueError("Failed to fetch weather data. Check your internet connection.")
        
        # Predict prices based on weather features
        price_predictions = self.price_model.predict_price_with_weather(
            weather_features, fruit_name, current_price, currency
        )
        
        return price_predictions
    
    def predict_yearly_trend(self, latitude, longitude, fruit_name, current_price, currency="INR"):
        """
        Predict yearly price trend for Indian markets
        
        Args:
            latitude (float): Location latitude
            longitude (float): Location longitude
            fruit_name (str): Name of the fruit
            current_price (float): Current price of the fruit
            currency (str): Currency of the price ('INR' or 'USD')
            
        Returns:
            pandas.DataFrame: Yearly price trend
        """
        return self.price_model.predict_yearly_trend(
            latitude, longitude, fruit_name, current_price, currency
        )
    
    def save_predictions(self, predictions, filename):
        """
        Save predictions to a file
        
        Args:
            predictions (pandas.DataFrame): Predicted prices
            filename (str): Name of the file to save
        """
        # Convert dates to string format
        predictions_copy = predictions.copy()
        predictions_copy['date'] = predictions_copy['date'].dt.strftime('%Y-%m-%d')
        
        # Save as JSON
        predictions_dict = predictions_copy.to_dict(orient='records')
        
        with open(f'predictions/indian/{filename}.json', 'w') as f:
            json.dump(predictions_dict, f, indent=4)
    
    def plot_predictions(self, predictions, title, filename=None, currency="INR"):
        """
        Plot price predictions for Indian markets
        
        Args:
            predictions (pandas.DataFrame): Predicted prices
            title (str): Plot title
            filename (str, optional): If provided, save the plot to this file
            currency (str): Currency of the price ('INR' or 'USD')
        """
        plt.figure(figsize=(12, 6))
        plt.plot(predictions['date'], predictions['predicted_price'], marker='o', linestyle='-')
        
        # Add currency symbol to title
        currency_symbol = "₹" if currency.upper() == "INR" else "$"
        plt.title(f"{title} ({currency_symbol})")
        
        plt.xlabel('Date')
        plt.ylabel(f'Price ({currency_symbol})')
        plt.grid(True)
        plt.xticks(rotation=45)
        plt.tight_layout()
        
        if filename:
            plt.savefig(f'predictions/indian/{filename}.png')
            plt.close()
        else:
            plt.show()
    
    def train_model(self, X, y, model_name=None):
        """
        Train the price prediction model for Indian markets
        
        Args:
            X (numpy.ndarray): Features for training
            y (numpy.ndarray): Target prices for training
            model_name (str, optional): Name to save the model
        """
        self.price_model.train(X, y)
        
        if model_name:
            self.price_model.save_model(f'models/indian/{model_name}_{self.region}')
    
    def load_model(self, model_name):
        """
        Load a trained model for Indian markets
        
        Args:
            model_name (str): Name of the model to load
        """
        try:
            self.price_model.load_model(f'models/indian/{model_name}_{self.region}')
            return True
        except:
            print(f"Model {model_name}_{self.region} not found. Using rule-based prediction instead.")
            return False
    
    @staticmethod
    def get_available_fruits():
        """
        Get list of available Indian fruits
        
        Returns:
            list: List of available fruits
        """
        return list(INDIAN_FRUITS.keys())
    
    @staticmethod
    def get_available_regions():
        """
        Get list of available Indian regions
        
        Returns:
            list: List of available regions
        """
        return list(INDIAN_REGIONS.keys())
    
    @staticmethod
    def get_fruit_info(fruit_name):
        """
        Get information about a specific fruit
        
        Args:
            fruit_name (str): Name of the fruit
            
        Returns:
            dict: Fruit information
        """
        if fruit_name.lower() in INDIAN_FRUITS:
            return INDIAN_FRUITS[fruit_name.lower()]
        return None
    
    @staticmethod
    def get_region_info(region_name):
        """
        Get information about a specific region
        
        Args:
            region_name (str): Name of the region
            
        Returns:
            dict: Region information
        """
        if region_name.lower() in INDIAN_REGIONS:
            return INDIAN_REGIONS[region_name.lower()]
        return None
