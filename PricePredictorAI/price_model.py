import numpy as np
import pandas as pd
import joblib
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, LSTM, Dropout
import os

class FruitPriceModel:
    """
    Model to predict fruit prices based on weather data and other factors
    """
    
    def __init__(self, model_type="random_forest"):
        """
        Initialize the price prediction model
        
        Args:
            model_type (str): Type of model to use ('random_forest' or 'lstm')
        """
        self.model_type = model_type
        self.model = None
        self.scaler = StandardScaler()
        self.fruit_factors = {
            # Fruit-specific factors that affect price
            'apple': {
                'temp_sensitivity': 0.7,  # 0-1 scale, how sensitive to temperature
                'rain_sensitivity': 0.5,  # 0-1 scale, how sensitive to rain
                'growing_season': [3, 10],  # Growing season months (start, end)
                'harvest_months': [9, 10, 11],  # Harvest months
                'shelf_life': 90,  # Days
                'price_volatility': 0.3,  # 0-1 scale
            },
            'banana': {
                'temp_sensitivity': 0.9,
                'rain_sensitivity': 0.8,
                'growing_season': [1, 12],  # Year-round in tropical regions
                'harvest_months': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],  # Year-round
                'shelf_life': 14,
                'price_volatility': 0.2,
            },
            'orange': {
                'temp_sensitivity': 0.6,
                'rain_sensitivity': 0.4,
                'growing_season': [2, 10],
                'harvest_months': [11, 12, 1, 2],
                'shelf_life': 30,
                'price_volatility': 0.4,
            },
            'mango': {
                'temp_sensitivity': 0.8,
                'rain_sensitivity': 0.6,
                'growing_season': [2, 8],
                'harvest_months': [5, 6, 7, 8],
                'shelf_life': 21,
                'price_volatility': 0.5,
            },
            'strawberry': {
                'temp_sensitivity': 0.8,
                'rain_sensitivity': 0.7,
                'growing_season': [3, 6],
                'harvest_months': [5, 6, 7],
                'shelf_life': 7,
                'price_volatility': 0.6,
            },
            # Add more fruits as needed
        }
        
        # Default to apple if fruit not in our database
        self.default_factors = self.fruit_factors['apple']
    
    def _create_model(self, input_dim):
        """
        Create the prediction model
        
        Args:
            input_dim (int): Number of input features
        """
        if self.model_type == "random_forest":
            self.model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42
            )
        elif self.model_type == "lstm":
            self.model = Sequential([
                LSTM(50, return_sequences=True, input_shape=(None, input_dim)),
                Dropout(0.2),
                LSTM(50),
                Dropout(0.2),
                Dense(25, activation='relu'),
                Dense(1)
            ])
            self.model.compile(optimizer='adam', loss='mse')
    
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
        if self.model_type == "random_forest":
            self.model.fit(X_scaled, y)
        elif self.model_type == "lstm":
            # Reshape for LSTM [samples, time steps, features]
            X_reshaped = X_scaled.reshape((X_scaled.shape[0], 1, X_scaled.shape[1]))
            self.model.fit(X_reshaped, y, epochs=50, batch_size=32, verbose=0)
    
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
        if self.model_type == "random_forest":
            return self.model.predict(X_scaled)
        elif self.model_type == "lstm":
            # Reshape for LSTM [samples, time steps, features]
            X_reshaped = X_scaled.reshape((X_scaled.shape[0], 1, X_scaled.shape[1]))
            return self.model.predict(X_reshaped).flatten()
    
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
        
        if self.model_type == "random_forest":
            joblib.dump({
                'model': self.model,
                'scaler': self.scaler,
                'model_type': self.model_type
            }, filepath)
        elif self.model_type == "lstm":
            # Save Keras model
            self.model.save(filepath + ".keras")
            # Save scaler and model type
            joblib.dump({
                'scaler': self.scaler,
                'model_type': self.model_type
            }, filepath + ".joblib")
    
    def load_model(self, filepath):
        """
        Load a trained model
        
        Args:
            filepath (str): Path to the saved model
        """
        if self.model_type == "random_forest":
            saved_data = joblib.load(filepath)
            self.model = saved_data['model']
            self.scaler = saved_data['scaler']
            self.model_type = saved_data['model_type']
        elif self.model_type == "lstm":
            # Load Keras model
            self.model = tf.keras.models.load_model(filepath + ".keras")
            # Load scaler and model type
            saved_data = joblib.load(filepath + ".joblib")
            self.scaler = saved_data['scaler']
            self.model_type = saved_data['model_type']
    
    def predict_price_with_weather(self, weather_features, fruit_name, current_price):
        """
        Predict fruit prices based on weather features
        
        Args:
            weather_features (pandas.DataFrame): Weather features
            fruit_name (str): Name of the fruit
            current_price (float): Current price of the fruit
            
        Returns:
            pandas.DataFrame: Predicted prices with dates
        """
        # Get fruit-specific factors
        fruit_factors = self.fruit_factors.get(fruit_name.lower(), self.default_factors)
        
        # If we don't have a trained model, use a rule-based approach
        if self.model is None:
            return self._rule_based_prediction(weather_features, fruit_name, current_price, fruit_factors)
        
        # TODO: Implement model-based prediction when trained model is available
        # For now, fall back to rule-based prediction
        return self._rule_based_prediction(weather_features, fruit_name, current_price, fruit_factors)
    
    def _rule_based_prediction(self, weather_features, fruit_name, current_price, fruit_factors):
        """
        Rule-based price prediction based on weather and fruit factors
        
        Args:
            weather_features (pandas.DataFrame): Weather features
            fruit_name (str): Name of the fruit
            current_price (float): Current price of the fruit
            fruit_factors (dict): Fruit-specific factors
            
        Returns:
            pandas.DataFrame: Predicted prices with dates
        """
        # Create a copy of the weather features
        prediction_df = weather_features.copy()
        
        # Initialize price column with current price
        prediction_df['predicted_price'] = current_price
        
        # Get current month
        current_month = datetime.now().month
        
        # Apply rules for each day
        for i in range(len(prediction_df)):
            if i == 0:
                # First day is the current price
                continue
            
            # Get previous day's price
            prev_price = prediction_df.loc[i-1, 'predicted_price']
            
            # Get weather conditions
            avg_temp = prediction_df.loc[i, 'avg_temp']
            precipitation = prediction_df.loc[i, 'precipitation']
            is_rainy = prediction_df.loc[i, 'is_rainy']
            is_hot = prediction_df.loc[i, 'is_hot']
            is_cold = prediction_df.loc[i, 'is_cold']
            month = prediction_df.loc[i, 'month']
            
            # Base price change (random small fluctuation)
            price_change = np.random.normal(0, 0.01 * fruit_factors['price_volatility'] * prev_price)
            
            # Temperature effect
            if is_hot and fruit_factors['temp_sensitivity'] > 0.5:
                # Hot weather affects sensitive fruits negatively
                price_change += 0.02 * fruit_factors['temp_sensitivity'] * prev_price
            elif is_cold and fruit_factors['temp_sensitivity'] > 0.5:
                # Cold weather affects sensitive fruits negatively
                price_change += 0.02 * fruit_factors['temp_sensitivity'] * prev_price
            
            # Precipitation effect
            if is_rainy and fruit_factors['rain_sensitivity'] > 0.5:
                # Heavy rain affects sensitive fruits negatively
                price_change += 0.015 * fruit_factors['rain_sensitivity'] * prev_price
            
            # Seasonality effect
            if month in fruit_factors['harvest_months']:
                # Price decreases during harvest season (more supply)
                price_change -= 0.03 * prev_price
            elif month not in range(fruit_factors['growing_season'][0], fruit_factors['growing_season'][1] + 1):
                # Price increases outside growing season (less supply)
                price_change += 0.02 * prev_price
            
            # Apply the price change
            new_price = max(prev_price + price_change, 0.5 * current_price)  # Ensure price doesn't drop too much
            prediction_df.loc[i, 'predicted_price'] = new_price
        
        # Select only relevant columns for output
        result_df = prediction_df[['date', 'predicted_price']].copy()
        
        return result_df
    
    def predict_yearly_trend(self, latitude, longitude, fruit_name, current_price):
        """
        Predict yearly price trend based on seasonal patterns
        
        Args:
            latitude (float): Location latitude
            longitude (float): Location longitude
            fruit_name (str): Name of the fruit
            current_price (float): Current price of the fruit
            
        Returns:
            pandas.DataFrame: Yearly price trend with dates
        """
        # Get fruit-specific factors
        fruit_factors = self.fruit_factors.get(fruit_name.lower(), self.default_factors)
        
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
        yearly_df['predicted_price'] = current_price
        
        # Apply seasonal patterns
        for i, row in yearly_df.iterrows():
            month = row['month']
            
            # Base price (current price)
            base_price = current_price
            
            # Seasonal adjustment
            if month in fruit_factors['harvest_months']:
                # Lower price during harvest season (more supply)
                seasonal_factor = 0.8
            elif month not in range(fruit_factors['growing_season'][0], fruit_factors['growing_season'][1] + 1):
                # Higher price outside growing season (less supply)
                seasonal_factor = 1.3
            else:
                # Normal price during growing season
                seasonal_factor = 1.0
            
            # Apply seasonal factor
            yearly_df.loc[i, 'predicted_price'] = base_price * seasonal_factor
            
            # Add some random variation (market fluctuations)
            yearly_df.loc[i, 'predicted_price'] *= np.random.uniform(
                1 - 0.1 * fruit_factors['price_volatility'],
                1 + 0.1 * fruit_factors['price_volatility']
            )
        
        return yearly_df
