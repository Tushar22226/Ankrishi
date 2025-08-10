import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';

// Emergency helpline numbers
const HELPLINES = [
  {
    id: '1',
    name: 'Kisan Call Center',
    number: '1800-180-1551',
    description: '24/7 agricultural advisory services',
    icon: 'call',
  },
  {
    id: '2',
    name: 'Farmer Suicide Prevention Helpline',
    number: '1800-233-4357',
    description: 'Immediate mental health support',
    icon: 'heart',
  },
  {
    id: '3',
    name: 'Agricultural Debt Counseling',
    number: '1800-425-1110',
    description: 'Financial advice for farmers in debt',
    icon: 'cash',
  },
  {
    id: '4',
    name: 'Disaster Management Helpline',
    number: '1070',
    description: 'Support during natural disasters',
    icon: 'warning',
  },
];

// Self-assessment questions
const ASSESSMENT_QUESTIONS = [
  {
    id: '1',
    question: 'Have you been feeling overwhelmed by your financial situation?',
    options: ['Not at all', 'Sometimes', 'Often', 'Almost always'],
  },
  {
    id: '2',
    question: 'Do you have trouble sleeping due to worry about your farm or finances?',
    options: ['Not at all', 'Sometimes', 'Often', 'Almost always'],
  },
  {
    id: '3',
    question: 'Have you been feeling hopeless about the future of your farming?',
    options: ['Not at all', 'Sometimes', 'Often', 'Almost always'],
  },
  {
    id: '4',
    question: 'Do you feel isolated or that no one understands your challenges?',
    options: ['Not at all', 'Sometimes', 'Often', 'Almost always'],
  },
  {
    id: '5',
    question: 'Have you had thoughts that life is not worth living?',
    options: ['Not at all', 'Sometimes', 'Often', 'Almost always'],
  },
];

// Success stories
const SUCCESS_STORIES = [
  {
    id: '1',
    farmerName: 'Rajesh Patel',
    location: 'Gujarat',
    title: 'From Debt to Prosperity',
    summary: 'Overcame ₹5 lakh debt through crop diversification and community support',
    fullStory: 'After facing crop failure for two consecutive seasons, I was in debt of over ₹5 lakhs and saw no way out. Through the ankrishi app, I connected with agricultural experts who helped me diversify my crops and implement water-saving techniques. The community support feature connected me with other farmers facing similar challenges, and together we formed a cooperative to share equipment and negotiate better prices. Within two years, I cleared my debt and now run a profitable farm with multiple revenue streams.',
  },
  {
    id: '2',
    farmerName: 'Lakshmi Devi',
    location: 'Karnataka',
    title: 'Single Mother Builds Sustainable Farm',
    summary: 'Created thriving organic farm after losing husband to suicide',
    fullStory: 'When I lost my husband to suicide due to farm debt, I was left alone with two children and a failing farm. Through government schemes I discovered on ankrishi, I received training in organic farming techniques. The app\'s financial planning tools helped me budget effectively and apply for a low-interest loan. I started with just half an acre of organic vegetables and now manage five acres with a direct-to-consumer model that gives me stable income. My story shows that even in the darkest times, there is hope for a new beginning.',
  },
  {
    id: '3',
    farmerName: 'Gurpreet Singh',
    location: 'Punjab',
    title: 'Technology Transformation',
    summary: 'Used AI forecasting to prevent losses and maximize profits',
    fullStory: 'For generations, my family followed traditional farming methods, but we were increasingly affected by changing climate patterns and market volatility. After three years of losses, I was considering selling our ancestral land. The AI forecasting tools on FarmConnect helped me time my planting and harvesting to maximize yields and get the best market prices. The risk assessment feature warned me about potential pest outbreaks, saving my crop. By embracing technology while maintaining sustainable practices, I\'ve increased my income by 40% and now help other farmers in my village adopt similar approaches.',
  },
];

const CrisisSupportScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('helplines');
  const [assessmentAnswers, setAssessmentAnswers] = useState<number[]>(Array(ASSESSMENT_QUESTIONS.length).fill(-1));
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [expandedStory, setExpandedStory] = useState<string | null>(null);

  // Handle calling a helpline
  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  // Handle selecting an assessment answer
  const handleSelectAnswer = (questionIndex: number, optionIndex: number) => {
    const newAnswers = [...assessmentAnswers];
    newAnswers[questionIndex] = optionIndex;
    setAssessmentAnswers(newAnswers);

    // Check if assessment is complete
    if (!newAnswers.includes(-1)) {
      setAssessmentComplete(true);
    }
  };

  // Calculate assessment result
  const calculateAssessmentResult = () => {
    if (!assessmentComplete) return null;

    const score = assessmentAnswers.reduce((sum, answer) => sum + answer, 0);
    const maxScore = ASSESSMENT_QUESTIONS.length * 3; // 3 is the max score per question

    if (score >= maxScore * 0.7) {
      return {
        level: 'high',
        message: 'Your responses indicate you may be experiencing significant distress. Please consider reaching out to a mental health professional or calling one of our helplines immediately.',
        action: 'Call Helpline Now',
      };
    } else if (score >= maxScore * 0.4) {
      return {
        level: 'medium',
        message: 'Your responses suggest you are experiencing some challenges. Consider talking to someone you trust or exploring the resources available in the app.',
        action: 'View Resources',
      };
    } else {
      return {
        level: 'low',
        message: 'Your responses suggest you are managing well. Continue to practice self-care and remember that support is available if you need it in the future.',
        action: 'Explore Community',
      };
    }
  };

  // Handle assessment result action
  const handleAssessmentAction = () => {
    const result = calculateAssessmentResult();
    if (!result) return;

    if (result.level === 'high') {
      setActiveTab('helplines');
    } else if (result.level === 'medium') {
      // Navigate to resources
      Alert.alert('Resources', 'This would navigate to mental health resources');
    } else {
      // Navigate to community
      navigation.navigate('FarmerNetwork' as never);
    }
  };

  // Reset assessment
  const resetAssessment = () => {
    setAssessmentAnswers(Array(ASSESSMENT_QUESTIONS.length).fill(-1));
    setAssessmentComplete(false);
  };

  // Toggle expanded story
  const toggleExpandStory = (storyId: string) => {
    if (expandedStory === storyId) {
      setExpandedStory(null);
    } else {
      setExpandedStory(storyId);
    }
  };

  // Render helplines tab
  const renderHelplinesTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabDescription}>
        If you are feeling overwhelmed or in crisis, help is available 24/7. These helplines are staffed by trained professionals who understand the unique challenges farmers face.
      </Text>

      {HELPLINES.map((helpline) => (
        <Card key={helpline.id} style={styles.helplineCard}>
          <View style={styles.helplineContent}>
            <View style={styles.helplineInfo}>
              <Text style={styles.helplineName}>{helpline.name}</Text>
              <Text style={styles.helplineNumber}>{helpline.number}</Text>
              <Text style={styles.helplineDescription}>{helpline.description}</Text>
            </View>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleCall(helpline.number)}
            >
              <Ionicons name={helpline.icon as any} size={24} color={colors.white} />
            </TouchableOpacity>
          </View>
        </Card>
      ))}

      <View style={styles.emergencyContainer}>
        <Ionicons name="warning" size={24} color={colors.error} />
        <Text style={styles.emergencyText}>
          If you or someone you know is in immediate danger, please call emergency services at <Text style={styles.emergencyNumber}>112</Text> right away.
        </Text>
      </View>
    </View>
  );

  // Render assessment tab
  const renderAssessmentTab = () => {
    const result = assessmentComplete ? calculateAssessmentResult() : null;

    return (
      <View style={styles.tabContent}>
        <Text style={styles.tabDescription}>
          This confidential self-assessment can help you understand your current mental wellbeing. Your responses are not stored or shared with anyone.
        </Text>

        {!assessmentComplete ? (
          <>
            {ASSESSMENT_QUESTIONS.map((question, questionIndex) => (
              <Card key={question.id} style={styles.questionCard}>
                <Text style={styles.questionText}>{question.question}</Text>
                <View style={styles.optionsContainer}>
                  {question.options.map((option, optionIndex) => (
                    <TouchableOpacity
                      key={optionIndex}
                      style={[
                        styles.optionButton,
                        assessmentAnswers[questionIndex] === optionIndex && styles.selectedOption,
                      ]}
                      onPress={() => handleSelectAnswer(questionIndex, optionIndex)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          assessmentAnswers[questionIndex] === optionIndex && styles.selectedOptionText,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Card>
            ))}
          </>
        ) : (
          <Card style={[
            styles.resultCard,
            result?.level === 'high' && styles.highRiskResult,
            result?.level === 'medium' && styles.mediumRiskResult,
            result?.level === 'low' && styles.lowRiskResult,
          ]}>
            <Text style={styles.resultTitle}>
              {result?.level === 'high' && 'Please Reach Out For Support'}
              {result?.level === 'medium' && 'Consider Seeking Support'}
              {result?.level === 'low' && 'You Are Doing Well'}
            </Text>
            <Text style={styles.resultMessage}>{result?.message}</Text>
            <View style={styles.resultActions}>
              <Button
                title={result?.action || 'Take Action'}
                onPress={handleAssessmentAction}
                style={styles.resultActionButton}
              />
              <Button
                title="Retake Assessment"
                variant="outline"
                onPress={resetAssessment}
                style={styles.resetButton}
              />
            </View>
          </Card>
        )}

        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerText}>
            This assessment is not a diagnostic tool. If you are experiencing distress, please consult with a healthcare professional.
          </Text>
        </View>
      </View>
    );
  };

  // Render stories tab
  const renderStoriesTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabDescription}>
        Read inspiring stories from farmers who have overcome challenges similar to what you might be facing. Their journeys show that recovery and success are possible.
      </Text>

      {SUCCESS_STORIES.map((story) => (
        <Card key={story.id} style={styles.storyCard}>
          <View style={styles.storyHeader}>
            <View>
              <Text style={styles.storyTitle}>{story.title}</Text>
              <Text style={styles.farmerInfo}>
                {story.farmerName} • {story.location}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => toggleExpandStory(story.id)}
            >
              <Ionicons
                name={expandedStory === story.id ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.storySummary}>{story.summary}</Text>

          {expandedStory === story.id && (
            <Text style={styles.storyFullText}>{story.fullStory}</Text>
          )}

          {expandedStory !== story.id && (
            <TouchableOpacity
              style={styles.readMoreButton}
              onPress={() => toggleExpandStory(story.id)}
            >
              <Text style={styles.readMoreText}>Read Full Story</Text>
            </TouchableOpacity>
          )}
        </Card>
      ))}

      <View style={styles.shareContainer}>
        <Text style={styles.sharePrompt}>
          Do you have a success story to share? Your journey could inspire others.
        </Text>
        <Button
          title="Share Your Story"
          variant="outline"
          onPress={() => Alert.alert('Share Story', 'This would open a form to share your story')}
          style={styles.shareButton}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crisis Support</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'helplines' && styles.activeTab]}
          onPress={() => setActiveTab('helplines')}
        >
          <Ionicons
            name="call"
            size={20}
            color={activeTab === 'helplines' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'helplines' && styles.activeTabText,
            ]}
          >
            Helplines
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'assessment' && styles.activeTab]}
          onPress={() => setActiveTab('assessment')}
        >
          <Ionicons
            name="clipboard"
            size={20}
            color={activeTab === 'assessment' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'assessment' && styles.activeTabText,
            ]}
          >
            Self-Assessment
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'stories' && styles.activeTab]}
          onPress={() => setActiveTab('stories')}
        >
          <Ionicons
            name="book"
            size={20}
            color={activeTab === 'stories' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'stories' && styles.activeTabText,
            ]}
          >
            Success Stories
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.scrollContainer}>
        {activeTab === 'helplines' && renderHelplinesTab()}
        {activeTab === 'assessment' && renderAssessmentTab()}
        {activeTab === 'stories' && renderStoriesTab()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    ...getPlatformTopSpacing('paddingTop', 0, spacing.md),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
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
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  activeTabText: {
    color: colors.primary,
    fontFamily: typography.fontFamily.bold,
  },
  scrollContainer: {
    flex: 1,
  },
  tabContent: {
    padding: spacing.md,
  },
  tabDescription: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    lineHeight: typography.lineHeight.md,
  },
  // Helplines tab styles
  helplineCard: {
    marginBottom: spacing.md,
  },
  helplineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  helplineInfo: {
    flex: 1,
  },
  helplineName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  helplineNumber: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  helplineDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  emergencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  emergencyText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    lineHeight: typography.lineHeight.md,
  },
  emergencyNumber: {
    fontFamily: typography.fontFamily.bold,
    color: colors.error,
  },
  // Assessment tab styles
  questionCard: {
    marginBottom: spacing.md,
  },
  questionText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    lineHeight: typography.lineHeight.md,
  },
  optionsContainer: {
    flexDirection: 'column',
  },
  optionButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.lightGray,
    marginBottom: spacing.xs,
  },
  selectedOption: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  selectedOptionText: {
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  resultCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  highRiskResult: {
    backgroundColor: colors.errorLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  mediumRiskResult: {
    backgroundColor: colors.warningLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  lowRiskResult: {
    backgroundColor: colors.successLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  resultTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  resultMessage: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    lineHeight: typography.lineHeight.md,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultActionButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  resetButton: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  disclaimerContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
  },
  disclaimerText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.italic,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.sm,
  },
  // Stories tab styles
  storyCard: {
    marginBottom: spacing.md,
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  storyTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  farmerInfo: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  expandButton: {
    padding: spacing.xs,
  },
  storySummary: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: typography.lineHeight.md,
  },
  storyFullText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.md,
    marginTop: spacing.sm,
  },
  readMoreButton: {
    alignSelf: 'flex-start',
  },
  readMoreText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  shareContainer: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  sharePrompt: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: typography.lineHeight.md,
  },
  shareButton: {
    width: '80%',
  },
});

export default CrisisSupportScreen;
