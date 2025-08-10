"""
Price prediction model specifically for Indian markets
"""

import numpy as np
import pandas as pd
import joblib
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import os

from indian_market_config import (
    INDIAN_FRUITS, 
    INDIAN_REGIONS, 
    MARKET_FACTORS, 
    INR_TO_USD, 
    USD_TO_INR
)

class IndianPriceModel:
    """
    Model to predict fruit prices for Indian markets based on weather data and market factors
    """
    
    def __init__(self, region="north"):
        """
        Initialize the Indian price prediction model
        
        Args:
            region (str): Region in India ('north', 'south', 'east', 'west', 'central', 'northeast')
        """
        self.model_type = "random_forest"
        self.model = None
        self.scaler = StandardScaler()
        self.region = region.lower()
        
        # Validate region
        if self.region not in INDIAN_REGIONS:
            raise ValueError(f"Invalid region: {region}. Must be one of {list(INDIAN_REGIONS.keys())}")
        
        # Get region data
        self.region_data = INDIAN_REGIONS[self.region]
        
        # Get market factors for this region
        self.transportation_cost = MARKET_FACTORS['transportation_cost'][self.region]
        self.storage_cost = MARKET_FACTORS['storage_cost'][self.region]
        self.demand_factor = MARKET_FACTORS['demand_factor'][self.region]
        
        # Default to first fruit if not specified
        self.default_fruit = list(INDIAN_FRUITS.keys())[0]
    
    def _create_model(self, input_dim):
        """
        Create the prediction model
        
        Args:
            input_dim (int): Number of input features
        """
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42
        )
    
    def train(self, X, y):
        """
        Train the price prediction model
        
        Args:
            X (numpy.ndarray): Features for training
            y (numpy.ndarray): Target prices for training
        """
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Create model if not exists
        if self.model is None:
            self._create_model(X.shape[1])
        
        # Train model
        self.model.fit(X_scaled, y)
    
    def predict(self, X):
        """
        Make price predictions
        
        Args:
            X (numpy.ndarray): Features for prediction
            
        Returns:
            numpy.ndarray: Predicted prices
        """
        if self.model is None:
            raise ValueError("Model not trained yet. Call train() first.")
        
        # Scale features
        X_scaled = self.scaler.transform(X)
        
        # Make predictions
        return self.model.predict(X_scaled)
    
    def save_model(self, filepath):
        """
        Save the trained model
        
        Args:
            filepath (str): Path to save the model
        """
        if self.model is None:
            raise ValueError("No model to save. Train a model first.")
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'model_type': self.model_type,
            'region': self.region
        }, filepath)
    
    def load_model(self, filepath):
        """
        Load a trained model
        
        Args:
            filepath (str): Path to the saved model
        """
        saved_data = joblib.load(filepath)
        self.model = saved_data['model']
        self.scaler = saved_data['scaler']
        self.model_type = saved_data['model_type']
        self.region = saved_data['region']
    
    def predict_price_with_weather(self, weather_features, fruit_name, current_price, currency="INR"):
        """
        Predict fruit prices based on weather features for Indian markets
        
        Args:
            weather_features (pandas.DataFrame): Weather features
            fruit_name (str): Name of the fruit
            current_price (float): Current price of the fruit
            currency (str): Currency of the price ('INR' or 'USD')
            
        Returns:
            pandas.DataFrame: Predicted prices with dates
        """
        # Convert price to INR if in USD
        if currency.upper() == "USD":
            current_price_inr = current_price * USD_TO_INR
        else:
            current_price_inr = current_price
        
        # Get fruit-specific factors
        if fruit_name.lower() in INDIAN_FRUITS:
            fruit_data = INDIAN_FRUITS[fruit_name.lower()]
        else:
            # Use default fruit if not found
            print(f"Fruit {fruit_name} not found in Indian fruits database. Using {self.default_fruit} as default.")
            fruit_data = INDIAN_FRUITS[self.default_fruit]
        
        # If we don't have a trained model, use a rule-based approach
        if self.model is None:
            return self._rule_based_prediction(weather_features, fruit_name, current_price_inr, fruit_data, currency)
        
        # TODO: Implement model-based prediction when trained model is available
        # For now, fall back to rule-based prediction
        return self._rule_based_prediction(weather_features, fruit_name, current_price_inr, fruit_data, currency)
    
    def _rule_based_prediction(self, weather_features, fruit_name, current_price_inr, fruit_data, currency="INR"):
        """
        Rule-based price prediction based on weather and fruit factors for Indian markets
        
        Args:
            weather_features (pandas.DataFrame): Weather features
            fruit_name (str): Name of the fruit
            current_price_inr (float): Current price of the fruit in INR
            fruit_data (dict): Fruit-specific data
            currency (str): Currency to return prices in ('INR' or 'USD')
            
        Returns:
            pandas.DataFrame: Predicted prices with dates
        """
        # Create a copy of the weather features
        prediction_df = weather_features.copy()
        
        # Initialize price column with current price
        prediction_df['predicted_price_inr'] = current_price_inr
        
        # Get current month
        current_month = datetime.now().month
        
        # Apply rules for each day
        for i in range(len(prediction_df)):
            if i == 0:
                # First day is the current price
                continue
            
            # Get previous day's price
            prev_price = prediction_df.loc[i-1, 'predicted_price_inr']
            
            # Get weather conditions
            avg_temp = prediction_df.loc[i, 'avg_temp']
            precipitation = prediction_df.loc[i, 'precipitation']
            is_rainy = prediction_df.loc[i, 'is_rainy']
            is_hot = prediction_df.loc[i, 'is_hot']
            is_cold = prediction_df.loc[i, 'is_cold']
            month = prediction_df.loc[i, 'month']
            
            # Base price change (random small fluctuation)
            price_change = np.random.normal(0, 0.01 * fruit_data['price_volatility'] * prev_price)
            
            # Temperature effect
            if is_hot and fruit_data['temp_sensitivity'] > 0.5:
                # Hot weather affects sensitive fruits negatively
                price_change += 0.02 * fruit_data['temp_sensitivity'] * prev_price
            elif is_cold and fruit_data['temp_sensitivity'] > 0.5:
                # Cold weather affects sensitive fruits negatively
                price_change += 0.02 * fruit_data['temp_sensitivity'] * prev_price
            
            # Precipitation effect
            if is_rainy and fruit_data['rain_sensitivity'] > 0.5:
                # Heavy rain affects sensitive fruits negatively
                price_change += 0.015 * fruit_data['rain_sensitivity'] * prev_price
            
            # Seasonality effect
            if month in fruit_data['harvest_months']:
                # Price decreases during harvest season (more supply)
                price_change -= 0.03 * prev_price
            elif month not in range(fruit_data['growing_season'][0], fruit_data['growing_season'][1] + 1):
                # Price increases outside growing season (less supply)
                price_change += 0.02 * prev_price
            
            # Apply seasonal price factor from Indian market data
            seasonal_factor = fruit_data['seasonal_price_factor'].get(month, 1.0)
            price_change += (seasonal_factor - 1.0) * 0.01 * prev_price
            
            # Apply festival factor
            festival_factor = MARKET_FACTORS['festival_seasons'].get(month, 1.0)
            price_change += (festival_factor - 1.0) * 0.01 * prev_price
            
            # Apply region-specific factors
            price_change += (self.transportation_cost - 1.0) * 0.005 * prev_price
            price_change += (self.storage_cost - 1.0) * 0.005 * prev_price
            price_change += (self.demand_factor - 1.0) * 0.01 * prev_price
            
            # Apply the price change
            new_price = max(prev_price + price_change, 0.5 * current_price_inr)  # Ensure price doesn't drop too much
            prediction_df.loc[i, 'predicted_price_inr'] = new_price
        
        # Convert to USD if requested
        if currency.upper() == "USD":
            prediction_df['predicted_price'] = prediction_df['predicted_price_inr'] * INR_TO_USD
        else:
            prediction_df['predicted_price'] = prediction_df['predicted_price_inr']
        
        # Select only relevant columns for output
        result_df = prediction_df[['date', 'predicted_price']].copy()
        
        return result_df
    
    def predict_yearly_trend(self, latitude, longitude, fruit_name, current_price, currency="INR"):
        """
        Predict yearly price trend based on seasonal patterns for Indian markets
        
        Args:
            latitude (float): Location latitude
            longitude (float): Location longitude
            fruit_name (str): Name of the fruit
            current_price (float): Current price of the fruit
            currency (str): Currency of the price ('INR' or 'USD')
            
        Returns:
            pandas.DataFrame: Yearly price trend with dates
        """
        # Convert price to INR if in USD
        if currency.upper() == "USD":
            current_price_inr = current_price * USD_TO_INR
        else:
            current_price_inr = current_price
        
        # Get fruit-specific factors
        if fruit_name.lower() in INDIAN_FRUITS:
            fruit_data = INDIAN_FRUITS[fruit_name.lower()]
        else:
            # Use default fruit if not found
            print(f"Fruit {fruit_name} not found in Indian fruits database. Using {self.default_fruit} as default.")
            fruit_data = INDIAN_FRUITS[self.default_fruit]
        
        # Create a date range for the entire year
        today = datetime.now()
        start_date = today.replace(day=1, month=1)
        end_date = today.replace(day=31, month=12)
        dates = pd.date_range(start=start_date, end=end_date, freq='MS')  # Monthly frequency
        
        # Create a dataframe for yearly prediction
        yearly_df = pd.DataFrame({
            'date': dates,
            'month': [d.month for d in dates]
        })
        
        # Initialize with current price
        yearly_df['predicted_price_inr'] = current_price_inr
        
        # Apply seasonal patterns
        for i, row in yearly_df.iterrows():
            month = row['month']
            
            # Base price (current price)
            base_price = current_price_inr
            
            # Get seasonal factor from Indian market data
            seasonal_factor = fruit_data['seasonal_price_factor'].get(month, 1.0)
            
            # Get festival factor
            festival_factor = MARKET_FACTORS['festival_seasons'].get(month, 1.0)
            
            # Apply seasonal and festival factors
            price = base_price * seasonal_factor * festival_factor
            
            # Apply region-specific factors
            price *= self.transportation_cost
            price *= self.storage_cost
            price *= self.demand_factor
            
            # Apply some random variation (market fluctuations)
            price *= np.random.uniform(
                1 - 0.05 * fruit_data['price_volatility'],
                1 + 0.05 * fruit_data['price_volatility']
            )
            
            yearly_df.loc[i, 'predicted_price_inr'] = price
        
        # Convert to USD if requested
        if currency.upper() == "USD":
            yearly_df['predicted_price'] = yearly_df['predicted_price_inr'] * INR_TO_USD
        else:
            yearly_df['predicted_price'] = yearly_df['predicted_price_inr']
        
        # Select only relevant columns for output
        result_df = yearly_df[['date', 'predicted_price']].copy()
        
        return result_df
