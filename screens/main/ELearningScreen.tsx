import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import Card from '../../components/Card';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import { useNavigation } from '@react-navigation/native';
import { Article, ArticleCategoryInfo, sampleArticles, ArticleCategory } from '../../models/Article';

const ELearningScreen = () => {
  const navigation = useNavigation();
  const [articles, setArticles] = useState<Article[]>([]);
  const [featuredArticle, setFeaturedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | null>(null);

  useEffect(() => {
    // In a real app, we would fetch articles from a database or API
    // For now, we'll use the sample articles
    loadArticles();
  }, []);

  const loadArticles = () => {
    setLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      setArticles(sampleArticles);

      // Set the first article as featured
      if (sampleArticles.length > 0) {
        setFeaturedArticle(sampleArticles[0]);
      }

      setLoading(false);
    }, 500);
  };

  const handleArticlePress = (articleId: string) => {
    navigation.navigate('ArticleScreen' as never, { articleId } as never);
  };

  const filterArticlesByCategory = (category: ArticleCategory | null) => {
    setSelectedCategory(category);
  };

  const getFilteredArticles = () => {
    if (!selectedCategory) return articles;
    return articles.filter(article => article.category === selectedCategory);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get all categories from the articles
  const getCategories = () => {
    const categories = Object.keys(ArticleCategoryInfo) as ArticleCategory[];
    return categories;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading articles...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Farming Articles</Text>
        <Text style={styles.subtitle}>Enhance your agricultural knowledge</Text>
      </View>

      {/* Featured Article */}
      {featuredArticle && (
        <TouchableOpacity
          style={styles.featuredCard}
          onPress={() => handleArticlePress(featuredArticle.id)}
          activeOpacity={0.9}
        >
          <Card>
            <Image
              source={{ uri: featuredArticle.coverImage }}
              style={styles.featuredImage}
              resizeMode="cover"
            />
            <View style={styles.featuredContent}>
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>Featured</Text>
              </View>
              <Text style={styles.featuredTitle}>{featuredArticle.title}</Text>
              <Text style={styles.featuredDescription} numberOfLines={2}>
                {featuredArticle.summary}
              </Text>
              <View style={styles.featuredMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{featuredArticle.author}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{featuredArticle.readTime} min read</Text>
                </View>
              </View>
              <View style={styles.readMoreButton}>
                <Text style={styles.readMoreButtonText}>Read Article</Text>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      )}

      {/* Article Categories */}
      <View style={styles.categoriesContainer}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          <TouchableOpacity
            style={[
              styles.categoryCard,
              !selectedCategory && styles.selectedCategoryCard
            ]}
            onPress={() => filterArticlesByCategory(null)}
          >
            <View style={[styles.categoryIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="grid" size={24} color={colors.white} />
            </View>
            <Text style={styles.categoryTitle}>All</Text>
          </TouchableOpacity>

          {getCategories().map((category) => {
            const categoryInfo = ArticleCategoryInfo[category];
            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryCard,
                  selectedCategory === category && styles.selectedCategoryCard
                ]}
                onPress={() => filterArticlesByCategory(category)}
              >
                <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color }]}>
                  <Ionicons name={categoryInfo.icon as any} size={24} color={colors.white} />
                </View>
                <Text style={styles.categoryTitle}>{categoryInfo.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Articles List */}
      <View style={styles.articlesContainer}>
        <Text style={styles.sectionTitle}>
          {selectedCategory
            ? `${ArticleCategoryInfo[selectedCategory].name} Articles`
            : 'All Articles'}
        </Text>

        {getFilteredArticles().length === 0 ? (
          <View style={styles.noArticlesContainer}>
            <Ionicons name="document-text-outline" size={60} color={colors.textSecondary} />
            <Text style={styles.noArticlesText}>No articles found in this category</Text>
          </View>
        ) : (
          getFilteredArticles().map((article) => (
            <TouchableOpacity
              key={article.id}
              style={styles.articleCard}
              onPress={() => handleArticlePress(article.id)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: article.coverImage }} style={styles.articleImage} />
              <View style={styles.articleContent}>
                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.articleDescription} numberOfLines={2}>
                  {article.summary}
                </Text>
                <View style={styles.articleMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.metaText}>{formatDate(article.publishDate)}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.metaText}>{article.readTime} min read</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* More Coming Soon */}
      <Card style={styles.comingSoonCard}>
        <Ionicons name="newspaper-outline" size={40} color={colors.primary} />
        <Text style={styles.comingSoonTitle}>More Articles Coming Soon</Text>
        <Text style={styles.comingSoonText}>
          We're constantly adding new educational content to help you improve your farming knowledge.
          Check back regularly for updates!
        </Text>
      </Card>
    </ScrollView>
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
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  header: {
    padding: spacing.md,
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  featuredCard: {
    margin: spacing.md,
  },
  featuredImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
  },
  featuredContent: {
    padding: spacing.md,
  },
  featuredBadge: {
    position: 'absolute',
    top: -160,
    right: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  featuredBadgeText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  featuredTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  featuredDescription: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  featuredMeta: {
    flexDirection: 'row',
    marginBottom: spacing.md,
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
  readMoreButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  readMoreButtonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
  },
  categoriesContainer: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  categoriesContent: {
    paddingBottom: spacing.sm,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: spacing.lg,
    width: 100,
    padding: spacing.xs,
    borderRadius: borderRadius.md,
  },
  selectedCategoryCard: {
    backgroundColor: colors.surfaceLight,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  articlesContainer: {
    padding: spacing.md,
  },
  noArticlesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  noArticlesText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  articleCard: {
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
  articleImage: {
    width: 100,
    height: 100,
  },
  articleContent: {
    flex: 1,
    padding: spacing.sm,
  },
  articleTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  articleDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  articleMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  comingSoonCard: {
    margin: spacing.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  comingSoonTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  comingSoonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default ELearningScreen;
