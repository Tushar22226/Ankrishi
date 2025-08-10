from weather_service import WeatherService
from price_model import FruitPriceModel
import pandas as pd
import matplotlib.pyplot as plt
import os
import json

class PricePredictor:
    """
    Main class for predicting fruit prices based on weather data
    """
    
    def __init__(self, model_type="random_forest"):
        """
        Initialize the price predictor
        
        Args:
            model_type (str): Type of model to use ('random_forest' or 'lstm')
        """
        self.weather_service = WeatherService()
        self.price_model = FruitPriceModel(model_type=model_type)
        
        # Create models directory if it doesn't exist
        os.makedirs('models', exist_ok=True)
        os.makedirs('predictions', exist_ok=True)
    
    def predict_prices(self, latitude, longitude, fruit_name, current_price, days=14):
        """
        Predict fruit prices for the next N days
        
        Args:
            latitude (float): Location latitude
            longitude (float): Location longitude
            fruit_name (str): Name of the fruit
            current_price (float): Current price of the fruit
            days (int): Number of days to predict (max 16)
            
        Returns:
            pandas.DataFrame: Predicted prices with dates
        """
        # Get weather features for the location
        weather_features = self.weather_service.get_weather_features(latitude, longitude, days)
        
        if weather_features is None:
            raise ValueError("Failed to fetch weather data. Check your internet connection.")
        
        # Predict prices based on weather features
        price_predictions = self.price_model.predict_price_with_weather(
            weather_features, fruit_name, current_price
        )
        
        return price_predictions
    
    def predict_yearly_trend(self, latitude, longitude, fruit_name, current_price):
        """
        Predict yearly price trend
        
        Args:
            latitude (float): Location latitude
            longitude (float): Location longitude
            fruit_name (str): Name of the fruit
            current_price (float): Current price of the fruit
            
        Returns:
            pandas.DataFrame: Yearly price trend
        """
        return self.price_model.predict_yearly_trend(latitude, longitude, fruit_name, current_price)
    
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
        
        with open(f'predictions/{filename}.json', 'w') as f:
            json.dump(predictions_dict, f, indent=4)
    
    def plot_predictions(self, predictions, title, filename=None):
        """
        Plot price predictions
        
        Args:
            predictions (pandas.DataFrame): Predicted prices
            title (str): Plot title
            filename (str, optional): If provided, save the plot to this file
        """
        plt.figure(figsize=(12, 6))
        plt.plot(predictions['date'], predictions['predicted_price'], marker='o', linestyle='-')
        plt.title(title)
        plt.xlabel('Date')
        plt.ylabel('Price')
        plt.grid(True)
        plt.xticks(rotation=45)
        plt.tight_layout()
        
        if filename:
            plt.savefig(f'predictions/{filename}.png')
            plt.close()
        else:
            plt.show()
    
    def train_model(self, X, y, model_name="fruit_price_model"):
        """
        Train the price prediction model
        
        Args:
            X (numpy.ndarray): Features for training
            y (numpy.ndarray): Target prices for training
            model_name (str): Name to save the model
        """
        self.price_model.train(X, y)
        self.price_model.save_model(f'models/{model_name}')
    
    def load_model(self, model_name="fruit_price_model"):
        """
        Load a trained model
        
        Args:
            model_name (str): Name of the model to load
        """
        try:
            self.price_model.load_model(f'models/{model_name}')
            return True
        except:
            print(f"Model {model_name} not found. Using rule-based prediction instead.")
            return False
