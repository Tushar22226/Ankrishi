import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Article, sampleArticles } from '../../models/Article';
import Card from '../../components/Card';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import RenderHtml from 'react-native-render-html';
import Showdown from 'showdown';

const { width } = Dimensions.get('window');

const ArticleScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const articleId = route.params?.articleId;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);

  useEffect(() => {
    // In a real app, we would fetch the article from a database or API
    // For now, we'll use the sample articles
    const foundArticle = sampleArticles.find(a => a.id === articleId);

    if (foundArticle) {
      setArticle(foundArticle);

      // Find related articles
      if (foundArticle.relatedArticles && foundArticle.relatedArticles.length > 0) {
        const related = sampleArticles.filter(a =>
          foundArticle.relatedArticles?.includes(a.id) && a.id !== foundArticle.id
        );
        setRelatedArticles(related);
      } else {
        // If no related articles specified, show articles from the same category
        const sameCategoryArticles = sampleArticles.filter(a =>
          a.category === foundArticle.category && a.id !== foundArticle.id
        );
        setRelatedArticles(sameCategoryArticles.slice(0, 3));
      }
    }

    setLoading(false);
  }, [articleId]);

  const handleShare = async () => {
    if (!article) return;

    try {
      await Share.share({
        message: `Check out this article: ${article.title}\n\n${article.summary}`,
        title: article.title,
      });
    } catch (error) {
      console.error('Error sharing article:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading article...</Text>
      </View>
    );
  }

  if (!article) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color={colors.error} />
        <Text style={styles.errorText}>Article not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Cover Image */}
      <Image
        source={{ uri: article.coverImage }}
        style={styles.coverImage}
        resizeMode="cover"
      />

      {/* Article Content */}
      <View style={styles.contentContainer}>
        {/* Title and Meta */}
        <Text style={styles.title}>{article.title}</Text>
        <View style={styles.metaContainer}>
          <Text style={styles.author}>By {article.author}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.metaText}>{formatDate(article.publishDate)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.metaText}>{article.readTime} min read</Text>
            </View>
          </View>
        </View>

        {/* Summary */}
        <Text style={styles.summary}>{article.summary}</Text>

        {/* Main Content */}
        <View style={styles.markdownContainer}>
          <RenderHtml
            contentWidth={width - (spacing.lg * 2)}
            source={{ html: convertMarkdownToHtml(article.content) }}
            tagsStyles={htmlStyles}
            enableExperimentalMarginCollapsing={true}
          />
        </View>

        {/* Tags */}
        <View style={styles.tagsContainer}>
          {article.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <View style={styles.relatedContainer}>
            <Text style={styles.relatedTitle}>Related Articles</Text>
            {relatedArticles.map((relatedArticle) => (
              <TouchableOpacity
                key={relatedArticle.id}
                style={styles.relatedCard}
                onPress={() => {
                  // Navigate to the same screen with different params
                  navigation.navigate('ArticleScreen' as never, { articleId: relatedArticle.id } as never);
                }}
              >
                <Image
                  source={{ uri: relatedArticle.coverImage }}
                  style={styles.relatedImage}
                  resizeMode="cover"
                />
                <View style={styles.relatedContent}>
                  <Text style={styles.relatedArticleTitle}>{relatedArticle.title}</Text>
                  <Text style={styles.relatedSummary} numberOfLines={2}>
                    {relatedArticle.summary}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

// Convert markdown to HTML
const convertMarkdownToHtml = (markdown: string): string => {
  const converter = new Showdown.Converter();
  return converter.makeHtml(markdown);
};

// HTML styles for RenderHtml
const htmlStyles = {
  body: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 24,
  },
  h1: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  h2: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  h3: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  p: {
    marginBottom: spacing.md,
  },
  li: {
    marginBottom: spacing.xs,
  },
  bullet_list: {
    marginBottom: spacing.md,
  },
  ordered_list: {
    marginBottom: spacing.md,
  },
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
  },
  backButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
  },
  shareButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
  },
  coverImage: {
    width: '100%',
    height: 250,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  metaContainer: {
    marginBottom: spacing.lg,
  },
  author: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  metaText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  summary: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  markdownContainer: {
    marginBottom: spacing.lg,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.xl,
  },
  tag: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  tagText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  relatedContainer: {
    marginTop: spacing.lg,
  },
  relatedTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  relatedCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  relatedImage: {
    width: 100,
    height: 100,
  },
  relatedContent: {
    flex: 1,
    padding: spacing.md,
  },
  relatedArticleTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  relatedSummary: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});

export default ArticleScreen;
