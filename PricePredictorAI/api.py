from flask import Flask, request, jsonify
from price_predictor import PricePredictor
import os

app = Flask(__name__)
predictor = PricePredictor()

@app.route('/predict', methods=['POST'])
def predict_prices():
    """
    API endpoint to predict fruit prices
    
    Expected JSON input:
    {
        "latitude": 37.7749,
        "longitude": -122.4194,
        "fruit_name": "apple",
        "current_price": 1.99,
        "days": 14
    }
    """
    try:
        # Get request data
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['latitude', 'longitude', 'fruit_name', 'current_price']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Get parameters
        latitude = float(data['latitude'])
        longitude = float(data['longitude'])
        fruit_name = data['fruit_name']
        current_price = float(data['current_price'])
        days = int(data.get('days', 14))
        
        # Predict prices
        predictions = predictor.predict_prices(
            latitude, longitude, fruit_name, current_price, days
        )
        
        # Convert to JSON-serializable format
        result = []
        for _, row in predictions.iterrows():
            result.append({
                'date': row['date'].strftime('%Y-%m-%d'),
                'price': float(row['predicted_price'])
            })
        
        return jsonify({'predictions': result})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/predict/yearly', methods=['POST'])
def predict_yearly_trend():
    """
    API endpoint to predict yearly price trend
    
    Expected JSON input:
    {
        "latitude": 37.7749,
        "longitude": -122.4194,
        "fruit_name": "apple",
        "current_price": 1.99
    }
    """
    try:
        # Get request data
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['latitude', 'longitude', 'fruit_name', 'current_price']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Get parameters
        latitude = float(data['latitude'])
        longitude = float(data['longitude'])
        fruit_name = data['fruit_name']
        current_price = float(data['current_price'])
        
        # Predict yearly trend
        predictions = predictor.predict_yearly_trend(
            latitude, longitude, fruit_name, current_price
        )
        
        # Convert to JSON-serializable format
        result = []
        for _, row in predictions.iterrows():
            result.append({
                'date': row['date'].strftime('%Y-%m-%d'),
                'price': float(row['predicted_price'])
            })
        
        return jsonify({'predictions': result})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    # Create necessary directories
    os.makedirs('models', exist_ok=True)
    os.makedirs('predictions', exist_ok=True)
    
    # Run the Flask app
    app.run(debug=True, host='0.0.0.0', port=5000)
