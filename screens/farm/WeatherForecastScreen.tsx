import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import Card from '../../components/Card';
import { useAuth } from '../../context/AuthContext';

// Mock weather data
const mockWeatherData = {
  current: {
    temp: 28,
    humidity: 65,
    windSpeed: 12,
    description: 'Partly Cloudy',
    icon: 'partly-sunny',
  },
  forecast: [
    {
      day: 'Today',
      date: new Date(),
      tempMax: 30,
      tempMin: 22,
      description: 'Partly Cloudy',
      icon: 'partly-sunny',
      precipitation: 10,
      humidity: 65,
      windSpeed: 12,
    },
    {
      day: 'Tomorrow',
      date: new Date(Date.now() + 86400000),
      tempMax: 32,
      tempMin: 24,
      description: 'Sunny',
      icon: 'sunny',
      precipitation: 0,
      humidity: 60,
      windSpeed: 10,
    },
    {
      day: 'Wednesday',
      date: new Date(Date.now() + 86400000 * 2),
      tempMax: 29,
      tempMin: 23,
      description: 'Cloudy',
      icon: 'cloudy',
      precipitation: 20,
      humidity: 70,
      windSpeed: 15,
    },
    {
      day: 'Thursday',
      date: new Date(Date.now() + 86400000 * 3),
      tempMax: 27,
      tempMin: 21,
      description: 'Rain',
      icon: 'rainy',
      precipitation: 80,
      humidity: 85,
      windSpeed: 18,
    },
    {
      day: 'Friday',
      date: new Date(Date.now() + 86400000 * 4),
      tempMax: 26,
      tempMin: 20,
      description: 'Thunderstorm',
      icon: 'thunderstorm',
      precipitation: 90,
      humidity: 90,
      windSpeed: 25,
    },
    {
      day: 'Saturday',
      date: new Date(Date.now() + 86400000 * 5),
      tempMax: 28,
      tempMin: 22,
      description: 'Partly Cloudy',
      icon: 'partly-sunny',
      precipitation: 30,
      humidity: 75,
      windSpeed: 14,
    },
    {
      day: 'Sunday',
      date: new Date(Date.now() + 86400000 * 6),
      tempMax: 31,
      tempMin: 24,
      description: 'Sunny',
      icon: 'sunny',
      precipitation: 0,
      humidity: 55,
      windSpeed: 8,
    },
  ],
  farmingAdvice: [
    {
      title: 'Irrigation Planning',
      description: 'With high temperatures expected in the next few days, consider irrigating your crops early in the morning or late in the evening to minimize water loss due to evaporation.',
      icon: 'water',
    },
    {
      title: 'Weather Alert',
      description: 'Thunderstorms expected on Friday. Secure any loose equipment and consider postponing any planned spraying activities.',
      icon: 'warning',
    },
    {
      title: 'Crop Protection',
      description: 'Increased humidity levels may promote fungal diseases. Monitor your crops closely and consider preventive fungicide application if necessary.',
      icon: 'leaf',
    },
  ],
};

const WeatherForecastScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);
  
  useEffect(() => {
    // In a real app, we would fetch weather data from an API
    // For now, let's use mock data
    setTimeout(() => {
      setWeatherData(mockWeatherData);
      setLoading(false);
    }, 1000);
  }, []);
  
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading weather data...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Weather Forecast</Text>
      </View>
      
      <ScrollView style={styles.scrollContainer}>
        {/* Current Weather */}
        <Card style={styles.currentWeatherCard}>
          <View style={styles.currentWeatherContent}>
            <View style={styles.currentWeatherInfo}>
              <Text style={styles.locationText}>
                {userProfile?.location?.city || 'Pune'}, {userProfile?.location?.state || 'Maharashtra'}
              </Text>
              <Text style={styles.temperatureText}>{weatherData.current.temp}°C</Text>
              <Text style={styles.weatherDescription}>{weatherData.current.description}</Text>
              
              <View style={styles.weatherDetails}>
                <View style={styles.weatherDetailItem}>
                  <Ionicons name="water" size={16} color={colors.textSecondary} />
                  <Text style={styles.weatherDetailText}>{weatherData.current.humidity}%</Text>
                </View>
                
                <View style={styles.weatherDetailItem}>
                  <Ionicons name="speedometer" size={16} color={colors.textSecondary} />
                  <Text style={styles.weatherDetailText}>{weatherData.current.windSpeed} km/h</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.weatherIconContainer}>
              <Ionicons name={weatherData.current.icon} size={80} color={colors.primary} />
            </View>
          </View>
        </Card>
        
        {/* 7-Day Forecast */}
        <Card style={styles.forecastCard}>
          <Text style={styles.sectionTitle}>7-Day Forecast</Text>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.daysContainer}
          >
            {weatherData.forecast.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayItem,
                  selectedDay === index && styles.selectedDayItem,
                ]}
                onPress={() => setSelectedDay(index)}
              >
                <Text
                  style={[
                    styles.dayText,
                    selectedDay === index && styles.selectedDayText,
                  ]}
                >
                  {day.day}
                </Text>
                <Text
                  style={[
                    styles.dateText,
                    selectedDay === index && styles.selectedDayText,
                  ]}
                >
                  {formatDate(day.date)}
                </Text>
                
                <Ionicons
                  name={day.icon}
                  size={24}
                  color={selectedDay === index ? colors.white : colors.primary}
                  style={styles.dayIcon}
                />
                
                <Text
                  style={[
                    styles.tempText,
                    selectedDay === index && styles.selectedDayText,
                  ]}
                >
                  {day.tempMax}°
                </Text>
                <Text
                  style={[
                    styles.tempMinText,
                    selectedDay === index && styles.selectedDayTextLight,
                  ]}
                >
                  {day.tempMin}°
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Selected Day Details */}
          <View style={styles.selectedDayDetails}>
            <View style={styles.selectedDayHeader}>
              <Text style={styles.selectedDayTitle}>
                {weatherData.forecast[selectedDay].day} • {formatDate(weatherData.forecast[selectedDay].date)}
              </Text>
              <Text style={styles.selectedDayDescription}>
                {weatherData.forecast[selectedDay].description}
              </Text>
            </View>
            
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Ionicons name="thermometer" size={24} color={colors.primary} />
                <Text style={styles.detailLabel}>Temperature</Text>
                <Text style={styles.detailValue}>
                  {weatherData.forecast[selectedDay].tempMin}° - {weatherData.forecast[selectedDay].tempMax}°C
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <Ionicons name="water" size={24} color={colors.primary} />
                <Text style={styles.detailLabel}>Humidity</Text>
                <Text style={styles.detailValue}>
                  {weatherData.forecast[selectedDay].humidity}%
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <Ionicons name="rainy" size={24} color={colors.primary} />
                <Text style={styles.detailLabel}>Precipitation</Text>
                <Text style={styles.detailValue}>
                  {weatherData.forecast[selectedDay].precipitation}%
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <Ionicons name="speedometer" size={24} color={colors.primary} />
                <Text style={styles.detailLabel}>Wind Speed</Text>
                <Text style={styles.detailValue}>
                  {weatherData.forecast[selectedDay].windSpeed} km/h
                </Text>
              </View>
            </View>
          </View>
        </Card>
        
        {/* Farming Advice */}
        <Card style={styles.adviceCard}>
          <Text style={styles.sectionTitle}>Farming Advice</Text>
          
          {weatherData.farmingAdvice.map((advice, index) => (
            <View key={index} style={styles.adviceItem}>
              <View style={styles.adviceIconContainer}>
                <Ionicons name={advice.icon} size={24} color={colors.white} />
              </View>
              
              <View style={styles.adviceContent}>
                <Text style={styles.adviceTitle}>{advice.title}</Text>
                <Text style={styles.adviceDescription}>{advice.description}</Text>
              </View>
            </View>
          ))}
          
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => navigation.navigate('AIForecast')}
          >
            <Text style={styles.aiButtonText}>View AI-Powered Crop Recommendations</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </Card>
        
        <View style={styles.bottomSpacing} />
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
  },
  loadingText: {
    marginTop: spacing.medium,
    fontSize: typography.fontSizeRegular,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.medium,
    paddingTop: spacing.large,
    paddingBottom: spacing.medium,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: spacing.medium,
  },
  title: {
    fontSize: typography.fontSizeLarge,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  scrollContainer: {
    flex: 1,
    padding: spacing.medium,
  },
  currentWeatherCard: {
    marginBottom: spacing.medium,
  },
  currentWeatherContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentWeatherInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: typography.fontSizeRegular,
    color: colors.textSecondary,
    marginBottom: spacing.small,
  },
  temperatureText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  weatherDescription: {
    fontSize: typography.fontSizeMedium,
    color: colors.textPrimary,
    marginBottom: spacing.small,
  },
  weatherDetails: {
    flexDirection: 'row',
  },
  weatherDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.medium,
  },
  weatherDetailText: {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  weatherIconContainer: {
    padding: spacing.medium,
  },
  forecastCard: {
    marginBottom: spacing.medium,
  },
  sectionTitle: {
    fontSize: typography.fontSizeMedium,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.medium,
  },
  daysContainer: {
    flexDirection: 'row',
    marginBottom: spacing.medium,
  },
  dayItem: {
    alignItems: 'center',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    marginRight: spacing.small,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 80,
  },
  selectedDayItem: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayText: {
    fontSize: typography.fontSizeRegular,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  dateText: {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
    marginBottom: spacing.small,
  },
  selectedDayText: {
    color: colors.white,
  },
  selectedDayTextLight: {
    color: colors.white,
    opacity: 0.8,
  },
  dayIcon: {
    marginBottom: spacing.small,
  },
  tempText: {
    fontSize: typography.fontSizeRegular,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  tempMinText: {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
  },
  selectedDayDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.medium,
  },
  selectedDayHeader: {
    marginBottom: spacing.medium,
  },
  selectedDayTitle: {
    fontSize: typography.fontSizeMedium,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  selectedDayDescription: {
    fontSize: typography.fontSizeRegular,
    color: colors.textSecondary,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    width: '50%',
    paddingRight: spacing.medium,
    marginBottom: spacing.medium,
  },
  detailLabel: {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: typography.fontSizeRegular,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  adviceCard: {
    marginBottom: spacing.medium,
  },
  adviceItem: {
    flexDirection: 'row',
    marginBottom: spacing.medium,
  },
  adviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.medium,
  },
  adviceContent: {
    flex: 1,
  },
  adviceTitle: {
    fontSize: typography.fontSizeRegular,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  adviceDescription: {
    fontSize: typography.fontSizeRegular,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.medium,
    paddingVertical: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  aiButtonText: {
    fontSize: typography.fontSizeRegular,
    color: colors.primary,
    marginRight: spacing.small,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default WeatherForecastScreen;
