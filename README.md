# FarmConnect

FarmConnect is a comprehensive agricultural platform developed for the Pune Agri Hackathon. It connects farmers directly with vendors, provides e-learning resources, facilitates equipment rental, and offers AI-powered forecasts and recommendations.

## Features

- **Authentication System**: Secure login/signup with phone/email for Farmers, Vendors, and Buyers
- **Marketplace**: Buy/sell fertilizers, rent equipment, and trade fresh produce
- **AI Forecasts**: Weather forecasts, market price predictions, and crop recommendations
- **Financial Management**: Track expenses, income, and generate reports
- **AI Chatbot**: Get farming advice and support
- **E-Learning**: Access educational content for farmers
- **Document Management**: Manage leases, contracts, and important documents
- **Government Schemes**: View and apply for government agricultural schemes

## Tech Stack

- React Native (Expo)
- Firebase (Authentication, Realtime Database, Storage)
- TypeScript
- Open-Meteo API for real-time weather data
- Custom AI models for price prediction and crop recommendations

## Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/FarmConnect.git
cd FarmConnect
```

2. Install dependencies:
```
npm install
```

3. Create a `.env` file with your Firebase configuration:
```
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_DATABASE_URL=your_firebase_database_url
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id
```

4. Start the development server:
```
npm start
```

## Project Structure

- `/components`: Reusable UI components
- `/context`: React Context providers (Auth, etc.)
- `/models`: TypeScript interfaces and types
- `/navigation`: Navigation configuration
- `/screens`: App screens organized by feature
- `/services`: API and business logic services
- `/theme`: App-wide styling and theming
- `/utils`: Utility functions

## AI Features

- **Weather Forecasting**: Real-time weather data with 7-day forecasts
- **Market Price Prediction**: AI-powered price forecasts for agricultural products
- **Crop Recommendations**: Intelligent crop suggestions based on location and climate
- **AI Chatbot**: Farming advice and support through natural language processing

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Pune Agri Hackathon for the opportunity
- All the farmers who provided valuable feedback during development
