import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  LayoutChangeEvent,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';

// Tab item interface
export interface TabItem {
  key: string;
  title: string;
  icon?: string;
  badge?: number;
  badgeColor?: string;
}

// TabView props interface
interface TabViewProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabKey: string) => void;
  style?: ViewStyle;
  tabStyle?: ViewStyle;
  activeTabStyle?: ViewStyle;
  tabTextStyle?: TextStyle;
  activeTabTextStyle?: TextStyle;
  indicatorStyle?: ViewStyle;
  scrollable?: boolean;
  equalWidth?: boolean;
  showBadges?: boolean;
}

const TabView: React.FC<TabViewProps> = ({
  tabs,
  activeTab,
  onTabChange,
  style,
  tabStyle,
  activeTabStyle,
  tabTextStyle,
  activeTabTextStyle,
  indicatorStyle,
  scrollable = true,
  equalWidth = false,
  showBadges = true,
}) => {
  const [tabWidths, setTabWidths] = useState<{ [key: string]: number }>({});
  const [tabPositions, setTabPositions] = useState<{ [key: string]: number }>({});
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const indicatorWidthAnim = useRef(new Animated.Value(0)).current;

  // Measure tab widths and positions
  const measureTab = (key: string, event: LayoutChangeEvent) => {
    const { width, x } = event.nativeEvent.layout;
    
    setTabWidths(prev => ({
      ...prev,
      [key]: width,
    }));
    
    setTabPositions(prev => ({
      ...prev,
      [key]: x,
    }));
  };

  // Measure container width
  const measureContainer = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  // Animate indicator when active tab changes
  useEffect(() => {
    if (tabs.length === 0 || !tabWidths[activeTab] || !tabPositions[activeTab]) return;

    // Animate indicator position
    Animated.timing(indicatorAnim, {
      toValue: tabPositions[activeTab] || 0,
      duration: 250,
      useNativeDriver: false,
    }).start();

    // Animate indicator width
    Animated.timing(indicatorWidthAnim, {
      toValue: tabWidths[activeTab] || 0,
      duration: 250,
      useNativeDriver: false,
    }).start();

    // Scroll to make active tab visible
    if (scrollViewRef.current) {
      const screenWidth = Dimensions.get('window').width;
      const tabCenter = tabPositions[activeTab] + (tabWidths[activeTab] / 2);
      const scrollTo = tabCenter - (screenWidth / 2);
      
      scrollViewRef.current.scrollTo({
        x: Math.max(0, scrollTo),
        animated: true,
      });
    }
  }, [activeTab, tabWidths, tabPositions]);

  // Calculate tab width if equalWidth is true
  const getTabWidth = () => {
    if (!equalWidth || containerWidth === 0 || tabs.length === 0) return undefined;
    return { width: containerWidth / tabs.length };
  };

  return (
    <View style={[styles.container, style]} onLayout={measureContainer}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          !scrollable && { width: '100%' }
        ]}
        scrollEnabled={scrollable}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              getTabWidth(),
              tabStyle,
              activeTab === tab.key && styles.activeTab,
              activeTab === tab.key && activeTabStyle,
            ]}
            onPress={() => onTabChange(tab.key)}
            onLayout={(e) => measureTab(tab.key, e)}
          >
            <View style={styles.tabContent}>
              {tab.icon && (
                <Ionicons
                  name={tab.icon as any}
                  size={18}
                  color={activeTab === tab.key ? colors.primary : colors.textSecondary}
                  style={styles.tabIcon}
                />
              )}
              <Text
                style={[
                  styles.tabText,
                  tabTextStyle,
                  activeTab === tab.key && styles.activeTabText,
                  activeTab === tab.key && activeTabTextStyle,
                ]}
                numberOfLines={1}
              >
                {tab.title}
              </Text>
              {showBadges && tab.badge !== undefined && tab.badge > 0 && (
                <View style={[styles.badge, tab.badgeColor ? { backgroundColor: tab.badgeColor } : null]}>
                  <Text style={styles.badgeText}>{tab.badge}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
        
        {/* Animated indicator */}
        <Animated.View
          style={[
            styles.indicator,
            indicatorStyle,
            {
              left: indicatorAnim,
              width: indicatorWidthAnim,
            },
          ]}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  scrollContent: {
    flexGrow: 1,
  },
  tab: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTab: {
    // Active tab styling is handled by the indicator
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabIcon: {
    marginRight: spacing.xs,
  },
  tabText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  badge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  badgeText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
  },
});

export default TabView;
