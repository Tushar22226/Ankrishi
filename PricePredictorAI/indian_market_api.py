"""
API for Indian market price predictions
"""

from flask import Flask, request, jsonify
from indian_price_predictor import IndianPricePredictor
from indian_market_config import INDIAN_REGIONS, INDIAN_FRUITS
import os

app = Flask(__name__)

# Create predictors for each region
predictors = {region: IndianPricePredictor(region=region) for region in INDIAN_REGIONS.keys()}

@app.route('/api/predict', methods=['POST'])
def predict_prices():
    """
    API endpoint to predict fruit prices for Indian markets
    
    Expected JSON input:
    {
        "fruit_name": "mango",
        "current_price": 100,
        "region": "north",
        "days": 14,
        "currency": "INR",
        "latitude": null,  // Optional, overrides region center
        "longitude": null  // Optional, overrides region center
    }
    """
    try:
        # Get request data
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['fruit_name', 'current_price', 'region']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Get parameters
        fruit_name = data['fruit_name']
        current_price = float(data['current_price'])
        region = data['region'].lower()
        days = int(data.get('days', 14))
        currency = data.get('currency', 'INR').upper()
        
        # Validate region
        if region not in INDIAN_REGIONS:
            return jsonify({'error': f'Invalid region: {region}. Must be one of {list(INDIAN_REGIONS.keys())}'}), 400
        
        # Get coordinates
        if data.get('latitude') is not None and data.get('longitude') is not None:
            latitude = float(data['latitude'])
            longitude = float(data['longitude'])
        else:
            # Use region center coordinates
            region_info = INDIAN_REGIONS[region]
            latitude = region_info['center_lat']
            longitude = region_info['center_lon']
        
        # Get predictor for the region
        predictor = predictors[region]
        
        # Predict prices
        predictions = predictor.predict_prices(
            latitude, longitude, fruit_name, current_price, days, currency
        )
        
        # Convert to JSON-serializable format
        result = []
        for _, row in predictions.iterrows():
            result.append({
                'date': row['date'].strftime('%Y-%m-%d'),
                'price': float(row['predicted_price'])
            })
        
        # Get fruit information
        fruit_info = None
        if fruit_name.lower() in INDIAN_FRUITS:
            fruit_data = INDIAN_FRUITS[fruit_name.lower()]
            fruit_info = {
                'name': fruit_name,
                'hindi_name': fruit_data['hindi_name'],
                'varieties': fruit_data['varieties'],
                'growing_season': fruit_data['growing_season'],
                'harvest_months': fruit_data['harvest_months'],
                'base_price': fruit_data['base_price_inr'],
                'shelf_life': fruit_data['shelf_life'],
                'primary_regions': fruit_data['primary_regions']
            }
        
        return jsonify({
            'predictions': result,
            'fruit_info': fruit_info,
            'region': region,
            'currency': currency,
            'coordinates': {
                'latitude': latitude,
                'longitude': longitude
            }
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict/yearly', methods=['POST'])
def predict_yearly_trend():
    """
    API endpoint to predict yearly price trend for Indian markets
    
    Expected JSON input:
    {
        "fruit_name": "mango",
        "current_price": 100,
        "region": "north",
        "currency": "INR",
        "latitude": null,  // Optional, overrides region center
        "longitude": null  // Optional, overrides region center
    }
    """
    try:
        # Get request data
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['fruit_name', 'current_price', 'region']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Get parameters
        fruit_name = data['fruit_name']
        current_price = float(data['current_price'])
        region = data['region'].lower()
        currency = data.get('currency', 'INR').upper()
        
        # Validate region
        if region not in INDIAN_REGIONS:
            return jsonify({'error': f'Invalid region: {region}. Must be one of {list(INDIAN_REGIONS.keys())}'}), 400
        
        # Get coordinates
        if data.get('latitude') is not None and data.get('longitude') is not None:
            latitude = float(data['latitude'])
            longitude = float(data['longitude'])
        else:
            # Use region center coordinates
            region_info = INDIAN_REGIONS[region]
            latitude = region_info['center_lat']
            longitude = region_info['center_lon']
        
        # Get predictor for the region
        predictor = predictors[region]
        
        # Predict yearly trend
        predictions = predictor.predict_yearly_trend(
            latitude, longitude, fruit_name, current_price, currency
        )
        
        # Convert to JSON-serializable format
        result = []
        for _, row in predictions.iterrows():
            result.append({
                'date': row['date'].strftime('%Y-%m-%d'),
                'price': float(row['predicted_price'])
            })
        
        return jsonify({
            'predictions': result,
            'region': region,
            'currency': currency,
            'coordinates': {
                'latitude': latitude,
                'longitude': longitude
            }
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/fruits', methods=['GET'])
def get_fruits():
    """
    API endpoint to get list of available fruits
    """
    fruits = []
    for fruit_name, fruit_data in INDIAN_FRUITS.items():
        fruits.append({
            'name': fruit_name,
            'hindi_name': fruit_data['hindi_name'],
            'varieties': fruit_data['varieties'],
            'base_price': fruit_data['base_price_inr'],
            'primary_regions': fruit_data['primary_regions']
        })
    
    return jsonify({'fruits': fruits})

@app.route('/api/regions', methods=['GET'])
def get_regions():
    """
    API endpoint to get list of available regions
    """
    regions = []
    for region_name, region_data in INDIAN_REGIONS.items():
        regions.append({
            'code': region_name,
            'name': region_data['name'],
            'states': region_data['states'],
            'coordinates': {
                'latitude': region_data['center_lat'],
                'longitude': region_data['center_lon']
            }
        })
    
    return jsonify({'regions': regions})

@app.route('/api/fruit/<fruit_name>', methods=['GET'])
def get_fruit_info(fruit_name):
    """
    API endpoint to get information about a specific fruit
    """
    if fruit_name.lower() in INDIAN_FRUITS:
        fruit_data = INDIAN_FRUITS[fruit_name.lower()]
        fruit_info = {
            'name': fruit_name,
            'hindi_name': fruit_data['hindi_name'],
            'varieties': fruit_data['varieties'],
            'growing_season': fruit_data['growing_season'],
            'harvest_months': fruit_data['harvest_months'],
            'base_price': fruit_data['base_price_inr'],
            'shelf_life': fruit_data['shelf_life'],
            'primary_regions': fruit_data['primary_regions'],
            'seasonal_price_factor': fruit_data['seasonal_price_factor']
        }
        return jsonify(fruit_info)
    else:
        return jsonify({'error': f'Fruit {fruit_name} not found'}), 404

@app.route('/api/region/<region_name>', methods=['GET'])
def get_region_info(region_name):
    """
    API endpoint to get information about a specific region
    """
    if region_name.lower() in INDIAN_REGIONS:
        region_data = INDIAN_REGIONS[region_name.lower()]
        region_info = {
            'code': region_name,
            'name': region_data['name'],
            'states': region_data['states'],
            'coordinates': {
                'latitude': region_data['center_lat'],
                'longitude': region_data['center_lon']
            }
        }
        return jsonify(region_info)
    else:
        return jsonify({'error': f'Region {region_name} not found'}), 404

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    # Create necessary directories
    os.makedirs('models/indian', exist_ok=True)
    os.makedirs('predictions/indian', exist_ok=True)
    
    # Run the Flask app
    app.run(debug=True, host='0.0.0.0', port=5001)
