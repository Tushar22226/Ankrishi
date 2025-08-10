// Article models for the e-learning section

// Article category types
export type ArticleCategory =
  | 'organic_farming'
  | 'irrigation'
  | 'pest_control'
  | 'soil_science'
  | 'crop_management'
  | 'sustainable_farming'
  | 'farm_equipment'
  | 'market_insights'
  | 'financial_management'
  | 'app_guide';

// Article interface
export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: ArticleCategory;
  coverImage: string;
  images?: string[];
  author: string;
  publishDate: number; // timestamp
  readTime: number; // in minutes
  tags: string[];
  relatedArticles?: string[]; // IDs of related articles
}

// Article category information with display names and icons
export const ArticleCategoryInfo: Record<ArticleCategory, {
  name: string;
  description: string;
  icon: string; // Ionicons name
  color: string;
}> = {
  organic_farming: {
    name: 'Organic Farming',
    description: 'Natural farming methods without synthetic chemicals',
    icon: 'leaf',
    color: '#4CAF50'
  },
  irrigation: {
    name: 'Irrigation',
    description: 'Water management techniques for crops',
    icon: 'water',
    color: '#2196F3'
  },
  pest_control: {
    name: 'Pest Control',
    description: 'Managing pests and diseases in crops',
    icon: 'bug',
    color: '#FF9800'
  },
  soil_science: {
    name: 'Soil Science',
    description: 'Understanding and improving soil health',
    icon: 'flask',
    color: '#9C27B0'
  },
  crop_management: {
    name: 'Crop Management',
    description: 'Techniques for optimal crop growth and yield',
    icon: 'nutrition',
    color: '#8BC34A'
  },
  sustainable_farming: {
    name: 'Sustainable Farming',
    description: 'Environmentally responsible farming practices',
    icon: 'earth',
    color: '#009688'
  },
  farm_equipment: {
    name: 'Farm Equipment',
    description: 'Tools and machinery for modern farming',
    icon: 'construct',
    color: '#795548'
  },
  market_insights: {
    name: 'Market Insights',
    description: 'Understanding agricultural markets and trends',
    icon: 'trending-up',
    color: '#FF5722'
  },
  financial_management: {
    name: 'Financial Management',
    description: 'Managing farm finances and investments',
    icon: 'cash',
    color: '#607D8B'
  },
  app_guide: {
    name: 'App Guides',
    description: 'Tutorials and guides for using farming applications',
    icon: 'phone-portrait',
    color: '#3F51B5'
  }
};

// Sample articles data
export const sampleArticles: Article[] = [
  {
    id: '1',
    title: 'Organic Farming Basics: A Beginner\'s Guide',
    summary: 'Learn the fundamentals of organic farming techniques and how to transition from conventional methods.',
    content: `# Organic Farming Basics: A Beginner's Guide

Organic farming is a method of crop and livestock production that involves much more than choosing not to use pesticides, fertilizers, genetically modified organisms, antibiotics, and growth hormones.

## What is Organic Farming?

Organic farming is an agricultural system that uses environmentally and animal-friendly farming methods and techniques. It focuses on soil health, ecological balance, and biodiversity conservation.

## Key Principles of Organic Farming

### 1. Soil Health Management
- Use of compost and manure
- Crop rotation to maintain soil fertility
- Cover cropping to prevent soil erosion
- Minimal tillage to preserve soil structure

### 2. Natural Pest Management
- Beneficial insects and birds
- Crop diversity and rotation
- Mechanical controls like traps and barriers
- Biological controls

### 3. Weed Management
- Mulching to suppress weeds
- Mechanical cultivation
- Flame weeding
- Cover crops

### 4. Water Conservation
- Drip irrigation
- Rainwater harvesting
- Mulching to retain moisture
- Drought-resistant crop varieties

## Getting Started with Organic Farming

1. **Assess your land**: Test your soil and understand your local climate
2. **Plan your transition**: Consider a phased approach if converting from conventional methods
3. **Build healthy soil**: Start composting and adding organic matter
4. **Choose appropriate crops**: Select varieties suited to your region
5. **Implement natural pest management**: Create habitats for beneficial insects
6. **Seek certification**: If you plan to sell organic products, research certification requirements

## Benefits of Organic Farming

- Improved soil health and reduced erosion
- Conservation of water resources
- Reduced pollution from pesticide and fertilizer runoff
- Enhanced biodiversity
- Potentially higher market value for products

Organic farming is not just a set of techniques but a holistic approach to agriculture that promotes sustainability and harmony with natural ecosystems.`,
    category: 'organic_farming',
    coverImage: 'https://images.pexels.com/photos/2252584/pexels-photo-2252584.jpeg',
    images: [
      'https://images.pexels.com/photos/2286776/pexels-photo-2286776.jpeg',
      'https://images.pexels.com/photos/2165688/pexels-photo-2165688.jpeg'
    ],
    author: 'Dr. Rajesh Kumar',
    publishDate: 1672531200000, // January 1, 2023
    readTime: 8,
    tags: ['organic', 'sustainable', 'beginner', 'soil health'],
    relatedArticles: ['3', '5', '7']
  },
  {
    id: '2',
    title: 'Modern Irrigation Techniques for Water Conservation',
    summary: 'Discover efficient irrigation methods that save water while improving crop yields.',
    content: `# Modern Irrigation Techniques for Water Conservation

Water is one of our most precious resources, especially in agriculture. Modern irrigation techniques can help farmers conserve water while maintaining or even improving crop yields.

## Why Water Conservation Matters

Agriculture accounts for approximately 70% of global freshwater withdrawals. As water scarcity becomes more prevalent due to climate change, efficient irrigation becomes increasingly important.

## Efficient Irrigation Systems

### 1. Drip Irrigation
Drip irrigation delivers water directly to the plant's root zone, minimizing evaporation and runoff. This system can reduce water usage by up to 60% compared to conventional methods.

**Key components:**
- Drip emitters
- Tubing and mainlines
- Filters
- Pressure regulators

**Best for:** Vegetables, fruit trees, vineyards, and row crops

### 2. Micro-Sprinklers
These provide a small spray radius, applying water more precisely than traditional sprinklers.

**Benefits:**
- Less water drift
- Reduced evaporation
- Better coverage for some crops than drip

**Best for:** Orchards, vineyards, and some field crops

### 3. Subsurface Drip Irrigation (SDI)
This system places drip tape or tubing below the soil surface, directly delivering water to roots.

**Advantages:**
- Virtually no evaporation
- Reduced weed growth
- Less interference with field operations
- Longer system life

### 4. Smart Irrigation Controllers
These systems use weather data, soil moisture sensors, or plant water status to automatically adjust irrigation schedules.

**Components:**
- Weather sensors
- Soil moisture sensors
- Smart controllers
- Mobile applications for monitoring

## Implementation Tips

1. **Conduct a water audit** to understand your current usage
2. **Start small** with a test area before converting your entire farm
3. **Combine techniques** for maximum efficiency
4. **Monitor soil moisture** to fine-tune your system
5. **Maintain your system** regularly to prevent leaks and clogs

## Economic Benefits

While installation costs can be significant, modern irrigation systems typically pay for themselves through:
- Reduced water bills
- Lower energy costs for pumping
- Increased crop yields
- Reduced fertilizer leaching
- Labor savings

By implementing these modern irrigation techniques, you can significantly reduce your water usage while maintaining or even improving your agricultural productivity.`,
    category: 'irrigation',
    coverImage: 'https://images.pexels.com/photos/2260935/pexels-photo-2260935.jpeg',
    images: [
      'https://images.pexels.com/photos/2464084/pexels-photo-2464084.jpeg',
      'https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg'
    ],
    author: 'Anita Deshmukh',
    publishDate: 1675209600000, // February 1, 2023
    readTime: 10,
    tags: ['irrigation', 'water conservation', 'drip irrigation', 'technology'],
    relatedArticles: ['4', '6', '7']
  },
  {
    id: '3',
    title: 'Natural Pest Control Methods for Sustainable Farming',
    summary: 'Learn how to manage pests effectively without relying on harmful chemical pesticides.',
    content: `# Natural Pest Control Methods for Sustainable Farming

Pest management is one of the biggest challenges in agriculture. While chemical pesticides offer quick solutions, they often come with environmental and health concerns. Natural pest control methods provide sustainable alternatives that protect both crops and ecosystems.

## Understanding Integrated Pest Management (IPM)

Integrated Pest Management is a holistic approach that combines multiple strategies to control pests while minimizing environmental impact. The key principles include:

1. Prevention first
2. Monitoring pest populations
3. Setting action thresholds
4. Using multiple control methods
5. Evaluating results

## Biological Control Methods

### Beneficial Insects
Introducing natural predators can help control pest populations:

- **Ladybugs** - Control aphids, mites, and small insects
- **Praying mantis** - Feed on a variety of pests
- **Parasitic wasps** - Target caterpillars and other larvae
- **Nematodes** - Control soil-dwelling pests

### Microbial Controls
Certain microorganisms can target specific pests:

- **Bacillus thuringiensis (Bt)** - Controls caterpillars and certain beetles
- **Beauveria bassiana** - Fungus that infects a range of insects
- **Trichoderma** - Controls soil-borne pathogens

## Cultural Practices

### Crop Rotation
Rotating crops disrupts pest life cycles by changing the host plants available in a given area.

### Companion Planting
Some plants naturally repel pests or attract beneficial insects:

- Marigolds repel nematodes
- Basil deters flies and mosquitoes
- Nasturtiums act as trap crops for aphids

### Timing of Planting
Adjusting planting dates can help crops avoid peak pest pressure periods.

## Physical Controls

### Barriers and Traps
- Row covers protect plants from flying insects
- Sticky traps capture flying pests
- Copper tape deters snails and slugs

### Manual Removal
Hand-picking larger pests can be effective in smaller gardens.

## Plant-Based Repellents

### Neem Oil
Extracted from neem trees, this natural insecticide disrupts feeding and reproduction in many pests.

### Garlic and Hot Pepper Sprays
These homemade sprays can deter many soft-bodied insects.

## Implementation Strategy

1. **Identify pests correctly** before taking action
2. **Start with prevention** through good agricultural practices
3. **Monitor regularly** to catch problems early
4. **Use multiple approaches** rather than relying on a single method
5. **Be patient** - natural methods may work more slowly than chemicals

By implementing these natural pest control methods, farmers can maintain healthy crops while preserving beneficial insects, soil health, and ecosystem balance.`,
    category: 'pest_control',
    coverImage: 'https://images.pexels.com/photos/6231898/pexels-photo-6231898.jpeg',
    images: [
      'https://images.pexels.com/photos/7728087/pexels-photo-7728087.jpeg',
      'https://images.pexels.com/photos/7728075/pexels-photo-7728075.jpeg'
    ],
    author: 'Dr. Sunil Verma',
    publishDate: 1677628800000, // March 1, 2023
    readTime: 9,
    tags: ['pest control', 'sustainable', 'IPM', 'beneficial insects'],
    relatedArticles: ['1', '5', '7']
  },
  {
    id: '4',
    title: 'Understanding Soil Health: The Foundation of Successful Farming',
    summary: 'Discover how healthy soil biology impacts crop productivity and learn techniques to improve your soil quality.',
    content: `# Understanding Soil Health: The Foundation of Successful Farming

Soil is much more than just dirt—it's a complex living ecosystem that forms the foundation of agriculture. Healthy soil is teeming with microorganisms, has good structure, and provides essential nutrients to plants.

## What Makes Soil Healthy?

Healthy soil has five key components:

1. **Good physical structure** - Proper balance of sand, silt, and clay with adequate pore space
2. **Biological activity** - Diverse microorganisms, earthworms, and other soil life
3. **Chemical balance** - Appropriate pH and nutrient levels
4. **Organic matter content** - Carbon-rich materials that feed soil life
5. **Water management** - Ability to absorb, retain, and drain water appropriately

## Assessing Your Soil Health

### Visual Assessment
Look for these indicators of healthy soil:
- Dark color (indicating organic matter)
- Crumbly texture that holds shape when moist
- Presence of earthworms and other visible soil life
- Plant roots that grow deeply and spread widely
- Good water infiltration (no standing water after rain)

### Soil Testing
Regular soil tests can provide valuable information about:
- pH levels
- Nutrient content (N-P-K and micronutrients)
- Organic matter percentage
- Cation exchange capacity (CEC)
- Potential contaminants

## Improving Soil Health

### Building Organic Matter
Organic matter is the foundation of soil health. Increase it by:
- Adding compost
- Using cover crops
- Practicing crop rotation
- Minimizing tillage
- Leaving crop residues

### Managing Soil Biology
Encourage beneficial soil organisms by:
- Reducing synthetic chemical use
- Adding compost tea or microbial inoculants
- Maintaining soil moisture
- Minimizing soil disturbance

### Balancing Nutrients
- Use soil tests to guide amendments
- Apply nutrients based on crop needs
- Consider slow-release organic sources
- Balance major nutrients with micronutrients

### Improving Soil Structure
- Avoid working wet soil
- Minimize compaction from equipment
- Use deep-rooted cover crops to break up compaction
- Add organic matter to improve aggregation

## The Economic Benefits of Soil Health

Investing in soil health provides multiple returns:
- Increased crop yields
- Reduced input costs
- Better drought and flood resilience
- Decreased erosion and nutrient runoff
- Carbon sequestration potential

## Long-term Soil Management

Soil health is built over years, not days. Develop a long-term plan that includes:
1. Regular soil testing and monitoring
2. Diverse crop rotations
3. Cover cropping during off-seasons
4. Minimal soil disturbance
5. Integrated nutrient management

Remember that healthy soil is your farm's greatest asset. By nurturing this complex ecosystem, you're investing in sustainable productivity for generations to come.`,
    category: 'soil_science',
    coverImage: 'https://images.unsplash.com/photo-1500076656116-558758c991c1',
    images: [
      'https://images.unsplash.com/photo-1464226184884-fa280b87c399',
      'https://images.unsplash.com/photo-1621113540106-0d6e3e8a39b5'
    ],
    author: 'Dr. Priya Sharma',
    publishDate: 1680307200000, // April 1, 2023
    readTime: 11,
    tags: ['soil health', 'microbiome', 'organic matter', 'sustainable'],
    relatedArticles: ['1', '6']
  },
  {
    id: '5',
    title: 'Sustainable Crop Rotation Strategies for Small Farms',
    summary: 'Learn how to implement effective crop rotation plans that improve soil health and reduce pest pressure.',
    content: `# Sustainable Crop Rotation Strategies for Small Farms

Crop rotation is one of the oldest and most effective agricultural practices. By systematically changing the crops grown in a particular area, farmers can break pest cycles, improve soil health, and optimize nutrient use.

## Benefits of Crop Rotation

### Pest and Disease Management
- Disrupts life cycles of pests and pathogens
- Reduces buildup of crop-specific diseases
- Decreases weed pressure through varying competition

### Soil Health Improvement
- Balances nutrient use and replenishment
- Varies rooting depths to improve soil structure
- Increases soil organic matter through diverse residues

### Economic Advantages
- Spreads risk across different crops
- Reduces input costs for fertilizers and pesticides
- Improves overall farm productivity

## Planning Your Rotation

### Basic Principles
1. **Plant families** - Rotate between different plant families
2. **Root structures** - Alternate between deep and shallow-rooted crops
3. **Nutrient needs** - Follow heavy feeders with light feeders or nitrogen fixers
4. **Market considerations** - Include profitable crops that meet market demand
5. **Labor distribution** - Plan for manageable workflow throughout the season

### Common Rotation Groups

#### Group 1: Legumes
- Beans, peas, lentils, clover
- Fix nitrogen in the soil
- Generally shallow-rooted
- Low nutrient demands

#### Group 2: Brassicas
- Cabbage, broccoli, radish, mustard
- Deep tap roots that break up soil
- High nutrient demands
- Biofumigation properties

#### Group 3: Alliums
- Onions, garlic, leeks
- Shallow roots
- Moderate nutrient demands
- Strong pest-repelling properties

#### Group 4: Cucurbits
- Squash, cucumber, melons
- Moderate root depth
- High nutrient demands
- Wide spacing requirements

#### Group 5: Solanaceae
- Tomatoes, peppers, potatoes, eggplant
- Moderate to deep roots
- Very high nutrient demands
- Susceptible to many soil-borne diseases

## Sample Rotation Plans

### Three-Year Rotation (Simple)
1. Legumes (beans, peas)
2. Leafy greens and brassicas
3. Fruiting crops (tomatoes, peppers, squash)

### Four-Year Rotation (Comprehensive)
1. Legumes and green manures
2. Leaf crops (lettuce, spinach, brassicas)
3. Fruiting crops (tomatoes, peppers, eggplant)
4. Root crops (carrots, beets, onions)

## Implementation Tips

### Record Keeping
- Maintain detailed maps of what was planted where
- Document pest issues, yields, and soil conditions
- Use this data to refine future rotations

### Flexibility
- Be prepared to adjust plans based on market conditions
- Have contingency crops ready if plantings fail
- Consider weather patterns when timing transitions

### Cover Crops
- Incorporate cover crops between cash crops
- Select cover crops that complement your rotation goals
- Consider season-appropriate options (winter rye, summer buckwheat)

## Advanced Strategies

### Intercropping
Grow compatible crops together to maximize space and resources.

### Relay Cropping
Plant the next crop before harvesting the current one to extend growing seasons.

### Perennial Integration
Include perennial crops in certain fields to reduce tillage and build soil.

By implementing a thoughtful crop rotation plan, even small farms can significantly improve their sustainability, productivity, and profitability while reducing dependence on external inputs.`,
    category: 'crop_management',
    coverImage: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449',
    images: [
      'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2',
      'https://images.unsplash.com/photo-1464226184884-fa280b87c399'
    ],
    author: 'Vikram Singh',
    publishDate: 1682899200000, // May 1, 2023
    readTime: 10,
    tags: ['crop rotation', 'sustainable', 'small farms', 'soil health'],
    relatedArticles: ['1', '3']
  },
  {
    id: '6',
    title: 'Water Conservation Techniques for Drought-Prone Regions',
    summary: 'Essential strategies to manage water efficiently in areas with limited rainfall and water resources.',
    content: `# Water Conservation Techniques for Drought-Prone Regions

Water scarcity is becoming increasingly common in many agricultural regions. Farmers in drought-prone areas need effective strategies to conserve water while maintaining productive farms.

## Understanding Your Water Resources

### Water Auditing
Before implementing conservation measures, assess your current water situation:
- Identify all water sources (wells, rainwater, surface water)
- Measure current usage patterns
- Identify inefficiencies and losses
- Set realistic conservation goals

### Climate Considerations
- Analyze local rainfall patterns and seasonal variations
- Understand evapotranspiration rates in your region
- Monitor long-term climate trends
- Plan for worst-case scenarios

## Soil Management for Water Conservation

### Improving Water Retention
- Increase organic matter to improve water-holding capacity
- Maintain soil cover to reduce evaporation
- Use mulches around plants (organic or plastic)
- Implement minimum tillage practices

### Preventing Runoff
- Contour farming on sloped land
- Create swales to slow water movement
- Maintain vegetative buffer strips
- Build check dams in gullies

## Efficient Irrigation Systems

### Drip Irrigation
- Delivers water directly to plant roots
- Reduces evaporation by up to 60%
- Can be combined with mulching for maximum efficiency
- Allows precise control of water application

### Precision Sprinklers
- Low-pressure systems reduce drift and evaporation
- Timing irrigation for early morning or evening
- Using soil moisture sensors to trigger irrigation
- Implementing variable rate technology

### Subsurface Irrigation
- Virtually eliminates surface evaporation
- Reduces weed growth
- Delivers water directly to root zone
- Minimizes disease pressure

## Rainwater Harvesting

### Collection Systems
- Roof catchment from farm buildings
- Diversion structures from roads and hardscapes
- Small farm ponds and reservoirs
- Contour trenches in fields

### Storage Options
- Above-ground tanks
- Underground cisterns
- Lined ponds
- Soil profile storage through infiltration

## Crop Selection and Management

### Drought-Tolerant Varieties
- Select locally adapted, drought-resistant cultivars
- Consider native crop species
- Look for deep-rooting characteristics
- Research water use efficiency ratings

### Planting Strategies
- Adjust planting density to match water availability
- Use intercropping to maximize water utilization
- Implement deficit irrigation during less critical growth stages
- Consider dry farming techniques for appropriate crops

## Advanced Water Conservation Techniques

### Wastewater Recycling
- Treating and reusing household greywater
- Capturing and filtering agricultural runoff
- Using constructed wetlands for natural filtration
- Implementing safe water reuse protocols

### Soil Amendments
- Applying hydrogels in sandy soils
- Using biochar to improve water retention
- Incorporating clay into sandy soils
- Adding compost to increase organic matter

## Monitoring and Maintenance

### Regular System Checks
- Inspect irrigation systems for leaks
- Clean filters and emitters
- Check pressure regulators
- Verify uniform water distribution

### Technology Integration
- Soil moisture sensors
- Weather-based irrigation controllers
- Remote monitoring systems
- Evapotranspiration modeling

By implementing these water conservation techniques, farmers in drought-prone regions can build resilience against water scarcity while maintaining productive and sustainable agricultural operations.`,
    category: 'irrigation',
    coverImage: 'https://images.pexels.com/photos/2449693/pexels-photo-2449693.jpeg',
    images: [
      'https://images.pexels.com/photos/1483880/pexels-photo-1483880.jpeg',
      'https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg'
    ],
    author: 'Dr. Anita Deshmukh',
    publishDate: 1685577600000, // June 1, 2023
    readTime: 12,
    tags: ['water conservation', 'drought', 'irrigation', 'sustainability'],
    relatedArticles: ['2', '4', '7']
  },
  {
    id: '7',
    title: 'Getting Started with FarmConnect: A Complete Guide',
    summary: 'Learn how to use all the features of the FarmConnect app to improve your farming operations and increase profitability.',
    content: `# Getting Started with FarmConnect: A Complete Guide

FarmConnect is a comprehensive mobile application designed to help farmers manage their operations more efficiently, connect with vendors, and access valuable resources. This guide will walk you through all the features of the app and how to make the most of them.

## Setting Up Your Account

### Creating Your Profile
When you first sign up for FarmConnect, you'll need to complete your profile:

1. **Select your user type**: Farmer, Vendor, or Consultant
2. **Complete basic information**: Name, age, contact details
3. **Add your location**: This helps personalize weather forecasts and recommendations
4. **Set up farm details**: For farmers, add information about your land, crops, and farming methods

A complete profile helps you get the most personalized experience and connects you with relevant vendors and resources.

## Navigating the Home Screen

The Home screen provides a quick overview of important information:

- **Weather forecast**: Real-time weather data for your location
- **AI recommendations**: Personalized farming advice based on your crops and conditions
- **Featured products**: Marketplace items that might interest you
- **Quick access**: Shortcuts to frequently used features

Tap on any card to access more detailed information or navigate to the corresponding section.

## Using the Marketplace

The Marketplace is where you can buy, sell, or rent agricultural products and equipment.

### Buying Products
1. Browse categories (Fertilizers, Equipment, Produce)
2. Filter by price, location, or ratings
3. View product details and seller information
4. Add items to cart and proceed to checkout

### Selling Your Products
1. Tap "Add Product" in the Marketplace section
2. Upload clear photos of your product
3. Provide detailed descriptions and pricing
4. Set availability and delivery options

### Renting Equipment
1. Browse the Equipment Rental section
2. Check availability dates
3. Review rental terms and conditions
4. Complete the booking process

Remember to rate and review your transactions to help build a trustworthy marketplace community.

## Financial Management Tools

FarmConnect offers powerful tools to track and manage your farm finances:

### Expense Tracking
1. Record all farm-related expenses by category
2. Upload receipts for documentation
3. View expense reports and trends

### Income Recording
1. Log all sales and additional income sources
2. Track payments received
3. Generate income reports

### Financial Health Assessment
The Financial Health screen provides:
- Overall financial score
- Breakdown of income stability
- Debt management metrics
- Savings and reserves analysis
- Personalized recommendations for improvement

## AI Forecasting Features

FarmConnect's AI tools help you make data-driven decisions:

### Weather Forecasting
- Access 7-day detailed weather forecasts
- View precipitation probabilities
- Plan farm activities around weather conditions

### Crop Recommendations
- Receive suggestions for suitable crops based on your soil and climate
- View expected yields and market prices
- Get planting and harvesting timing recommendations

### Market Price Predictions
- See forecasted prices for common crops
- Identify optimal selling times
- Plan your crop selection based on market trends

## E-Learning Resources

The E-Learning section provides educational content to improve your farming knowledge:

- **Articles**: In-depth information on various farming topics
- **Categories**: Browse content by subject area
- **Bookmarking**: Save articles to read later
- **Sharing**: Send useful information to other farmers

## Community Features

Connect with other farmers and agricultural experts:

### Farmer Network
- Join groups based on location or farming interests
- Participate in discussions
- Share experiences and solutions

### Chat Support
- Get answers to your farming questions
- Connect with agricultural experts
- Receive timely advice during critical situations

## Document Management

Keep all your important farming documents organized:

- **Contracts**: Create and manage farming contracts
- **Leases**: Store land lease agreements
- **Government Schemes**: Access and apply for agricultural programs
- **Insurance**: Manage farm insurance policies

## Tips for Getting the Most from FarmConnect

1. **Complete your profile** for personalized recommendations
2. **Update your farm data** regularly for accurate AI forecasts
3. **Track all financial transactions** for comprehensive reports
4. **Participate in the community** to learn from other farmers
5. **Explore the e-learning section** to enhance your knowledge
6. **Use the AI tools** before making major farming decisions
7. **Back up important documents** in the document management section

By fully utilizing all the features of FarmConnect, you can streamline your farming operations, make better decisions, and ultimately increase your farm's productivity and profitability.`,
    category: 'app_guide',
    coverImage: 'https://images.pexels.com/photos/1072824/pexels-photo-1072824.jpeg',
    images: [
      'https://images.pexels.com/photos/1112080/pexels-photo-1112080.jpeg',
      'https://images.pexels.com/photos/5935794/pexels-photo-5935794.jpeg'
    ],
    author: 'FarmConnect Team',
    publishDate: 1688256000000, // July 1, 2023
    readTime: 15,
    tags: ['farmconnect', 'app guide', 'farming technology', 'digital agriculture'],
    relatedArticles: ['1', '2', '3']
  }
];
