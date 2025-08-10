"""
Configuration file for Indian market specifics
"""

# Exchange rate (approximate)
INR_TO_USD = 83.0
USD_TO_INR = 1 / INR_TO_USD

# Indian regions with coordinates (approximate centers)
INDIAN_REGIONS = {
    'north': {
        'name': 'North India',
        'center_lat': 28.6139,  # Delhi
        'center_lon': 77.2090,
        'states': ['Delhi', 'Haryana', 'Punjab', 'Uttar Pradesh', 'Uttarakhand', 'Himachal Pradesh', 'Jammu & Kashmir']
    },
    'south': {
        'name': 'South India',
        'center_lat': 13.0827,  # Bangalore
        'center_lon': 77.5877,
        'states': ['Karnataka', 'Tamil Nadu', 'Kerala', 'Andhra Pradesh', 'Telangana']
    },
    'east': {
        'name': 'East India',
        'center_lat': 22.5726,  # Kolkata
        'center_lon': 88.3639,
        'states': ['West Bengal', 'Bihar', 'Jharkhand', 'Odisha', 'Assam']
    },
    'west': {
        'name': 'West India',
        'center_lat': 19.0760,  # Mumbai
        'center_lon': 72.8777,
        'states': ['Maharashtra', 'Gujarat', 'Rajasthan', 'Goa']
    },
    'central': {
        'name': 'Central India',
        'center_lat': 23.2599,  # Bhopal
        'center_lon': 77.4126,
        'states': ['Madhya Pradesh', 'Chhattisgarh']
    },
    'northeast': {
        'name': 'Northeast India',
        'center_lat': 25.5788,  # Guwahati
        'center_lon': 91.8933,
        'states': ['Assam', 'Meghalaya', 'Tripura', 'Manipur', 'Mizoram', 'Nagaland', 'Arunachal Pradesh', 'Sikkim']
    }
}

# Indian fruits with region-specific data
INDIAN_FRUITS = {
    'mango': {
        'hindi_name': 'आम (Aam)',
        'varieties': ['Alphonso', 'Dasheri', 'Langra', 'Chausa', 'Kesar', 'Banganapalli'],
        'temp_sensitivity': 0.8,
        'rain_sensitivity': 0.7,
        'growing_season': [2, 5],  # Feb to May
        'harvest_months': [4, 5, 6, 7],  # April to July
        'shelf_life': 10,  # Days
        'price_volatility': 0.6,
        'primary_regions': ['north', 'south', 'west'],
        'base_price_inr': 100,  # per kg
        'seasonal_price_factor': {
            1: 2.0,  # Off-season
            2: 1.8,
            3: 1.5,
            4: 1.0,  # Start of season
            5: 0.7,  # Peak season
            6: 0.8,
            7: 1.0,
            8: 1.5,
            9: 1.8,
            10: 2.0,
            11: 2.0,
            12: 2.0,
        }
    },
    'banana': {
        'hindi_name': 'केला (Kela)',
        'varieties': ['Robusta', 'Poovan', 'Nendran', 'Red Banana', 'Monthan'],
        'temp_sensitivity': 0.7,
        'rain_sensitivity': 0.8,
        'growing_season': [1, 12],  # Year-round
        'harvest_months': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],  # Year-round
        'shelf_life': 7,
        'price_volatility': 0.3,
        'primary_regions': ['south', 'west', 'east'],
        'base_price_inr': 40,  # per dozen
        'seasonal_price_factor': {
            1: 1.0,
            2: 1.0,
            3: 1.0,
            4: 1.0,
            5: 1.0,
            6: 1.1,  # Slight increase during monsoon
            7: 1.2,
            8: 1.2,
            9: 1.1,
            10: 1.0,
            11: 1.0,
            12: 1.0,
        }
    },
    'apple': {
        'hindi_name': 'सेब (Seb)',
        'varieties': ['Shimla', 'Kinnaur', 'Kashmir', 'Royal Delicious', 'Golden Delicious'],
        'temp_sensitivity': 0.6,
        'rain_sensitivity': 0.5,
        'growing_season': [3, 8],  # March to August
        'harvest_months': [8, 9, 10, 11],  # August to November
        'shelf_life': 30,
        'price_volatility': 0.4,
        'primary_regions': ['north', 'northeast'],
        'base_price_inr': 150,  # per kg
        'seasonal_price_factor': {
            1: 1.3,
            2: 1.4,
            3: 1.5,
            4: 1.6,
            5: 1.7,
            6: 1.8,
            7: 1.5,
            8: 1.0,  # Start of harvest
            9: 0.8,  # Peak harvest
            10: 0.9,
            11: 1.0,
            12: 1.2,
        }
    },
    'orange': {
        'hindi_name': 'संतरा (Santra)',
        'varieties': ['Nagpur', 'Darjeeling', 'Khasi', 'Coorg'],
        'temp_sensitivity': 0.5,
        'rain_sensitivity': 0.6,
        'growing_season': [6, 11],  # June to November
        'harvest_months': [11, 12, 1, 2],  # November to February
        'shelf_life': 14,
        'price_volatility': 0.5,
        'primary_regions': ['central', 'south', 'northeast'],
        'base_price_inr': 80,  # per kg
        'seasonal_price_factor': {
            1: 0.9,  # Still in season
            2: 1.0,  # End of season
            3: 1.3,
            4: 1.5,
            5: 1.7,
            6: 1.8,
            7: 1.9,
            8: 2.0,
            9: 1.8,
            10: 1.5,
            11: 0.8,  # Start of season
            12: 0.8,  # Peak season
        }
    },
    'guava': {
        'hindi_name': 'अमरूद (Amrood)',
        'varieties': ['Allahabad Safeda', 'Lucknow 49', 'Lalit', 'Shweta'],
        'temp_sensitivity': 0.4,
        'rain_sensitivity': 0.5,
        'growing_season': [6, 2],  # June to February
        'harvest_months': [8, 9, 10, 11, 12, 1],  # August to January
        'shelf_life': 5,
        'price_volatility': 0.4,
        'primary_regions': ['north', 'central', 'east'],
        'base_price_inr': 60,  # per kg
        'seasonal_price_factor': {
            1: 1.0,  # End of season
            2: 1.2,
            3: 1.5,
            4: 1.7,
            5: 1.8,
            6: 1.7,
            7: 1.5,
            8: 1.0,  # Start of season
            9: 0.8,
            10: 0.7,  # Peak season
            11: 0.8,
            12: 0.9,
        }
    },
    'pomegranate': {
        'hindi_name': 'अनार (Anar)',
        'varieties': ['Bhagwa', 'Ganesh', 'Ruby', 'Mridula'],
        'temp_sensitivity': 0.5,
        'rain_sensitivity': 0.4,
        'growing_season': [6, 9],  # June to September
        'harvest_months': [9, 10, 11, 12, 1, 2],  # September to February
        'shelf_life': 20,
        'price_volatility': 0.5,
        'primary_regions': ['west', 'south', 'central'],
        'base_price_inr': 120,  # per kg
        'seasonal_price_factor': {
            1: 0.9,  # Still in season
            2: 1.0,  # End of season
            3: 1.3,
            4: 1.5,
            5: 1.7,
            6: 1.8,
            7: 1.6,
            8: 1.4,
            9: 0.8,  # Start of season
            10: 0.7,  # Peak season
            11: 0.8,
            12: 0.8,
        }
    },
    'papaya': {
        'hindi_name': 'पपीता (Papita)',
        'varieties': ['Red Lady', 'Taiwan', 'Pusa Delicious', 'Pusa Dwarf'],
        'temp_sensitivity': 0.7,
        'rain_sensitivity': 0.6,
        'growing_season': [1, 12],  # Year-round
        'harvest_months': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],  # Year-round
        'shelf_life': 7,
        'price_volatility': 0.3,
        'primary_regions': ['south', 'west', 'east'],
        'base_price_inr': 50,  # per kg
        'seasonal_price_factor': {
            1: 1.0,
            2: 1.0,
            3: 1.0,
            4: 1.0,
            5: 1.0,
            6: 1.1,
            7: 1.2,  # Slight increase during monsoon
            8: 1.2,
            9: 1.1,
            10: 1.0,
            11: 1.0,
            12: 1.0,
        }
    },
}

# Market factors that affect prices in India
MARKET_FACTORS = {
    'transportation_cost': {
        'north': 1.0,
        'south': 1.1,
        'east': 1.05,
        'west': 1.0,
        'central': 1.15,
        'northeast': 1.2
    },
    'storage_cost': {
        'north': 1.0,
        'south': 0.95,
        'east': 1.05,
        'west': 0.9,
        'central': 1.0,
        'northeast': 1.1
    },
    'demand_factor': {
        'north': 1.1,
        'south': 1.0,
        'east': 0.95,
        'west': 1.05,
        'central': 0.9,
        'northeast': 0.85
    },
    'festival_seasons': {
        # Month: festival factor
        1: 1.1,  # Lohri, Makar Sankranti
        2: 1.0,
        3: 1.05,  # Holi
        4: 1.0,
        5: 1.0,
        6: 1.0,
        7: 1.0,
        8: 1.15,  # Raksha Bandhan, Independence Day
        9: 1.1,  # Ganesh Chaturthi
        10: 1.3,  # Dussehra, Durga Puja
        11: 1.4,  # Diwali
        12: 1.1,  # Christmas
    }
}
