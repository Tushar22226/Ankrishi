import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import LoadingQuote from '../../components/LoadingQuote';

// Farm information content
const farmInformation = {
  buyingProcess: {
    title: 'How Farms are Bought/Sold in India',
    content: [
      {
        heading: 'Agricultural Land Transfer Process',
        text: 'In India, buying and selling agricultural land involves several steps and is governed by state-specific laws. The process typically includes property verification, agreement preparation, payment of stamp duty, and registration at the local Sub-Registrar office.'
      },
      {
        heading: 'State-Specific Regulations',
        text: 'Each state in India has different laws regarding agricultural land. Some states restrict the sale of agricultural land to non-farmers or have ceiling limits on land ownership. Always check local regulations before proceeding.'
      },
      {
        heading: 'Land Ceiling Acts',
        text: 'Most states have Land Ceiling Acts that limit how much agricultural land an individual or family can own. These limits vary by state and land classification.'
      },
      {
        heading: 'Market Rates',
        text: 'Land prices vary significantly based on location, soil quality, irrigation facilities, and proximity to urban areas. The government publishes "Circle Rates" or "Ready Reckoner Rates" which establish minimum values for property transactions.'
      },
      {
        heading: 'Intermediaries',
        text: 'Property dealers and brokers often facilitate farm transactions. Their commission typically ranges from 1-2% of the property value. Always verify their credentials before engaging their services.'
      }
    ]
  },
  documentsRequired: {
    title: 'Documents Required',
    content: [
      {
        heading: 'Essential Documents',
        text: 'Original Sale Deed, Record of Rights (RTC/Patta/Jamabandi), Land Tax Receipts, Encumbrance Certificate, Approved Layout Plan, and NOC from local authorities.'
      },
      {
        heading: '7/12 Extract',
        text: 'In many states, the 7/12 Extract (also called Record of Rights, RTC, or Patta) is a crucial document that shows ownership, area, land use, crops grown, and any loans or encumbrances on the property.'
      },
      {
        heading: 'Land Conversion',
        text: 'If you plan to use agricultural land for non-agricultural purposes, you need to obtain land conversion approval from the revenue department before purchase.'
      },
      {
        heading: 'Legal Verification',
        text: 'Have a lawyer verify property documents for at least 30 years back to ensure clear title and absence of disputes. Check for any pending litigation on the property.'
      },
      {
        heading: 'Tax Considerations',
        text: 'Agricultural income is exempt from income tax, but you must maintain proper documentation to prove genuine agricultural use. Capital gains tax applies when selling agricultural land located within specified urban areas.'
      }
    ]
  },
  rights: {
    title: 'Your Rights',
    content: [
      {
        heading: 'Right to Fair Compensation',
        text: 'Under the Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013, landowners are entitled to fair compensation if their land is acquired for public purposes.'
      },
      {
        heading: 'Protection Against Forced Eviction',
        text: 'No one can be forcibly evicted from their legally owned land without due process of law and proper compensation.'
      },
      {
        heading: 'Right to Information',
        text: 'You have the right to access all public records related to your land through the Right to Information Act, 2005.'
      },
      {
        heading: 'Ancestral Property Rights',
        text: 'The Hindu Succession (Amendment) Act, 2005 grants equal rights to daughters in ancestral property, including agricultural land.'
      },
      {
        heading: 'Tribal Land Rights',
        text: 'The Scheduled Tribes and Other Traditional Forest Dwellers (Recognition of Forest Rights) Act, 2006 protects the land rights of tribal communities and forest dwellers.'
      }
    ]
  },
  scamPrevention: {
    title: 'Avoiding Scams',
    content: [
      {
        heading: 'Common Scams',
        text: 'Beware of duplicate property papers, impersonation of owners, selling of disputed properties, and collecting advance payments without proper documentation.'
      },
      {
        heading: 'Due Diligence',
        text: 'Always verify the seller\'s identity, check property documents with government records, and visit the property personally before making any payment.'
      },
      {
        heading: 'Legal Recourse',
        text: 'If scammed, file a police complaint immediately, approach the civil court for property disputes, and contact the Consumer Forum if a builder or agent is involved.'
      },
      {
        heading: 'Digital Verification',
        text: 'Many states now offer online verification of land records. Use these government portals to cross-check property details.'
      },
      {
        heading: 'Escrow Accounts',
        text: 'Consider using escrow services for large transactions to ensure that your money is released to the seller only after all conditions of the sale are met.'
      }
    ]
  },
  landDisputes: {
    title: 'Land Disputes',
    content: [
      {
        heading: 'Boundary Disputes',
        text: 'Common disputes involve unclear property boundaries. Always insist on a proper land survey before purchase and verify boundaries with neighboring properties.'
      },
      {
        heading: 'Title Disputes',
        text: 'These arise when multiple parties claim ownership of the same property. Title insurance, though not common in India, can protect buyers from such issues.'
      },
      {
        heading: 'Inheritance Disputes',
        text: 'Conflicts among family members over inherited agricultural land are common. Ensure all legal heirs have given consent to the sale.'
      },
      {
        heading: 'Legal Remedies',
        text: 'Land disputes can be resolved through civil courts, revenue courts, or alternative dispute resolution mechanisms like mediation and arbitration.'
      },
      {
        heading: 'Possession Issues',
        text: 'If someone wrongfully occupies your land, you can file for a "suit for possession" in the civil court or approach the revenue authorities depending on the nature of the dispute.'
      }
    ]
  }
};

// Information categories
const infoCategories = [
  { id: 'buyingProcess', name: 'Buying Process' },
  { id: 'documentsRequired', name: 'Documents Required' },
  { id: 'rights', name: 'Your Rights' },
  { id: 'scamPrevention', name: 'Avoiding Scams' },
  { id: 'landDisputes', name: 'Land Disputes' },
];

const FarmBuySellScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('buyingProcess');
  const [activeTab, setActiveTab] = useState('info');

  // Load content on component mount
  useEffect(() => {
    loadContent();
  }, []);

  // Load content
  const loadContent = async () => {
    try {
      setLoading(true);

      // Simulate loading time
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading content:', error);
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Get current information category
  const getCurrentCategory = () => {
    return farmInformation[activeCategory as keyof typeof farmInformation];
  };

  // Render information section
  const renderInformationSection = () => {
    const category = getCurrentCategory();

    return (
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>{category.title}</Text>

        {category.content.map((item, index) => (
          <Card key={index} style={styles.infoCard}>
            <View style={styles.infoCardContent}>
              <Text style={styles.infoHeading}>{item.heading}</Text>
              <Text style={styles.infoText}>{item.text}</Text>
            </View>
          </Card>
        ))}
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading properties...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {infoCategories.map((category) => {
            // Define icons for each category
            let iconName = '';
            switch(category.id) {
              case 'buyingProcess':
                iconName = 'business-outline';
                break;
              case 'documentsRequired':
                iconName = 'document-text-outline';
                break;
              case 'rights':
                iconName = 'shield-checkmark-outline';
                break;
              case 'scamPrevention':
                iconName = 'alert-circle-outline';
                break;
              case 'landDisputes':
                iconName = 'hammer-outline';
                break;
              default:
                iconName = 'information-circle-outline';
            }

            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  activeCategory === category.id && styles.activeCategoryButton,
                ]}
                onPress={() => setActiveCategory(category.id)}
              >
                <Ionicons
                  name={iconName}
                  size={22}
                  color={activeCategory === category.id ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.categoryButtonText,
                    activeCategory === category.id && styles.activeCategoryButtonText,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {renderInformationSection()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  headerRight: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesWrapper: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingVertical: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoriesContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceLight,
    marginRight: spacing.sm,
    minWidth: 120,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  activeCategoryButton: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  categoryButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  activeCategoryButtonText: {
    color: colors.primary,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  infoContainer: {
    marginBottom: spacing.xl,
  },
  infoTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  infoCard: {
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoCardContent: {
    padding: spacing.md,
  },
  infoHeading: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});

export default FarmBuySellScreen;
