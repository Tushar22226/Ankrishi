/**
 * AppInfoService - Provides information about the app's screens and UI elements
 * 
 * This service contains detailed information about all screens and UI elements in the app,
 * which can be used by the chatbot to answer user questions about the app.
 */

// Define screen information interface
export interface ScreenInfo {
  id: string;
  name: string;
  description: string;
  path: string;
  features: string[];
  uiElements: UIElementInfo[];
}

// Define UI element information interface
export interface UIElementInfo {
  id: string;
  name: string;
  type: 'button' | 'input' | 'text' | 'image' | 'card' | 'list' | 'tab' | 'icon' | 'other';
  description: string;
  purpose: string;
}

class AppInfoService {
  // Database of screen information
  private screenDatabase: ScreenInfo[] = [
    {
      id: 'home',
      name: 'Home Screen',
      description: 'The main dashboard of the app showing weather, recommendations, and quick access to features.',
      path: 'screens/main/HomeScreen.tsx',
      features: [
        'Weather forecast display',
        'AI recommendations',
        'Featured products',
        'Quick access to app features',
        'Crisis alerts'
      ],
      uiElements: [
        {
          id: 'weather_widget',
          name: 'Weather Widget',
          type: 'card',
          description: 'Displays current weather information for the user\'s location',
          purpose: 'Provides farmers with up-to-date weather information for planning activities'
        },
        {
          id: 'feature_categories',
          name: 'Feature Categories',
          type: 'card',
          description: 'Horizontal scrollable cards with feature icons',
          purpose: 'Provides quick access to different features of the app'
        },
        {
          id: 'recommendations',
          name: 'AI Recommendations',
          type: 'card',
          description: 'Shows personalized recommendations based on user data',
          purpose: 'Helps farmers make informed decisions about their farming activities'
        },
        {
          id: 'featured_products',
          name: 'Featured Products',
          type: 'list',
          description: 'Displays a selection of featured products from the marketplace',
          purpose: 'Promotes products and provides quick access to the marketplace'
        }
      ]
    },
    {
      id: 'marketplace',
      name: 'Marketplace Screen',
      description: 'A platform for buying and selling agricultural products, equipment, and supplies.',
      path: 'screens/main/MarketplaceScreen.tsx',
      features: [
        'Product browsing by category',
        'Search functionality',
        'Product listings with images and prices',
        'Shopping cart integration',
        'Verified seller badges'
      ],
      uiElements: [
        {
          id: 'search_bar',
          name: 'Search Bar',
          type: 'input',
          description: 'Text input field for searching products',
          purpose: 'Allows users to find specific products by name or description'
        },
        {
          id: 'category_tabs',
          name: 'Category Tabs',
          type: 'tab',
          description: 'Horizontal scrollable tabs for product categories',
          purpose: 'Enables filtering products by category (All, Fertilizers, Equipment, Produce)'
        },
        {
          id: 'product_card',
          name: 'Product Card',
          type: 'card',
          description: 'Card displaying product image, name, price, and seller information',
          purpose: 'Shows product information in a compact, visually appealing format'
        },
        {
          id: 'cart_button',
          name: 'Cart Button',
          type: 'button',
          description: 'Button with cart icon and item count badge',
          purpose: 'Provides access to the shopping cart and shows number of items in cart'
        },
        {
          id: 'verified_badge',
          name: 'Verified Seller Badge',
          type: 'icon',
          description: 'Shield checkmark icon with "VERIFIED" text',
          purpose: 'Indicates that the seller has been verified by the platform'
        }
      ]
    },
    {
      id: 'product_details',
      name: 'Product Details Screen',
      description: 'Detailed view of a product with comprehensive information and purchase options.',
      path: 'screens/marketplace/ProductDetailsScreen.tsx',
      features: [
        'Product images gallery',
        'Detailed product information',
        'Pricing and discount information',
        'Seller information with verification status',
        'Add to cart functionality',
        'Product ratings and reviews',
        'Scientific verification details',
        'AACC certifications',
        'Product journey information'
      ],
      uiElements: [
        {
          id: 'product_image_gallery',
          name: 'Product Image Gallery',
          type: 'image',
          description: 'Swipeable gallery of product images',
          purpose: 'Allows users to view multiple images of the product'
        },
        {
          id: 'product_info',
          name: 'Product Information',
          type: 'text',
          description: 'Detailed text information about the product',
          purpose: 'Provides comprehensive details about the product specifications'
        },
        {
          id: 'price_section',
          name: 'Price Section',
          type: 'text',
          description: 'Shows current price, original price, and discount percentage',
          purpose: 'Clearly communicates pricing information to the user'
        },
        {
          id: 'quantity_selector',
          name: 'Quantity Selector',
          type: 'input',
          description: 'Controls to increase or decrease purchase quantity',
          purpose: 'Allows users to specify how many units they want to purchase'
        },
        {
          id: 'add_to_cart_button',
          name: 'Add to Cart Button',
          type: 'button',
          description: 'Button to add the product to the shopping cart',
          purpose: 'Enables users to add the product to their cart for purchase'
        },
        {
          id: 'seller_info',
          name: 'Seller Information',
          type: 'card',
          description: 'Card showing seller name, photo, rating, and verification status',
          purpose: 'Provides information about the seller to build trust'
        },
        {
          id: 'verification_details',
          name: 'Verification Details',
          type: 'card',
          description: 'Information about scientific verification and certifications',
          purpose: 'Provides assurance about product quality and authenticity'
        },
        {
          id: 'product_journey',
          name: 'Product Journey',
          type: 'card',
          description: 'Information about the product\'s origin and supply chain',
          purpose: 'Shows transparency in the product\'s journey from farm to market'
        }
      ]
    },
    {
      id: 'chatbot',
      name: 'Chatbot Screen',
      description: 'AI assistant that provides farming advice, answers questions, and analyzes plant diseases.',
      path: 'screens/main/ChatbotScreen.tsx',
      features: [
        'Conversational interface',
        'Farming advice and information',
        'Plant disease detection via image upload',
        'Web search for information',
        'Suggested questions',
        'Rich message formatting'
      ],
      uiElements: [
        {
          id: 'message_list',
          name: 'Message List',
          type: 'list',
          description: 'Scrollable list of chat messages between user and AI',
          purpose: 'Displays the conversation history'
        },
        {
          id: 'message_input',
          name: 'Message Input',
          type: 'input',
          description: 'Text input field for typing messages',
          purpose: 'Allows users to type questions or messages to the AI'
        },
        {
          id: 'send_button',
          name: 'Send Button',
          type: 'button',
          description: 'Button with paper airplane icon',
          purpose: 'Sends the typed message to the AI'
        },
        {
          id: 'image_upload_button',
          name: 'Image Upload Button',
          type: 'button',
          description: 'Button with image icon',
          purpose: 'Opens options to upload a plant image for disease detection'
        },
        {
          id: 'suggestions',
          name: 'Suggested Questions',
          type: 'list',
          description: 'Horizontal scrollable list of suggested questions',
          purpose: 'Provides quick access to common questions users might want to ask'
        }
      ]
    },
    {
      id: 'my_farm',
      name: 'My Farm Screen',
      description: 'Management dashboard for farm operations, finances, and resources.',
      path: 'screens/main/MyFarmScreen.tsx',
      features: [
        'Farm overview statistics',
        'Financial management',
        'Crop planning and tracking',
        'Resource management',
        'Warehouse management',
        'Equipment tracking'
      ],
      uiElements: [
        {
          id: 'farm_summary',
          name: 'Farm Summary',
          type: 'card',
          description: 'Card showing key farm statistics and metrics',
          purpose: 'Provides a quick overview of farm performance'
        },
        {
          id: 'finance_section',
          name: 'Finance Section',
          type: 'card',
          description: 'Financial information including income and expenses',
          purpose: 'Helps farmers track their financial performance'
        },
        {
          id: 'crop_section',
          name: 'Crop Management',
          type: 'card',
          description: 'Information about current crops and planting schedules',
          purpose: 'Helps farmers manage their crop planning and tracking'
        },
        {
          id: 'warehouse_button',
          name: 'Warehouse Button',
          type: 'button',
          description: 'Button to access warehouse management',
          purpose: 'Provides access to the warehouse management screen'
        }
      ]
    },
    {
      id: 'chat',
      name: 'Chat Screen',
      description: 'Messaging interface for communication between farmers, vendors, and consultants.',
      path: 'screens/chat/ChatScreen.tsx',
      features: [
        'Real-time messaging',
        'Online status indicators',
        'Typing indicators',
        'Message history',
        'Contract-related messaging'
      ],
      uiElements: [
        {
          id: 'message_list',
          name: 'Message List',
          type: 'list',
          description: 'Scrollable list of chat messages',
          purpose: 'Displays the conversation history between users'
        },
        {
          id: 'message_input',
          name: 'Message Input',
          type: 'input',
          description: 'Text input field for typing messages',
          purpose: 'Allows users to type messages to send'
        },
        {
          id: 'send_button',
          name: 'Send Button',
          type: 'button',
          description: 'Button with paper airplane icon',
          purpose: 'Sends the typed message to the recipient'
        },
        {
          id: 'online_status',
          name: 'Online Status Indicator',
          type: 'icon',
          description: 'Green dot indicating online status',
          purpose: 'Shows whether the recipient is currently online'
        },
        {
          id: 'typing_indicator',
          name: 'Typing Indicator',
          type: 'text',
          description: 'Text showing when someone is typing',
          purpose: 'Indicates when the other person is typing a message'
        },
        {
          id: 'verification_badge',
          name: 'Verification Badge',
          type: 'icon',
          description: 'Shield checkmark icon indicating verified status',
          purpose: 'Shows that a user has been verified by the platform'
        }
      ]
    }
  ];

  // Get information about all screens
  getAllScreens(): ScreenInfo[] {
    return this.screenDatabase;
  }

  // Get information about a specific screen by ID
  getScreenById(id: string): ScreenInfo | null {
    return this.screenDatabase.find(screen => screen.id === id) || null;
  }

  // Get information about a specific screen by name (case-insensitive partial match)
  getScreenByName(name: string): ScreenInfo | null {
    const nameLower = name.toLowerCase();
    return this.screenDatabase.find(screen => 
      screen.name.toLowerCase().includes(nameLower)
    ) || null;
  }

  // Get information about a specific UI element by ID
  getUIElementById(id: string): UIElementInfo | null {
    for (const screen of this.screenDatabase) {
      const element = screen.uiElements.find(el => el.id === id);
      if (element) return element;
    }
    return null;
  }

  // Get information about a specific UI element by name (case-insensitive partial match)
  getUIElementByName(name: string): { element: UIElementInfo, screen: ScreenInfo } | null {
    const nameLower = name.toLowerCase();
    for (const screen of this.screenDatabase) {
      const element = screen.uiElements.find(el => 
        el.name.toLowerCase().includes(nameLower)
      );
      if (element) return { element, screen };
    }
    return null;
  }

  // Search for information about screens and UI elements
  search(query: string): { screens: ScreenInfo[], uiElements: { element: UIElementInfo, screen: ScreenInfo }[] } {
    const queryLower = query.toLowerCase();
    const screens: ScreenInfo[] = [];
    const uiElements: { element: UIElementInfo, screen: ScreenInfo }[] = [];

    // Search in screens
    for (const screen of this.screenDatabase) {
      // Check if query matches screen name or description
      if (
        screen.name.toLowerCase().includes(queryLower) ||
        screen.description.toLowerCase().includes(queryLower)
      ) {
        screens.push(screen);
      }

      // Check if query matches any feature
      const matchesFeature = screen.features.some(feature => 
        feature.toLowerCase().includes(queryLower)
      );
      if (matchesFeature && !screens.includes(screen)) {
        screens.push(screen);
      }

      // Check if query matches any UI element
      for (const element of screen.uiElements) {
        if (
          element.name.toLowerCase().includes(queryLower) ||
          element.description.toLowerCase().includes(queryLower) ||
          element.purpose.toLowerCase().includes(queryLower)
        ) {
          uiElements.push({ element, screen });
        }
      }
    }

    return { screens, uiElements };
  }

  // Format screen information as a readable message
  formatScreenInfo(screen: ScreenInfo): string {
    let message = `**${screen.name}**\n\n`;
    message += `${screen.description}\n\n`;
    
    message += `**Features:**\n`;
    screen.features.forEach(feature => {
      message += `• ${feature}\n`;
    });
    
    message += `\n**UI Elements:**\n`;
    screen.uiElements.forEach(element => {
      message += `• ${element.name}: ${element.description}\n`;
    });
    
    return message;
  }

  // Format UI element information as a readable message
  formatUIElementInfo(element: UIElementInfo, screen: ScreenInfo): string {
    let message = `**${element.name}** (${element.type})\n\n`;
    message += `${element.description}\n\n`;
    message += `**Purpose:** ${element.purpose}\n\n`;
    message += `**Found in:** ${screen.name}\n`;
    
    return message;
  }

  // Format search results as a readable message
  formatSearchResults(results: { screens: ScreenInfo[], uiElements: { element: UIElementInfo, screen: ScreenInfo }[] }): string {
    if (results.screens.length === 0 && results.uiElements.length === 0) {
      return "I couldn't find any information about that in the app. Please try a different search term or ask a more specific question.";
    }
    
    let message = "Here's what I found in the app:\n\n";
    
    if (results.screens.length > 0) {
      message += "**Screens:**\n";
      results.screens.forEach(screen => {
        message += `• **${screen.name}**: ${screen.description}\n`;
      });
      message += "\n";
    }
    
    if (results.uiElements.length > 0) {
      message += "**UI Elements:**\n";
      results.uiElements.forEach(({ element, screen }) => {
        message += `• **${element.name}** (in ${screen.name}): ${element.description}\n`;
      });
    }
    
    message += "\nWould you like more detailed information about any of these items?";
    
    return message;
  }
}

export default new AppInfoService();
