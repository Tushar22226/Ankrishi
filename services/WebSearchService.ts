/**
 * WebSearchService - Provides web search functionality for the chatbot
 *
 * This service uses a free API to search the web for information when the chatbot
 * doesn't have a predefined answer for a user's question.
 */

// Define search result interface
export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
}

class WebSearchService {
  // Free search API endpoint (using SerpAPI alternative)
  private apiUrl = 'https://serpapi.com/search.json';

  // Search the web for information
  async searchWeb(query: string, limit: number = 3): Promise<SearchResult[]> {
    try {
      console.log(`Searching web for: ${query}`);

      // For demo purposes, we'll use a mock implementation
      // In a real app, you would use an actual API key and make a real request
      return this.getMockResults(query, limit);

      // Real implementation would look like this:
      /*
      const response = await fetch(`${this.apiUrl}?q=${encodeURIComponent(query)}&api_key=${this.apiKey}`);

      if (!response.ok) {
        throw new Error(`Search API error: ${response.status}`);
      }

      const data = await response.json();

      // Parse the results
      const results: SearchResult[] = [];

      if (data.organic_results && Array.isArray(data.organic_results)) {
        for (let i = 0; i < Math.min(data.organic_results.length, limit); i++) {
          const result = data.organic_results[i];
          results.push({
            title: result.title || 'No title',
            link: result.link || '#',
            snippet: result.snippet || 'No description available',
            source: result.source || 'Unknown source'
          });
        }
      }

      return results;
      */
    } catch (error) {
      console.error('Error searching web:', error);
      return [];
    }
  }

  // Generate mock search results for demo purposes
  private getMockResults(query: string, limit: number): SearchResult[] {
    const queryLower = query.toLowerCase();
    const results: SearchResult[] = [];

    // Database of mock search results by category
    const mockResultsDatabase = {
      fertilizer: [
        {
          title: 'Best Fertilizers for Different Crops - Agriculture Guide',
          link: 'https://example.com/fertilizer-guide',
          snippet: 'Comprehensive guide to choosing the right fertilizer for various crops. NPK ratios, organic options, and application timing for optimal results.',
          source: 'Agriculture Guide'
        },
        {
          title: 'Organic vs. Chemical Fertilizers: Pros and Cons - Farming Today',
          link: 'https://example.com/organic-vs-chemical',
          snippet: 'Compare organic and chemical fertilizers for effectiveness, cost, environmental impact, and long-term soil health. Make informed decisions for your farm.',
          source: 'Farming Today'
        },
        {
          title: 'How to Make Compost at Home - Organic Farming Association',
          link: 'https://example.com/homemade-compost',
          snippet: 'Step-by-step guide to creating nutrient-rich compost from farm waste. Reduce costs and improve soil health with this sustainable approach.',
          source: 'Organic Farming Association'
        }
      ],
      pest: [
        {
          title: 'Integrated Pest Management for Sustainable Farming - IPM Institute',
          link: 'https://example.com/ipm-guide',
          snippet: 'Learn about IPM strategies that combine biological, cultural, physical, and chemical tools to minimize economic, health, and environmental risks.',
          source: 'IPM Institute'
        },
        {
          title: 'Common Crop Pests and Natural Control Methods - Organic Farming Research',
          link: 'https://example.com/natural-pest-control',
          snippet: 'Identify common agricultural pests and discover effective natural control methods that reduce chemical dependency and preserve beneficial insects.',
          source: 'Organic Farming Research'
        },
        {
          title: 'Early Warning Signs of Pest Infestation in Crops - Pest Management Journal',
          link: 'https://example.com/pest-warning-signs',
          snippet: 'Recognize the early indicators of pest problems before they cause significant damage. Regular monitoring techniques and intervention thresholds.',
          source: 'Pest Management Journal'
        }
      ],
      weather: [
        {
          title: 'Climate-Smart Agriculture Practices for Changing Weather Patterns',
          link: 'https://example.com/climate-smart-farming',
          snippet: 'Adapt your farming practices to increasingly unpredictable weather with these climate-smart techniques. Improve resilience and maintain productivity.',
          source: 'Climate Agriculture Institute'
        },
        {
          title: 'Weather Forecasting Tools for Farmers - AgriTech Review',
          link: 'https://example.com/weather-tools',
          snippet: 'Review of the best weather forecasting apps and tools designed specifically for agricultural use. Make better decisions with accurate, localized predictions.',
          source: 'AgriTech Review'
        },
        {
          title: 'Drought-Resistant Farming Techniques - Water Conservation Alliance',
          link: 'https://example.com/drought-farming',
          snippet: 'Practical strategies for farming in water-scarce conditions. Crop selection, irrigation efficiency, soil management, and water harvesting techniques.',
          source: 'Water Conservation Alliance'
        }
      ],
      market: [
        {
          title: 'Agricultural Market Trends and Price Forecasts - Market Intelligence',
          link: 'https://example.com/market-trends',
          snippet: 'Analysis of current agricultural market trends, price forecasts, and demand projections for major crops. Make informed decisions about what to grow and when to sell.',
          source: 'Market Intelligence'
        },
        {
          title: 'Direct-to-Consumer Marketing Strategies for Farmers - Farm Marketing Guide',
          link: 'https://example.com/direct-marketing',
          snippet: 'Learn how to sell your produce directly to consumers through farmers markets, CSAs, farm stands, and online platforms. Increase profits by cutting out middlemen.',
          source: 'Farm Marketing Guide'
        },
        {
          title: 'Export Opportunities for Indian Farmers - Export Council',
          link: 'https://example.com/export-guide',
          snippet: 'Guide to exporting agricultural products from India. Certification requirements, international standards, logistics, and finding foreign buyers.',
          source: 'Export Council'
        }
      ],
      finance: [
        {
          title: 'Agricultural Loans and Credit Schemes for Farmers - Agri Finance',
          link: 'https://example.com/agri-loans',
          snippet: 'Comprehensive guide to agricultural loans, credit schemes, and financial assistance programs available to farmers in India. Application procedures and eligibility criteria.',
          source: 'Agri Finance'
        },
        {
          title: 'Crop Insurance Programs and Risk Management - Insurance Board',
          link: 'https://example.com/crop-insurance',
          snippet: 'Overview of crop insurance programs, premium subsidies, and claim procedures. Protect your farm business from weather disasters and market fluctuations.',
          source: 'Insurance Board'
        },
        {
          title: 'Financial Planning for Small and Marginal Farmers - Rural Finance',
          link: 'https://example.com/farm-financial-planning',
          snippet: 'Financial planning strategies specifically designed for small and marginal farmers. Budgeting, cash flow management, and investment planning for farm sustainability.',
          source: 'Rural Finance'
        }
      ],
      technology: [
        {
          title: 'Smart Farming Technologies for Indian Agriculture - AgriTech Today',
          link: 'https://example.com/smart-farming',
          snippet: 'Overview of affordable smart farming technologies suitable for Indian agriculture. IoT sensors, drones, mobile apps, and precision farming tools.',
          source: 'AgriTech Today'
        },
        {
          title: 'Digital Agriculture Platforms and Services - Digital Farming',
          link: 'https://example.com/digital-agriculture',
          snippet: 'Review of digital platforms and services that help farmers access markets, information, inputs, and advisory services through mobile phones and internet.',
          source: 'Digital Farming'
        },
        {
          title: 'Affordable Irrigation Technologies for Small Farms - Water Tech',
          link: 'https://example.com/irrigation-tech',
          snippet: 'Guide to affordable irrigation technologies for small farms. Drip irrigation, sprinklers, solar pumps, and water management systems that save water and energy.',
          source: 'Water Tech'
        }
      ],
      general: [
        {
          title: 'Latest Agricultural Innovations and Research - Farming Future',
          link: 'https://example.com/ag-innovations',
          snippet: 'Explore cutting-edge developments in agricultural technology, sustainable practices, and crop science that are shaping the future of farming.',
          source: 'Farming Future'
        },
        {
          title: 'Government Schemes and Subsidies for Farmers - AgPolicy Center',
          link: 'https://example.com/farmer-schemes',
          snippet: 'Comprehensive guide to current government programs, subsidies, and financial assistance available to farmers. Application procedures and eligibility criteria.',
          source: 'AgPolicy Center'
        },
        {
          title: 'Sustainable Farming Practices for Small Holders - Small Farm Alliance',
          link: 'https://example.com/sustainable-small-farms',
          snippet: 'Practical, low-cost sustainable farming methods specifically designed for small-scale farmers. Increase productivity while protecting natural resources.',
          source: 'Small Farm Alliance'
        }
      ]
    };

    // Determine which category the query belongs to
    let category = 'general';

    if (queryLower.includes('fertilizer') || queryLower.includes('nutrient') || queryLower.includes('compost')) {
      category = 'fertilizer';
    }
    else if (queryLower.includes('pest') || queryLower.includes('insect') || queryLower.includes('disease')) {
      category = 'pest';
    }
    else if (queryLower.includes('weather') || queryLower.includes('climate') || queryLower.includes('rain') || queryLower.includes('forecast')) {
      category = 'weather';
    }
    else if (queryLower.includes('market') || queryLower.includes('price') || queryLower.includes('sell') || queryLower.includes('buy') || queryLower.includes('trade')) {
      category = 'market';
    }
    else if (queryLower.includes('loan') || queryLower.includes('credit') || queryLower.includes('finance') || queryLower.includes('insurance') || queryLower.includes('subsidy')) {
      category = 'finance';
    }
    else if (queryLower.includes('technology') || queryLower.includes('digital') || queryLower.includes('app') || queryLower.includes('sensor') || queryLower.includes('drone')) {
      category = 'technology';
    }

    // Get results for the determined category
    results.push(...mockResultsDatabase[category]);

    // If we don't have enough results, add some from the general category
    if (results.length < limit && category !== 'general') {
      results.push(...mockResultsDatabase.general.slice(0, limit - results.length));
    }

    // Return limited number of results
    return results.slice(0, limit);
  }

  // Format search results as a readable message
  formatSearchResults(results: SearchResult[]): string {
    if (results.length === 0) {
      return "I couldn't find specific information about that. Could you try rephrasing your question or asking about something else?";
    }

    // Instead of just showing search results, provide a synthesized answer
    const mainResult = results[0]; // Use the top result as the main source

    let message = "Based on available information:\n\n";
    message += mainResult.snippet + "\n\n";

    // Add a follow-up question or suggestion
    message += "Would you like to know more about this topic? I can provide additional details or we can discuss a related aspect.";

    // Only if there are multiple results, mention other sources
    if (results.length > 1) {
      message += "\n\nI also found these related topics that might interest you:\n";

      // Add other results as bullet points
      for (let i = 1; i < results.length; i++) {
        message += `\n• ${results[i].title}`;
      }
    }

    return message;
  }
}

export default new WebSearchService();
