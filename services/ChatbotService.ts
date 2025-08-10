// Types for chatbot messages
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
  attachments?: {
    type: 'image' | 'document' | 'audio' | 'video';
    url: string;
    name: string;
    metadata?: any; // For storing additional information like disease detection results
  }[];
  isLoading?: boolean;
  isError?: boolean;
  isWebSearch?: boolean;
  isDiseaseDetection?: boolean;
}

// Types for chatbot suggestions
export interface ChatSuggestion {
  id: string;
  text: string;
  category: 'general' | 'crop' | 'weather' | 'market' | 'finance' | 'equipment' | 'app';
}

// Mock suggestions for common farmer questions
const mockSuggestions: ChatSuggestion[] = [
  // App-related suggestions
  {
    id: 'app1',
    text: 'How do I use the marketplace?',
    category: 'app',
  },
  {
    id: 'app2',
    text: 'What does the verification badge mean?',
    category: 'app',
  },
  {
    id: 'app3',
    text: 'How can I upload a plant image for disease detection?',
    category: 'app',
  },
  // Farming-related suggestions
  {
    id: '1',
    text: 'What fertilizer is best for tomatoes?',
    category: 'crop',
  },
  {
    id: '2',
    text: 'How to prevent pest attack on wheat?',
    category: 'crop',
  },
  {
    id: '3',
    text: 'When should I harvest my rice crop?',
    category: 'crop',
  },
  {
    id: '4',
    text: 'What is the current market price for potatoes?',
    category: 'market',
  },
  {
    id: '5',
    text: 'How to apply for PM Kisan Yojana?',
    category: 'finance',
  },
  {
    id: '6',
    text: 'Will it rain in the next 3 days?',
    category: 'weather',
  },
  {
    id: '7',
    text: 'How to maintain a tractor?',
    category: 'equipment',
  },
  {
    id: '8',
    text: 'What crops are suitable for my region?',
    category: 'crop',
  },
];

// Mock responses for common questions
const mockResponses: Record<string, string> = {
  'fertilizer': 'For tomatoes, a balanced NPK fertilizer with a ratio of 5-10-10 is recommended. Apply it every 4-6 weeks during the growing season. Organic options include compost, well-rotted manure, or fish emulsion.',

  'pest': 'To prevent pest attacks on wheat, implement crop rotation, use resistant varieties, maintain field hygiene, and monitor regularly. For chemical control, consult with local agricultural extension services for recommended pesticides suitable for your region.',

  'harvest': 'The best time to harvest rice is when 80-85% of the grains have turned golden yellow and moisture content is around 20-25%. This typically occurs 30-45 days after flowering, depending on the variety and weather conditions.',

  'price': 'Current market prices for potatoes vary by region. In major markets, they range from ₹15-25 per kg depending on quality and variety. For real-time prices, check the government\'s e-NAM portal or local mandi rates.',

  'scheme': 'To apply for PM Kisan Yojana, visit the official website (pmkisan.gov.in), register with your Aadhaar number, land records, and bank account details. You can also visit your local Common Service Center (CSC) or agriculture office for assistance with the application.',

  'rain': 'Based on current weather data, there is a 60% chance of light to moderate rainfall in the next 3 days. Total precipitation is expected to be around 15-20mm. Keep monitoring the weather updates for any changes.',

  'tractor': 'For tractor maintenance: 1) Check engine oil, transmission fluid, and coolant levels regularly. 2) Clean air filters monthly. 3) Grease all fittings every 50 hours of operation. 4) Check tire pressure weekly. 5) Service the engine every 300 hours or annually.',

  'crop': 'To determine suitable crops for your region, consider local climate, soil type, water availability, and market demand. For specific recommendations, please share your location and soil details. You can also consult your district agriculture office for region-specific crop advisories.',
};

// Import required services
import WebSearchService from './WebSearchService';
import CropDiseaseService, { PredictionResult } from './CropDiseaseService';
import AppInfoService from './AppInfoService';

class ChatbotService {
  // Get chat suggestions based on user history and context
  getSuggestions(userHistory?: ChatMessage[], category?: string): ChatSuggestion[] {
    // In a real app, this would analyze user history and provide relevant suggestions
    // For now, return mock suggestions, optionally filtered by category
    if (category) {
      return mockSuggestions.filter(suggestion => suggestion.category === category);
    }

    // If we have user history, we could analyze it to provide more relevant suggestions
    if (userHistory && userHistory.length > 0) {
      // Get the last few messages to determine context
      const recentMessages = userHistory.slice(-3);

      // Check if there's a disease detection result
      const hasDiseaseDetection = recentMessages.some(msg => msg.isDiseaseDetection);
      if (hasDiseaseDetection) {
        // Return disease-related suggestions
        return mockSuggestions.filter(suggestion =>
          suggestion.category === 'crop' ||
          suggestion.text.toLowerCase().includes('disease') ||
          suggestion.text.toLowerCase().includes('pest')
        );
      }

      // Check if there's a weather-related query
      const hasWeatherQuery = recentMessages.some(msg =>
        msg.text.toLowerCase().includes('weather') ||
        msg.text.toLowerCase().includes('rain') ||
        msg.text.toLowerCase().includes('forecast')
      );
      if (hasWeatherQuery) {
        return mockSuggestions.filter(suggestion => suggestion.category === 'weather');
      }

      // Check if there's a market-related query
      const hasMarketQuery = recentMessages.some(msg =>
        msg.text.toLowerCase().includes('price') ||
        msg.text.toLowerCase().includes('market') ||
        msg.text.toLowerCase().includes('sell')
      );
      if (hasMarketQuery) {
        return mockSuggestions.filter(suggestion => suggestion.category === 'market');
      }

      // Check if there's an app-related query
      const hasAppQuery = recentMessages.some(msg =>
        msg.text.toLowerCase().includes('app') ||
        msg.text.toLowerCase().includes('screen') ||
        msg.text.toLowerCase().includes('button') ||
        msg.text.toLowerCase().includes('feature') ||
        msg.text.toLowerCase().includes('marketplace') ||
        msg.text.toLowerCase().includes('verification') ||
        msg.text.toLowerCase().includes('badge')
      );
      if (hasAppQuery) {
        return mockSuggestions.filter(suggestion => suggestion.category === 'app');
      }
    }

    // Mix app suggestions with other suggestions
    const appSuggestions = mockSuggestions.filter(suggestion => suggestion.category === 'app');
    const otherSuggestions = mockSuggestions.filter(suggestion => suggestion.category !== 'app');

    // Return 2 app suggestions and 6 other suggestions
    return [...appSuggestions.slice(0, 2), ...otherSuggestions.slice(0, 6)];
  }

  // Get response for a user message
  async getResponse(message: string): Promise<ChatMessage> {
    // In a real app, this would call an AI API to generate a response
    const messageLower = message.toLowerCase();

    // Create a response message
    const responseMessage = this.createBotMessage('', false);

    // First, check if the message is about the app itself
    if (
      messageLower.includes('app') ||
      messageLower.includes('screen') ||
      messageLower.includes('button') ||
      messageLower.includes('feature') ||
      messageLower.includes('marketplace') ||
      messageLower.includes('chat') ||
      messageLower.includes('farm') ||
      messageLower.includes('product') ||
      messageLower.includes('verification') ||
      messageLower.includes('badge') ||
      messageLower.includes('how to') ||
      messageLower.includes('where is') ||
      messageLower.includes('what is') ||
      messageLower.includes('how do i')
    ) {
      // Search the app information database
      const appResults = AppInfoService.search(message);

      // If we found relevant information about the app
      if (appResults.screens.length > 0 || appResults.uiElements.length > 0) {
        // If there's exactly one screen and no UI elements, return detailed screen info
        if (appResults.screens.length === 1 && appResults.uiElements.length === 0) {
          responseMessage.text = AppInfoService.formatScreenInfo(appResults.screens[0]);
          return responseMessage;
        }

        // If there's exactly one UI element and no screens, return detailed UI element info
        if (appResults.screens.length === 0 && appResults.uiElements.length === 1) {
          responseMessage.text = AppInfoService.formatUIElementInfo(
            appResults.uiElements[0].element,
            appResults.uiElements[0].screen
          );
          return responseMessage;
        }

        // Otherwise, return a summary of all matches
        responseMessage.text = AppInfoService.formatSearchResults(appResults);
        return responseMessage;
      }
    }

    // Check for disease-related keywords that might indicate the user wants to upload an image
    if (
      messageLower.includes('disease') ||
      messageLower.includes('pest') ||
      messageLower.includes('infection') ||
      messageLower.includes('spots') ||
      messageLower.includes('leaves') ||
      (messageLower.includes('check') && (messageLower.includes('plant') || messageLower.includes('crop')))
    ) {
      // If the message suggests the user wants to check for disease
      responseMessage.text = "It sounds like you're asking about a plant disease or pest. Would you like to upload a photo of your plant so I can analyze it? This can help me identify any potential issues.";
      return responseMessage;
    }

    // Check for keywords in the message
    for (const [keyword, response] of Object.entries(mockResponses)) {
      if (messageLower.includes(keyword.toLowerCase())) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        responseMessage.text = response;
        return responseMessage;
      }
    }

    // If no predefined response, generate a more dynamic response based on the query
    try {
      console.log('Generating dynamic response for:', message);

      // Extract key topics from the message
      const topics = this.extractTopics(message);

      if (topics.length > 0) {
        // Generate a response based on the extracted topics
        const dynamicResponse = this.generateDynamicResponse(topics, message);
        responseMessage.text = dynamicResponse;
        return responseMessage;
      }

      // If we couldn't generate a dynamic response, fall back to web search
      console.log('Falling back to web search for:', message);
      const searchResults = await WebSearchService.searchWeb(message);
      if (searchResults.length > 0) {
        responseMessage.text = WebSearchService.formatSearchResults(searchResults);
        responseMessage.isWebSearch = true;
        return responseMessage;
      }
    } catch (error) {
      console.error('Error generating response:', error);
    }

    // Default response if no keywords match and web search fails
    responseMessage.text = "I'm here to help with your farming questions and app usage. You can ask me about crops, weather, market prices, government schemes, equipment, or financial planning. You can also ask about how to use different features of the FarmConnects app, or upload photos of your plants if you're concerned about diseases or pests. How can I assist you today?";
    return responseMessage;
  }

  // Analyze image for plant diseases
  async analyzeImage(imageUri: string): Promise<ChatMessage> {
    try {
      // Create a loading message
      const responseMessage = this.createBotMessage('Analyzing your plant image...', false);
      responseMessage.isDiseaseDetection = true;

      // Add the image as an attachment
      responseMessage.attachments = [{
        type: 'image',
        url: imageUri,
        name: 'Plant Image'
      }];

      // Analyze the image using CropDiseaseService
      const result = await CropDiseaseService.analyzeImage(imageUri);

      if (!result) {
        responseMessage.text = "I couldn't analyze your image. Please make sure it's a clear photo of the plant and try again.";
        responseMessage.isError = true;
        return responseMessage;
      }

      // Store the result in the attachment metadata
      if (responseMessage.attachments && responseMessage.attachments.length > 0) {
        responseMessage.attachments[0].metadata = result;
      }

      // Format the response based on the analysis result
      if (result.disease.id === 'healthy') {
        responseMessage.text = `Good news! Your plant appears to be healthy (${Math.round(result.confidence * 100)}% confidence). \n\nKeep up with these good practices:\n• ${result.disease.preventionMeasures.join('\n• ')}`;
      } else {
        responseMessage.text = `I've detected ${result.disease.name} with ${Math.round(result.confidence * 100)}% confidence.\n\n` +
          `**Symptoms:**\n• ${result.disease.symptoms.join('\n• ')}\n\n` +
          `**Causes:**\n• ${result.disease.causes.join('\n• ')}\n\n` +
          `**Recommended Treatments:**\n• ${result.disease.treatments.join('\n• ')}\n\n` +
          `**Prevention:**\n• ${result.disease.preventionMeasures.join('\n• ')}`;
      }

      return responseMessage;
    } catch (error) {
      console.error('Error analyzing image:', error);
      const errorMessage = this.createBotMessage("I'm sorry, I encountered an error while analyzing your image. Please try again later.", false);
      errorMessage.isError = true;
      return errorMessage;
    }
  }

  // Generate a unique ID for messages
  generateMessageId(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2, 9);
  }

  // Create a user message object
  createUserMessage(text: string, attachments?: ChatMessage['attachments']): ChatMessage {
    return {
      id: this.generateMessageId(),
      text,
      sender: 'user',
      timestamp: Date.now(),
      attachments
    };
  }

  // Create a bot message object
  createBotMessage(text: string, isLoading: boolean = false): ChatMessage {
    return {
      id: this.generateMessageId(),
      text,
      sender: 'bot',
      timestamp: Date.now(),
      isLoading,
    };
  }

  // Extract key topics from a message
  private extractTopics(message: string): string[] {
    const messageLower = message.toLowerCase();
    const topics: string[] = [];

    // Define topic keywords to look for
    const topicKeywords = {
      crop: ['crop', 'plant', 'grow', 'seed', 'harvest', 'cultivation', 'farming'],
      soil: ['soil', 'fertilizer', 'nutrient', 'compost', 'manure', 'organic'],
      weather: ['weather', 'rain', 'climate', 'temperature', 'humidity', 'forecast', 'monsoon', 'drought'],
      pest: ['pest', 'insect', 'disease', 'fungus', 'bacteria', 'virus', 'infection', 'control'],
      market: ['market', 'price', 'sell', 'buy', 'trade', 'export', 'demand', 'supply', 'mandi'],
      finance: ['loan', 'credit', 'finance', 'insurance', 'subsidy', 'scheme', 'bank', 'money', 'investment'],
      technology: ['technology', 'digital', 'app', 'mobile', 'internet', 'sensor', 'drone', 'automation'],
      water: ['water', 'irrigation', 'rain', 'moisture', 'conservation', 'drought', 'well', 'pump'],
      livestock: ['animal', 'cattle', 'cow', 'buffalo', 'goat', 'sheep', 'poultry', 'feed', 'milk'],
      organic: ['organic', 'natural', 'chemical-free', 'pesticide-free', 'sustainable', 'eco-friendly'],
      equipment: ['equipment', 'machinery', 'tool', 'tractor', 'harvester', 'plow', 'sprayer']
    };

    // Check for each topic
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      for (const keyword of keywords) {
        if (messageLower.includes(keyword)) {
          topics.push(topic);
          break; // Once we find a match for this topic, move to the next topic
        }
      }
    }

    // Check for specific questions
    if (messageLower.includes('how') || messageLower.includes('what') || messageLower.includes('why') ||
        messageLower.includes('when') || messageLower.includes('where') || messageLower.includes('which')) {
      topics.push('question');
    }

    // Check for language indicators (Marathi or Hindi)
    if (/[\u0900-\u097F]/.test(message)) { // Unicode range for Devanagari script (Hindi)
      topics.push('hindi');
    }

    return [...new Set(topics)]; // Remove duplicates
  }

  // Generate a dynamic response based on extracted topics
  private generateDynamicResponse(topics: string[], originalMessage: string): string {
    console.log('Generating response for topics:', topics);

    // Check if the message is in Hindi/Marathi
    if (topics.includes('hindi')) {
      return "मैं आपकी सहायता करने के लिए यहां हूं। कृपया अपना प्रश्न अंग्रेजी में पूछें ताकि मैं आपको बेहतर जानकारी दे सकूं। या फिर आप अपनी फसल, मौसम, या बाजार के बारे में पूछ सकते हैं।";
    }

    // Generate responses based on topic combinations
    if (topics.includes('crop') && topics.includes('pest')) {
      return "Integrated Pest Management (IPM) is the most effective approach for crop protection. It combines biological controls, habitat manipulation, resistant crop varieties, and judicious use of pesticides.\n\nFor specific pest issues:\n• Identify the pest correctly before treatment\n• Consider natural predators and beneficial insects\n• Use crop rotation to break pest cycles\n• Apply organic solutions like neem oil before chemical pesticides\n• Monitor your fields regularly for early detection\n\nWhat specific crop and pest are you dealing with? I can provide more targeted advice.";
    }

    if (topics.includes('crop') && topics.includes('water')) {
      return "Water management is crucial for crop success. Here are some efficient irrigation practices:\n\n• Drip irrigation can save up to 60% water compared to flood irrigation\n• Schedule irrigation based on crop water requirements at different growth stages\n• Consider rainfall patterns and soil moisture before irrigating\n• Mulching helps retain soil moisture and reduces evaporation\n• Water early morning or evening to minimize evaporation loss\n\nFor water conservation, you might consider rainwater harvesting, building check dams, or using soil moisture sensors to optimize irrigation timing.";
    }

    if (topics.includes('soil') && topics.includes('organic')) {
      return "Organic soil management improves long-term soil health and crop productivity. Here are key practices:\n\n• Compost application adds organic matter and beneficial microorganisms\n• Green manuring with legumes adds nitrogen naturally\n• Crop rotation prevents nutrient depletion\n• Vermicomposting creates nutrient-rich worm castings\n• Mulching protects soil structure and adds organic matter\n\nA balanced approach to organic farming focuses on building soil biology rather than just replacing synthetic inputs with organic ones. Would you like specific information about making compost or vermicompost?";
    }

    if (topics.includes('market') && topics.includes('price')) {
      return "Current agricultural market trends show varying prices across regions. For the best prices:\n\n• Check multiple markets before selling your produce\n• Consider direct marketing through farmer producer organizations (FPOs)\n• Use the e-NAM (National Agriculture Market) platform for price discovery\n• Value addition through grading, sorting, and packaging can increase returns\n• Storage facilities can help you sell when prices are favorable\n\nThe government's MSP (Minimum Support Price) provides a price floor for many crops. Which specific crop's market price are you interested in?";
    }

    if (topics.includes('finance') && topics.includes('scheme')) {
      return "Several government schemes support farmers financially:\n\n• PM-KISAN provides ₹6,000 annually to eligible farmer families\n• Kisan Credit Card offers credit at subsidized interest rates\n• Pradhan Mantri Fasal Bima Yojana provides crop insurance\n• Soil Health Card Scheme helps optimize fertilizer use\n• PMKSY (Pradhan Mantri Krishi Sinchayee Yojana) supports irrigation projects\n\nTo apply, visit your local agriculture office or Common Service Center. You'll need land records, Aadhaar card, and bank account details. Would you like more information about a specific scheme?";
    }

    if (topics.includes('technology')) {
      return "Agricultural technology is transforming farming in India:\n\n• Soil and moisture sensors help optimize irrigation\n• Drone technology enables precision spraying and crop monitoring\n• Mobile apps provide weather forecasts and market prices\n• IoT devices allow remote monitoring of field conditions\n• AI-based disease detection through smartphone cameras\n\nMany of these technologies are becoming more affordable and accessible to small farmers through government subsidies and startup innovations. The FarmConnects app itself integrates several of these technologies to help you manage your farm better.";
    }

    if (topics.includes('weather') && topics.includes('forecast')) {
      return "Weather forecasting is essential for farm planning. The Indian Meteorological Department provides forecasts through:\n\n• The Meghdoot app specifically designed for farmers\n• SMS services in regional languages\n• All India Radio broadcasts\n• District-level agro-meteorological advisories\n\nFor your local area, you can check the Weather section in the FarmConnects app, which provides 5-day forecasts including temperature, rainfall probability, and humidity. Would you like help accessing weather information through the app?";
    }

    // If we have at least one topic but no specific combination matched
    if (topics.length > 0) {
      const topic = topics[0]; // Take the first topic

      // Generic responses based on single topics
      const topicResponses = {
        crop: "Successful crop management involves selecting the right varieties for your region, proper soil preparation, timely planting, adequate nutrition, effective pest management, and appropriate harvesting techniques. What specific aspect of crop management are you interested in?",
        soil: "Soil health is the foundation of productive farming. Regular soil testing helps determine nutrient levels and pH. Adding organic matter improves soil structure, water retention, and microbial activity. What specific soil issue are you facing?",
        weather: "Weather patterns significantly impact farming decisions. Monitoring forecasts helps with planning planting, irrigation, and harvesting. The FarmConnects app provides weather forecasts to help you make informed decisions. What specific weather information do you need?",
        pest: "Pest management requires regular monitoring, identification, and timely intervention. Integrated Pest Management (IPM) combines cultural, biological, and chemical controls for sustainable management. What specific pest problem are you experiencing?",
        market: "Understanding market dynamics helps maximize farm profits. Factors to consider include seasonal price variations, quality standards, transportation costs, and storage options. The FarmConnects marketplace connects you directly with buyers. What specific market information are you looking for?",
        finance: "Financial planning is crucial for farm sustainability. Options include government schemes, bank loans, crop insurance, and microfinance. Proper record-keeping of expenses and income helps track profitability. What specific financial aspect are you interested in?",
        technology: "Agricultural technology can improve efficiency and productivity. Options range from simple tools to advanced systems like precision agriculture, depending on your scale and budget. The FarmConnects app integrates several technologies to help manage your farm. What specific technology are you interested in?",
        water: "Water management is critical for sustainable farming. Efficient irrigation methods include drip, sprinkler, and micro-irrigation. Water conservation practices like mulching, rainwater harvesting, and crop selection also help. What specific water management issue are you facing?",
        livestock: "Livestock management involves proper housing, nutrition, health care, and breeding. Integrated farming systems that combine crops and livestock can be more sustainable and profitable. What specific livestock issue are you interested in?",
        organic: "Organic farming focuses on ecological processes and biodiversity without synthetic inputs. Key practices include crop rotation, green manuring, composting, and biological pest control. Certification can help access premium markets. What specific aspect of organic farming interests you?",
        equipment: "Farm equipment selection depends on farm size, crops grown, and budget. Proper maintenance extends equipment life and reduces downtime. Custom hiring services can make machinery affordable for small farmers. What specific equipment are you interested in?",
        question: "I'd be happy to help answer your question. Could you provide more specific details about what you're looking for? This will help me give you the most relevant information."
      };

      return topicResponses[topic] || "I understand you're asking about " + topic + ". Could you provide more specific details about what you're looking for?";
    }

    // If we couldn't determine any topics, provide a generic response
    return "I understand you're asking about farming or agriculture. To provide the most helpful information, could you tell me more specifically what you're interested in? For example, are you asking about crops, soil, pests, weather, market prices, or something else?";
  }
}

export default new ChatbotService();
