"""
Comprehensive example script demonstrating the Indian Market Price Predictor
with various agricultural products
"""

from indian_price_predictor import IndianPricePredictor
import matplotlib.pyplot as plt
import pandas as pd
import os

def main():
    # Create output directories if they don't exist
    os.makedirs('predictions/indian', exist_ok=True)
    
    # Initialize predictors for different regions
    north_predictor = IndianPricePredictor(region="north")
    south_predictor = IndianPricePredictor(region="south")
    
    # Get region coordinates
    north_region = north_predictor.get_region_info("north")
    south_region = south_predictor.get_region_info("south")
    
    north_lat = north_region['center_lat']
    north_lon = north_region['center_lon']
    south_lat = south_region['center_lat']
    south_lon = south_region['center_lon']
    
    # Example products from different categories
    products = {
        'fruits': {
            'name': 'mango',
            'price': 100  # ₹100 per kg
        },
        'vegetables': {
            'name': 'potato',
            'price': 25  # ₹25 per kg
        },
        'cereals': {
            'name': 'rice',
            'price': 50  # ₹50 per kg
        },
        'rice': {
            'name': 'basmati',
            'price': 90  # ₹90 per kg
        },
        'wheat': {
            'name': 'hd_2967',
            'price': 32  # ₹32 per kg
        }
    }
    
    # Predict yearly trends for all products in North India
    print("Predicting yearly trends for various agricultural products in North India...")
    
    yearly_predictions = {}
    for category, product in products.items():
        print(f"\nPredicting yearly trend for {product['name']} ({category})...")
        prediction = north_predictor.predict_yearly_trend(
            north_lat, north_lon, product['name'], product['price']
        )
        yearly_predictions[product['name']] = prediction
        
        # Save predictions
        filename = f"{product['name']}_north_yearly"
        north_predictor.save_predictions(prediction, filename)
        print(f"Predictions saved to predictions/indian/{filename}.json")
    
    # Plot yearly trends comparison
    plt.figure(figsize=(15, 10))
    plt.title('Yearly Price Trends for Different Agricultural Products in North India')
    
    for product_name, prediction in yearly_predictions.items():
        # Get product info
        product_info = north_predictor.get_product_info(product_name)
        category = product_info.get('category', 'unknown')
        
        # Plot with different line styles based on category
        if category == 'fruits':
            plt.plot(prediction['date'], prediction['predicted_price'], 
                     marker='o', linestyle='-', label=f"{product_name.capitalize()} (Fruit)")
        elif category == 'vegetables':
            plt.plot(prediction['date'], prediction['predicted_price'], 
                     marker='s', linestyle='--', label=f"{product_name.capitalize()} (Vegetable)")
        elif category == 'cereals':
            plt.plot(prediction['date'], prediction['predicted_price'], 
                     marker='^', linestyle='-.', label=f"{product_name.capitalize()} (Cereal)")
        elif category == 'rice':
            plt.plot(prediction['date'], prediction['predicted_price'], 
                     marker='d', linestyle=':', label=f"{product_name.capitalize()} (Rice)")
        elif category == 'wheat':
            plt.plot(prediction['date'], prediction['predicted_price'], 
                     marker='*', linestyle='-', label=f"{product_name.capitalize()} (Wheat)")
    
    plt.xlabel('Month')
    plt.ylabel('Price (₹)')
    plt.grid(True)
    plt.legend()
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig('predictions/indian/yearly_comparison_all_categories.png')
    print("\nYearly comparison plot saved to predictions/indian/yearly_comparison_all_categories.png")
    
    # Compare regional differences for a vegetable (potato)
    print("\nComparing potato prices between North and South India...")
    
    # Predict potato prices for 14 days in North and South India
    north_potato = north_predictor.predict_prices(
        north_lat, north_lon, 'potato', 25, days=14
    )
    
    south_potato = south_predictor.predict_prices(
        south_lat, south_lon, 'potato', 25, days=14
    )
    
    # Plot regional comparison
    plt.figure(figsize=(12, 6))
    plt.title('Potato Price Comparison: North vs South India (14 Days)')
    plt.plot(north_potato['date'], north_potato['predicted_price'], 
             marker='o', linestyle='-', label='North India')
    plt.plot(south_potato['date'], south_potato['predicted_price'], 
             marker='s', linestyle='--', label='South India')
    plt.xlabel('Date')
    plt.ylabel('Price (₹)')
    plt.grid(True)
    plt.legend()
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig('predictions/indian/potato_regional_comparison.png')
    print("Regional comparison plot saved to predictions/indian/potato_regional_comparison.png")
    
    # Compare seasonal patterns for different categories
    print("\nAnalyzing seasonal patterns across product categories...")
    
    # Create a dataframe to analyze seasonal patterns
    seasonal_data = []
    
    for product_name, prediction_df in yearly_predictions.items():
        product_info = north_predictor.get_product_info(product_name)
        category = product_info.get('category', 'unknown')
        
        # Extract month and normalize prices (as percentage of yearly average)
        avg_price = prediction_df['predicted_price'].mean()
        for _, row in prediction_df.iterrows():
            month = row['date'].month
            price = row['predicted_price']
            price_ratio = (price / avg_price) * 100  # as percentage
            
            seasonal_data.append({
                'product': product_name,
                'category': category,
                'month': month,
                'price_ratio': price_ratio
            })
    
    seasonal_df = pd.DataFrame(seasonal_data)
    
    # Calculate average seasonal patterns by category
    category_patterns = seasonal_df.groupby(['category', 'month'])['price_ratio'].mean().reset_index()
    
    # Plot seasonal patterns by category
    plt.figure(figsize=(12, 6))
    plt.title('Seasonal Price Patterns by Product Category')
    
    for category in category_patterns['category'].unique():
        category_data = category_patterns[category_patterns['category'] == category]
        plt.plot(category_data['month'], category_data['price_ratio'], 
                 marker='o', linestyle='-', label=category.capitalize())
    
    plt.xlabel('Month')
    plt.ylabel('Price (% of yearly average)')
    plt.grid(True)
    plt.legend()
    plt.xticks(range(1, 13), ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])
    plt.tight_layout()
    plt.savefig('predictions/indian/seasonal_patterns_by_category.png')
    print("Seasonal patterns plot saved to predictions/indian/seasonal_patterns_by_category.png")
    
    # Print summary of findings
    print("\nSummary of Agricultural Product Price Predictions:")
    print("=" * 60)
    
    for category, product in products.items():
        product_name = product['name']
        prediction = yearly_predictions[product_name]
        
        min_price = prediction['predicted_price'].min()
        max_price = prediction['predicted_price'].max()
        avg_price = prediction['predicted_price'].mean()
        volatility = (max_price - min_price) / avg_price * 100
        
        min_month = prediction.loc[prediction['predicted_price'].idxmin(), 'date'].month
        max_month = prediction.loc[prediction['predicted_price'].idxmax(), 'date'].month
        
        print(f"{product_name.capitalize()} ({category}):")
        print(f"  Price Range: ₹{min_price:.2f} - ₹{max_price:.2f}")
        print(f"  Average Price: ₹{avg_price:.2f}")
        print(f"  Price Volatility: {volatility:.1f}%")
        print(f"  Lowest Price Month: {min_month} ({['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][min_month-1]})")
        print(f"  Highest Price Month: {max_month} ({['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][max_month-1]})")
        print("-" * 60)

if __name__ == "__main__":
    main()
