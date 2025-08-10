"""
Example script demonstrating how to use the Fruit Price Predictor
"""

from price_predictor import PricePredictor
import matplotlib.pyplot as plt

def main():
    # Initialize the price predictor
    predictor = PricePredictor()
    
    # Example location (San Francisco)
    latitude = 37.7749
    longitude = -122.4194
    
    # Example fruit and price
    fruit_name = "apple"
    current_price = 1.99  # dollars per unit
    
    print(f"Predicting prices for {fruit_name} in San Francisco for the next 14 days...")
    
    # Predict prices for the next 14 days
    short_term_predictions = predictor.predict_prices(
        latitude, longitude, fruit_name, current_price
    )
    
    # Display short-term predictions
    print("\nShort-term Price Predictions:")
    for _, row in short_term_predictions.iterrows():
        print(f"{row['date'].strftime('%Y-%m-%d')}: ${row['predicted_price']:.2f}")
    
    # Predict yearly trend
    print(f"\nPredicting yearly trend for {fruit_name} prices...")
    yearly_predictions = predictor.predict_yearly_trend(
        latitude, longitude, fruit_name, current_price
    )
    
    # Display yearly predictions
    print("\nYearly Price Trend (Monthly):")
    for _, row in yearly_predictions.iterrows():
        print(f"{row['date'].strftime('%Y-%m')}: ${row['predicted_price']:.2f}")
    
    # Plot both predictions
    plt.figure(figsize=(15, 10))
    
    # Short-term predictions
    plt.subplot(2, 1, 1)
    plt.plot(short_term_predictions['date'], short_term_predictions['predicted_price'], 
             marker='o', linestyle='-', color='blue')
    plt.title(f'14-Day Price Forecast for {fruit_name.capitalize()}')
    plt.xlabel('Date')
    plt.ylabel('Price ($)')
    plt.grid(True)
    plt.xticks(rotation=45)
    
    # Yearly predictions
    plt.subplot(2, 1, 2)
    plt.plot(yearly_predictions['date'], yearly_predictions['predicted_price'], 
             marker='s', linestyle='-', color='green')
    plt.title(f'Yearly Price Trend for {fruit_name.capitalize()}')
    plt.xlabel('Month')
    plt.ylabel('Price ($)')
    plt.grid(True)
    plt.xticks(rotation=45)
    
    plt.tight_layout()
    plt.savefig(f'{fruit_name}_price_predictions.png')
    print(f"\nPlot saved as {fruit_name}_price_predictions.png")
    
    # Save predictions to files
    predictor.save_predictions(short_term_predictions, f"{fruit_name}_14days")
    predictor.save_predictions(yearly_predictions, f"{fruit_name}_yearly")
    print(f"Predictions saved to predictions/{fruit_name}_14days.json and predictions/{fruit_name}_yearly.json")

if __name__ == "__main__":
    main()
