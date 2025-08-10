"""
Command-line interface for Indian market price predictions
"""

from indian_price_predictor import IndianPricePredictor
from indian_market_config import INDIAN_REGIONS, INDIAN_FRUITS
import argparse
import sys

def main():
    """
    Main function to run the Indian market price prediction from command line
    """
    parser = argparse.ArgumentParser(description='Predict fruit prices for Indian markets based on weather data')
    
    # Required arguments
    parser.add_argument('--fruit', type=str, required=True, help='Name of the fruit')
    parser.add_argument('--price', type=float, required=True, help='Current price of the fruit')
    
    # Optional arguments
    parser.add_argument('--region', type=str, default='north', 
                        choices=list(INDIAN_REGIONS.keys()), 
                        help='Region in India')
    parser.add_argument('--latitude', type=float, help='Custom location latitude (overrides region center)')
    parser.add_argument('--longitude', type=float, help='Custom location longitude (overrides region center)')
    parser.add_argument('--days', type=int, default=14, help='Number of days to predict (max 16)')
    parser.add_argument('--yearly', action='store_true', help='Predict yearly trend')
    parser.add_argument('--currency', type=str, default='INR', choices=['INR', 'USD'], 
                        help='Currency for price (INR or USD)')
    parser.add_argument('--save', action='store_true', help='Save predictions to file')
    parser.add_argument('--plot', action='store_true', help='Plot predictions')
    parser.add_argument('--list-fruits', action='store_true', help='List available fruits')
    parser.add_argument('--list-regions', action='store_true', help='List available regions')
    parser.add_argument('--fruit-info', type=str, help='Get information about a specific fruit')
    parser.add_argument('--region-info', type=str, help='Get information about a specific region')
    
    args = parser.parse_args()
    
    # Handle information requests first
    if args.list_fruits:
        fruits = IndianPricePredictor.get_available_fruits()
        print("Available Indian Fruits:")
        for fruit in fruits:
            fruit_info = IndianPricePredictor.get_fruit_info(fruit)
            print(f"- {fruit.capitalize()} ({fruit_info['hindi_name']})")
        return 0
    
    if args.list_regions:
        regions = IndianPricePredictor.get_available_regions()
        print("Available Indian Regions:")
        for region in regions:
            region_info = IndianPricePredictor.get_region_info(region)
            print(f"- {region_info['name']} ({region})")
        return 0
    
    if args.fruit_info:
        fruit_info = IndianPricePredictor.get_fruit_info(args.fruit_info)
        if fruit_info:
            print(f"Information about {args.fruit_info.capitalize()} ({fruit_info['hindi_name']}):")
            print(f"Varieties: {', '.join(fruit_info['varieties'])}")
            print(f"Growing Season: {fruit_info['growing_season'][0]} to {fruit_info['growing_season'][1]} (month)")
            print(f"Harvest Months: {', '.join(map(str, fruit_info['harvest_months']))}")
            print(f"Base Price: ₹{fruit_info['base_price_inr']} per kg/unit")
            print(f"Shelf Life: {fruit_info['shelf_life']} days")
            print(f"Primary Regions: {', '.join(r.capitalize() for r in fruit_info['primary_regions'])}")
        else:
            print(f"Fruit {args.fruit_info} not found in database.")
        return 0
    
    if args.region_info:
        region_info = IndianPricePredictor.get_region_info(args.region_info)
        if region_info:
            print(f"Information about {region_info['name']}:")
            print(f"Center Coordinates: {region_info['center_lat']}, {region_info['center_lon']}")
            print(f"States: {', '.join(region_info['states'])}")
        else:
            print(f"Region {args.region_info} not found in database.")
        return 0
    
    try:
        # Initialize price predictor
        predictor = IndianPricePredictor(region=args.region)
        
        # Get coordinates
        if args.latitude is not None and args.longitude is not None:
            latitude = args.latitude
            longitude = args.longitude
        else:
            # Use region center coordinates
            region_info = INDIAN_REGIONS[args.region]
            latitude = region_info['center_lat']
            longitude = region_info['center_lon']
            print(f"Using {region_info['name']} center coordinates: {latitude}, {longitude}")
        
        # Predict prices
        if args.yearly:
            print(f"Predicting yearly price trend for {args.fruit} in {args.region} region...")
            predictions = predictor.predict_yearly_trend(
                latitude, longitude, args.fruit, args.price, args.currency
            )
            prediction_type = "yearly"
        else:
            print(f"Predicting prices for {args.fruit} in {args.region} region for the next {args.days} days...")
            predictions = predictor.predict_prices(
                latitude, longitude, args.fruit, args.price, args.days, args.currency
            )
            prediction_type = f"{args.days}days"
        
        # Display predictions
        currency_symbol = "₹" if args.currency.upper() == "INR" else "$"
        print("\nPredicted Prices:")
        for _, row in predictions.iterrows():
            print(f"{row['date'].strftime('%Y-%m-%d')}: {currency_symbol}{row['predicted_price']:.2f}")
        
        # Save predictions if requested
        if args.save:
            filename = f"{args.fruit}_{args.region}_{prediction_type}_{args.currency}"
            predictor.save_predictions(predictions, filename)
            print(f"\nPredictions saved to predictions/indian/{filename}.json")
        
        # Plot predictions if requested
        if args.plot:
            title = f"Predicted Prices for {args.fruit.capitalize()} in {args.region.capitalize()} Region"
            filename = f"{args.fruit}_{args.region}_{prediction_type}_{args.currency}" if args.save else None
            predictor.plot_predictions(predictions, title, filename, args.currency)
            if args.save:
                print(f"Plot saved to predictions/indian/{filename}.png")
        
    except Exception as e:
        print(f"Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
