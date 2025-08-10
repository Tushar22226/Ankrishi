from price_predictor import PricePredictor
import argparse
import sys

def main():
    """
    Main function to run the price prediction from command line
    """
    parser = argparse.ArgumentParser(description='Predict fruit prices based on weather data')
    
    # Required arguments
    parser.add_argument('--latitude', type=float, required=True, help='Location latitude')
    parser.add_argument('--longitude', type=float, required=True, help='Location longitude')
    parser.add_argument('--fruit', type=str, required=True, help='Name of the fruit')
    parser.add_argument('--price', type=float, required=True, help='Current price of the fruit')
    
    # Optional arguments
    parser.add_argument('--days', type=int, default=14, help='Number of days to predict (max 16)')
    parser.add_argument('--yearly', action='store_true', help='Predict yearly trend')
    parser.add_argument('--model', type=str, default='random_forest', 
                        choices=['random_forest', 'lstm'], help='Model type to use')
    parser.add_argument('--save', action='store_true', help='Save predictions to file')
    parser.add_argument('--plot', action='store_true', help='Plot predictions')
    
    args = parser.parse_args()
    
    try:
        # Initialize price predictor
        predictor = PricePredictor(model_type=args.model)
        
        # Predict prices
        if args.yearly:
            print(f"Predicting yearly price trend for {args.fruit}...")
            predictions = predictor.predict_yearly_trend(
                args.latitude, args.longitude, args.fruit, args.price
            )
            prediction_type = "yearly"
        else:
            print(f"Predicting prices for {args.fruit} for the next {args.days} days...")
            predictions = predictor.predict_prices(
                args.latitude, args.longitude, args.fruit, args.price, args.days
            )
            prediction_type = f"{args.days}days"
        
        # Display predictions
        print("\nPredicted Prices:")
        for _, row in predictions.iterrows():
            print(f"{row['date'].strftime('%Y-%m-%d')}: {row['predicted_price']:.2f}")
        
        # Save predictions if requested
        if args.save:
            filename = f"{args.fruit}_{prediction_type}"
            predictor.save_predictions(predictions, filename)
            print(f"\nPredictions saved to predictions/{filename}.json")
        
        # Plot predictions if requested
        if args.plot:
            title = f"Predicted Prices for {args.fruit.capitalize()}"
            filename = f"{args.fruit}_{prediction_type}" if args.save else None
            predictor.plot_predictions(predictions, title, filename)
            if args.save:
                print(f"Plot saved to predictions/{filename}.png")
        
    except Exception as e:
        print(f"Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
