/**
 * QuotesService - Provides motivational quotes for Indian farmers
 * 
 * This service contains a collection of inspirational quotes specifically
 * curated for farmers, highlighting their importance and contribution to society.
 */

// Define quote categories
export type QuoteCategory = 'general' | 'motivation' | 'respect' | 'wisdom' | 'hardwork';

// Quote interface
export interface FarmerQuote {
  text: string;
  author?: string;
  category: QuoteCategory;
}

// Collection of quotes for farmers
const farmerQuotes: FarmerQuote[] = [
  // General quotes
  {
    text: "किसान देश की आत्मा है, उसका सम्मान हमारा कर्तव्य है।",
    author: "भारतीय कहावत",
    category: "respect"
  },
  {
    text: "जय जवान, जय किसान, जय विज्ञान।",
    author: "लाल बहादुर शास्त्री",
    category: "respect"
  },
  {
    text: "अन्नदाता सुखी भव: - अन्न देने वाला हमेशा सुखी रहे।",
    author: "संस्कृत आशीर्वाद",
    category: "respect"
  },
  {
    text: "धरती माता की सेवा करने वाला किसान ही देश का सच्चा सपूत है।",
    category: "respect"
  },
  {
    text: "किसान की मेहनत से ही देश की थाली भरती है।",
    category: "respect"
  },
  
  // Motivational quotes
  {
    text: "बीज बोने से पहले धरती को तैयार करना पड़ता है, सफलता पाने से पहले खुद को।",
    category: "motivation"
  },
  {
    text: "खेत में पसीना बहाने वाला किसान ही देश की तकदीर बनाता है।",
    category: "motivation"
  },
  {
    text: "जैसे बीज, वैसी फसल; जैसा कर्म, वैसा फल।",
    category: "motivation"
  },
  {
    text: "धैर्य और परिश्रम से वो बीज भी अंकुरित होता है जिसे लोग बंजर समझते हैं।",
    category: "motivation"
  },
  {
    text: "हर मौसम की अपनी चुनौतियां हैं, और हर चुनौती का अपना समाधान।",
    category: "motivation"
  },
  
  // Wisdom quotes
  {
    text: "धरती माता हमें सिखाती है कि देने में ही पाना है।",
    category: "wisdom"
  },
  {
    text: "फसल की देखभाल जैसे करो, जीवन वैसे ही फलेगा-फूलेगा।",
    category: "wisdom"
  },
  {
    text: "प्रकृति के साथ चलने वाला कभी पीछे नहीं रहता।",
    category: "wisdom"
  },
  {
    text: "अच्छा किसान वही है जो मिट्टी की भाषा समझता है।",
    category: "wisdom"
  },
  {
    text: "खेती में नवाचार, समृद्धि का आधार।",
    category: "wisdom"
  },
  
  // Hardwork quotes
  {
    text: "मेहनत ऐसा पौधा है जिसकी फसल कभी खराब नहीं होती।",
    category: "hardwork"
  },
  {
    text: "किसान की मेहनत का मोल, अनाज के एक-एक दाने में है।",
    category: "hardwork"
  },
  {
    text: "सूरज से पहले उठने वाला किसान ही सोने जैसी फसल पाता है।",
    category: "hardwork"
  },
  {
    text: "हाथों में कड़े और माथे पर पसीना, यही है किसान की पहचान।",
    category: "hardwork"
  },
  {
    text: "धरती पर स्वर्ग बनाने वाला किसान ही असली कलाकार है।",
    category: "hardwork"
  },
  
  // English quotes
  {
    text: "The farmer is the backbone of our nation.",
    category: "respect"
  },
  {
    text: "When agriculture flourishes, the nation prospers.",
    category: "general"
  },
  {
    text: "Respect the hands that feed the nation.",
    category: "respect"
  },
  {
    text: "A farmer's patience is as vast as their fields.",
    category: "wisdom"
  },
  {
    text: "The true wealth of a nation lies in its soil and those who nurture it.",
    category: "respect"
  }
];

// Last used quotes to avoid repetition
let lastUsedQuotes: string[] = [];
const MAX_HISTORY = 10; // Maximum number of quotes to remember

class QuotesService {
  /**
   * Get a random quote for farmers
   * @returns A random quote from the collection
   */
  getRandomQuote(): FarmerQuote {
    // Filter out recently used quotes if possible
    let availableQuotes = farmerQuotes;
    if (lastUsedQuotes.length < farmerQuotes.length - 1) {
      availableQuotes = farmerQuotes.filter(quote => !lastUsedQuotes.includes(quote.text));
    }
    
    // Get a random quote from available quotes
    const randomIndex = Math.floor(Math.random() * availableQuotes.length);
    const selectedQuote = availableQuotes[randomIndex];
    
    // Add to history and maintain history size
    lastUsedQuotes.push(selectedQuote.text);
    if (lastUsedQuotes.length > MAX_HISTORY) {
      lastUsedQuotes.shift(); // Remove oldest quote
    }
    
    return selectedQuote;
  }
  
  /**
   * Get a random quote from a specific category
   * @param category The category of quote to retrieve
   * @returns A random quote from the specified category
   */
  getQuoteByCategory(category: QuoteCategory): FarmerQuote {
    // Filter quotes by category
    const categoryQuotes = farmerQuotes.filter(quote => quote.category === category);
    
    // If no quotes in category, return a random quote
    if (categoryQuotes.length === 0) {
      return this.getRandomQuote();
    }
    
    // Get a random quote from the category
    const randomIndex = Math.floor(Math.random() * categoryQuotes.length);
    return categoryQuotes[randomIndex];
  }
  
  /**
   * Get all available quotes
   * @returns All quotes in the collection
   */
  getAllQuotes(): FarmerQuote[] {
    return [...farmerQuotes];
  }
}

export default new QuotesService();
