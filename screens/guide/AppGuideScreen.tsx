import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../context/ThemeContext';
import { spacing, typography, borderRadius } from '../../theme';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import AppInfoService, { ScreenInfo, UIElementInfo } from '../../services/AppInfoService';

const AppGuideScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  
  // State
  const [selectedScreen, setSelectedScreen] = useState<ScreenInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    screens: ScreenInfo[];
    uiElements: { element: UIElementInfo; screen: ScreenInfo }[];
  } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get all screens from AppInfoService
  const allScreens = AppInfoService.getAllScreens();

  // Handle screen selection
  const handleScreenSelect = (screen: ScreenInfo) => {
    setSelectedScreen(screen);
    setIsDropdownOpen(false);
    setSearchQuery('');
    setSearchResults(null);
  };

  // Handle search
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    // Use AppInfoService to search for screens and UI elements
    const results = AppInfoService.search(searchQuery);
    setSearchResults(results);
    setLoading(false);
  };

  // Create styles with the current theme colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
      paddingBottom: spacing.md,
      backgroundColor: colors.white,
      borderBottomWidth: 1,
      borderBottomColor: colors.lightGray,
    },
    backButton: {
      marginRight: spacing.md,
    },
    headerTitle: {
      fontSize: typography.fontSize.lg,
      fontFamily: typography.fontFamily.bold,
      color: colors.textPrimary,
      flex: 1,
    },
    content: {
      flex: 1,
      padding: spacing.md,
    },
    dropdownContainer: {
      marginBottom: spacing.md,
    },
    dropdownButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      backgroundColor: colors.white,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.lightGray,
    },
    dropdownButtonText: {
      fontSize: typography.fontSize.md,
      fontFamily: typography.fontFamily.medium,
      color: colors.textPrimary,
    },
    dropdownList: {
      position: 'absolute',
      top: 60,
      left: 0,
      right: 0,
      backgroundColor: colors.white,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.lightGray,
      zIndex: 10,
      maxHeight: 300,
    },
    dropdownItem: {
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.lightGray,
    },
    dropdownItemText: {
      fontSize: typography.fontSize.md,
      fontFamily: typography.fontFamily.regular,
      color: colors.textPrimary,
    },
    searchContainer: {
      marginBottom: spacing.md,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.white,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.lightGray,
      paddingHorizontal: spacing.md,
    },
    searchInput: {
      flex: 1,
      height: 50,
      fontSize: typography.fontSize.md,
      fontFamily: typography.fontFamily.regular,
      color: colors.textPrimary,
    },
    searchButton: {
      padding: spacing.sm,
    },
    infoCard: {
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    screenTitle: {
      fontSize: typography.fontSize.lg,
      fontFamily: typography.fontFamily.bold,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      fontSize: typography.fontSize.md,
      fontFamily: typography.fontFamily.bold,
      color: colors.textPrimary,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    description: {
      fontSize: typography.fontSize.md,
      fontFamily: typography.fontFamily.regular,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    featureText: {
      fontSize: typography.fontSize.md,
      fontFamily: typography.fontFamily.regular,
      color: colors.textPrimary,
      marginLeft: spacing.sm,
    },
    uiElementItem: {
      marginBottom: spacing.md,
    },
    uiElementName: {
      fontSize: typography.fontSize.md,
      fontFamily: typography.fontFamily.bold,
      color: colors.textPrimary,
    },
    uiElementType: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.medium,
      color: colors.primary,
      marginBottom: spacing.xs,
    },
    uiElementDescription: {
      fontSize: typography.fontSize.md,
      fontFamily: typography.fontFamily.regular,
      color: colors.textPrimary,
    },
    uiElementPurpose: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.italic,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    noResultsContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    noResultsText: {
      fontSize: typography.fontSize.md,
      fontFamily: typography.fontFamily.medium,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    searchResultItem: {
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.lightGray,
    },
    searchResultTitle: {
      fontSize: typography.fontSize.md,
      fontFamily: typography.fontFamily.bold,
      color: colors.textPrimary,
    },
    searchResultSubtitle: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.medium,
      color: colors.textSecondary,
    },
    searchResultDescription: {
      fontSize: typography.fontSize.md,
      fontFamily: typography.fontFamily.regular,
      color: colors.textPrimary,
      marginTop: spacing.xs,
    },
  });

  // Render screen information
  const renderScreenInfo = () => {
    if (!selectedScreen) return null;

    return (
      <Card style={styles.infoCard}>
        <Text style={styles.screenTitle}>{selectedScreen.name}</Text>
        <Text style={styles.description}>{selectedScreen.description}</Text>

        <Text style={styles.sectionTitle}>Features</Text>
        {selectedScreen.features.map((feature, index) => (
          <View key={`feature-${index}`} style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>UI Elements</Text>
        {selectedScreen.uiElements.map((element, index) => (
          <View key={`element-${index}`} style={styles.uiElementItem}>
            <Text style={styles.uiElementName}>{element.name}</Text>
            <Text style={styles.uiElementType}>Type: {element.type}</Text>
            <Text style={styles.uiElementDescription}>{element.description}</Text>
            <Text style={styles.uiElementPurpose}>Purpose: {element.purpose}</Text>
          </View>
        ))}
      </Card>
    );
  };

  // Render search results
  const renderSearchResults = () => {
    if (!searchResults) return null;

    if (searchResults.screens.length === 0 && searchResults.uiElements.length === 0) {
      return (
        <View style={styles.noResultsContainer}>
          <Ionicons name="search-outline" size={48} color={colors.lightGray} />
          <Text style={styles.noResultsText}>
            No results found for "{searchQuery}". Try a different search term.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView>
        {searchResults.screens.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Screens</Text>
            {searchResults.screens.map((screen, index) => (
              <TouchableOpacity
                key={`screen-${index}`}
                style={styles.searchResultItem}
                onPress={() => handleScreenSelect(screen)}
              >
                <Text style={styles.searchResultTitle}>{screen.name}</Text>
                <Text style={styles.searchResultDescription}>{screen.description}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {searchResults.uiElements.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>UI Elements</Text>
            {searchResults.uiElements.map((item, index) => (
              <TouchableOpacity
                key={`ui-${index}`}
                style={styles.searchResultItem}
                onPress={() => handleScreenSelect(item.screen)}
              >
                <Text style={styles.searchResultTitle}>{item.element.name}</Text>
                <Text style={styles.searchResultSubtitle}>in {item.screen.name}</Text>
                <Text style={styles.searchResultDescription}>{item.element.description}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Guide</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <Text style={styles.dropdownButtonText}>
              {selectedScreen ? selectedScreen.name : 'Select a screen'}
            </Text>
            <Ionicons
              name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {isDropdownOpen && (
            <View style={styles.dropdownList}>
              <ScrollView>
                {allScreens.map((screen, index) => (
                  <TouchableOpacity
                    key={`dropdown-${index}`}
                    style={styles.dropdownItem}
                    onPress={() => handleScreenSelect(screen)}
                  >
                    <Text style={styles.dropdownItemText}>{screen.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for screens or features..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Ionicons name="search" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : searchResults ? (
          renderSearchResults()
        ) : (
          renderScreenInfo()
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AppGuideScreen;
