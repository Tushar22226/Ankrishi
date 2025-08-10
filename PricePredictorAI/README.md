# Fruit Price Predictor AI

An AI-powered system that predicts fruit prices based on location, current price, and weather data. The system uses the Open-Meteo API to fetch weather forecasts and applies machine learning models to predict how prices will change over time.

## Features

- **Short-term Predictions**: Forecast fruit prices for the next 14 days based on weather conditions
- **Yearly Trends**: Predict seasonal price patterns throughout the year
- **Multiple Fruits**: Support for various fruits with different sensitivity to weather conditions
- **Weather Integration**: Uses Open-Meteo API to fetch accurate weather forecasts
- **API Access**: RESTful API for easy integration with other systems
- **Command-line Interface**: Simple CLI for quick predictions

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/fruit-price-predictor.git
   cd fruit-price-predictor
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

## Usage

### Command Line Interface

Predict prices for the next 14 days:
```
python main.py --latitude 37.7749 --longitude -122.4194 --fruit apple --price 1.99
```

Predict yearly trend:
```
python main.py --latitude 37.7749 --longitude -122.4194 --fruit apple --price 1.99 --yearly
```

Save predictions to file:
```
python main.py --latitude 37.7749 --longitude -122.4194 --fruit apple --price 1.99 --save
```

Plot predictions:
```
python main.py --latitude 37.7749 --longitude -122.4194 --fruit apple --price 1.99 --plot
```

### API

Start the API server:
```
python api.py
```

Make a prediction request:
```
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"latitude": 37.7749, "longitude": -122.4194, "fruit_name": "apple", "current_price": 1.99, "days": 14}'
```

Get yearly trend:
```
curl -X POST http://localhost:5000/predict/yearly \
  -H "Content-Type: application/json" \
  -d '{"latitude": 37.7749, "longitude": -122.4194, "fruit_name": "apple", "current_price": 1.99}'
```

## How It Works

1. **Weather Data Collection**: The system fetches weather forecasts from the Open-Meteo API based on the provided latitude and longitude.

2. **Feature Extraction**: Relevant weather features that affect fruit growth and supply are extracted from the forecast data.

3. **Price Prediction**: The system uses either a rule-based approach or a trained machine learning model to predict how prices will change based on:
   - Weather conditions (temperature, precipitation, etc.)
   - Fruit-specific factors (temperature sensitivity, rain sensitivity, etc.)
   - Seasonal patterns (growing season, harvest months, etc.)
   - Current market price

4. **Output**: The system returns predicted prices for each day in the forecast period or monthly prices for the yearly trend.

## Supported Fruits

The system currently supports the following fruits:
- Apple
- Banana
- Orange
- Mango
- Strawberry

More fruits can be added by extending the `fruit_factors` dictionary in the `price_model.py` file.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Open-Meteo](https://open-meteo.com/) for providing free weather forecast API
- [scikit-learn](https://scikit-learn.org/) for machine learning tools
- [TensorFlow](https://www.tensorflow.org/) for deep learning capabilities
- [Flask](https://flask.palletsprojects.com/) for the API server
