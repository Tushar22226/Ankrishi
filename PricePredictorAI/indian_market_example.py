"""
Example script demonstrating how to use the Indian Market Price Predictor
"""

from indian_price_predictor import IndianPricePredictor
import matplotlib.pyplot as plt

def main():
    # Initialize the price predictor for North India
    north_predictor = IndianPricePredictor(region="north")
    
    # Example fruit and price
    fruit_name = "mango"
    current_price = 100  # ₹100 per kg
    
    print(f"Predicting prices for {fruit_name} in North India for the next 14 days...")
    
    # Get region coordinates
    region_info = north_predictor.get_region_info("north")
    latitude = region_info['center_lat']
    longitude = region_info['center_lon']
    
    # Predict prices for the next 14 days
    short_term_predictions = north_predictor.predict_prices(
        latitude, longitude, fruit_name, current_price
    )
    
    # Display short-term predictions
    print("\nShort-term Price Predictions (North India):")
    for _, row in short_term_predictions.iterrows():
        print(f"{row['date'].strftime('%Y-%m-%d')}: ₹{row['predicted_price']:.2f}")
    
    # Predict yearly trend
    print(f"\nPredicting yearly trend for {fruit_name} prices in North India...")
    yearly_predictions_north = north_predictor.predict_yearly_trend(
        latitude, longitude, fruit_name, current_price
    )
    
    # Initialize the price predictor for South India
    south_predictor = IndianPricePredictor(region="south")
    
    # Get region coordinates
    region_info = south_predictor.get_region_info("south")
    latitude = region_info['center_lat']
    longitude = region_info['center_lon']
    
    # Predict yearly trend for South India
    print(f"\nPredicting yearly trend for {fruit_name} prices in South India...")
    yearly_predictions_south = south_predictor.predict_yearly_trend(
        latitude, longitude, fruit_name, current_price
    )
    
    # Display yearly predictions for North India
    print("\nYearly Price Trend (North India):")
    for _, row in yearly_predictions_north.iterrows():
        print(f"{row['date'].strftime('%Y-%m')}: ₹{row['predicted_price']:.2f}")
    
    # Plot both predictions
    plt.figure(figsize=(15, 10))
    
    # Short-term predictions
    plt.subplot(2, 1, 1)
    plt.plot(short_term_predictions['date'], short_term_predictions['predicted_price'], 
             marker='o', linestyle='-', color='blue')
    plt.title(f'14-Day Price Forecast for {fruit_name.capitalize()} in North India')
    plt.xlabel('Date')
    plt.ylabel('Price (₹)')
    plt.grid(True)
    plt.xticks(rotation=45)
    
    # Yearly predictions comparison
    plt.subplot(2, 1, 2)
    plt.plot(yearly_predictions_north['date'], yearly_predictions_north['predicted_price'], 
             marker='s', linestyle='-', color='green', label='North India')
    plt.plot(yearly_predictions_south['date'], yearly_predictions_south['predicted_price'], 
             marker='o', linestyle='--', color='red', label='South India')
    plt.title(f'Yearly Price Trend for {fruit_name.capitalize()} - Regional Comparison')
    plt.xlabel('Month')
    plt.ylabel('Price (₹)')
    plt.grid(True)
    plt.legend()
    plt.xticks(rotation=45)
    
    plt.tight_layout()
    plt.savefig(f'predictions/indian/{fruit_name}_regional_comparison.png')
    print(f"\nPlot saved as predictions/indian/{fruit_name}_regional_comparison.png")
    
    # Save predictions to files
    north_predictor.save_predictions(short_term_predictions, f"{fruit_name}_north_14days")
    north_predictor.save_predictions(yearly_predictions_north, f"{fruit_name}_north_yearly")
    south_predictor.save_predictions(yearly_predictions_south, f"{fruit_name}_south_yearly")
    print(f"Predictions saved to predictions/indian/ directory")
    
    # Get information about the fruit
    fruit_info = north_predictor.get_fruit_info(fruit_name)
    if fruit_info:
        print(f"\nInformation about {fruit_name.capitalize()} ({fruit_info['hindi_name']}):")
        print(f"Varieties: {', '.join(fruit_info['varieties'])}")
        print(f"Growing Season: {fruit_info['growing_season'][0]} to {fruit_info['growing_season'][1]} (month)")
        print(f"Harvest Months: {', '.join(map(str, fruit_info['harvest_months']))}")
        print(f"Base Price: ₹{fruit_info['base_price_inr']} per kg/unit")
        print(f"Shelf Life: {fruit_info['shelf_life']} days")
        print(f"Primary Regions: {', '.join(r.capitalize() for r in fruit_info['primary_regions'])}")

if __name__ == "__main__":
    main()
