"""
Script to run a price prediction and display the results
"""

from price_predictor import PricePredictor
import sys

def run_prediction():
    """Run a price prediction with user input"""
    print("Fruit Price Predictor AI")
    print("========================")
    
    try:
        # Get user input
        latitude = float(input("Enter latitude (e.g., 37.7749 for San Francisco): "))
        longitude = float(input("Enter longitude (e.g., -122.4194 for San Francisco): "))
        fruit_name = input("Enter fruit name (e.g., apple, banana, orange): ").lower()
        current_price = float(input("Enter current price: "))
        
        # Create predictor
        predictor = PricePredictor()
        
        # Ask for prediction type
        print("\nPrediction Type:")
        print("1. Short-term (14 days)")
        print("2. Yearly trend")
        choice = input("Enter your choice (1 or 2): ")
        
        if choice == "1":
            # Short-term prediction
            print("\nFetching weather data and predicting prices...")
            predictions = predictor.predict_prices(
                latitude, longitude, fruit_name, current_price
            )
            
            # Display predictions
            print(f"\nPredicted prices for {fruit_name} for the next 14 days:")
            print("=" * 50)
            print(f"{'Date':<12} | {'Price':<10}")
            print("-" * 50)
            for _, row in predictions.iterrows():
                print(f"{row['date'].strftime('%Y-%m-%d'):<12} | ${row['predicted_price']:.2f}")
            
            # Ask to save predictions
            save = input("\nSave predictions to file? (y/n): ").lower()
            if save == "y":
                predictor.save_predictions(predictions, f"{fruit_name}_14days")
                print(f"Predictions saved to predictions/{fruit_name}_14days.json")
            
            # Ask to plot predictions
            plot = input("Plot predictions? (y/n): ").lower()
            if plot == "y":
                predictor.plot_predictions(
                    predictions, 
                    f"Predicted Prices for {fruit_name.capitalize()} (14 Days)",
                    f"{fruit_name}_14days"
                )
                print(f"Plot saved to predictions/{fruit_name}_14days.png")
        
        elif choice == "2":
            # Yearly trend
            print("\nPredicting yearly trend...")
            predictions = predictor.predict_yearly_trend(
                latitude, longitude, fruit_name, current_price
            )
            
            # Display predictions
            print(f"\nPredicted yearly trend for {fruit_name}:")
            print("=" * 50)
            print(f"{'Month':<12} | {'Price':<10}")
            print("-" * 50)
            for _, row in predictions.iterrows():
                print(f"{row['date'].strftime('%Y-%m'):<12} | ${row['predicted_price']:.2f}")
            
            # Ask to save predictions
            save = input("\nSave predictions to file? (y/n): ").lower()
            if save == "y":
                predictor.save_predictions(predictions, f"{fruit_name}_yearly")
                print(f"Predictions saved to predictions/{fruit_name}_yearly.json")
            
            # Ask to plot predictions
            plot = input("Plot predictions? (y/n): ").lower()
            if plot == "y":
                predictor.plot_predictions(
                    predictions, 
                    f"Predicted Yearly Trend for {fruit_name.capitalize()}",
                    f"{fruit_name}_yearly"
                )
                print(f"Plot saved to predictions/{fruit_name}_yearly.png")
        
        else:
            print("Invalid choice. Please enter 1 or 2.")
            return 1
        
    except ValueError as e:
        print(f"Error: Invalid input - {e}")
        return 1
    except Exception as e:
        print(f"Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(run_prediction())
