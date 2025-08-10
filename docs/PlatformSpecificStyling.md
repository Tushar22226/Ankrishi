# Platform-Specific Styling Guide

This document explains how to implement platform-specific styling in the FarmConnect app, particularly for adding extra top margin on Android devices.

## Using the Platform Utilities

We've created utility functions in `utils/platformUtils.ts` to make it easy to add platform-specific spacing. These utilities help maintain consistent styling across the app while accommodating platform differences.

### Available Utilities

1. `getTopSpacing(baseValue, androidValue)` - Returns a numeric value for spacing based on platform
2. `getPlatformTopSpacing(property, baseValue, androidValue)` - Returns a style object with the specified property
3. `withPlatformTopSpacing(baseStyles, property, baseValue, androidValue)` - Merges platform-specific spacing with existing styles

### Example Usage

#### Adding top padding to a container:

```javascript
import { getPlatformTopSpacing } from '../../utils/platformUtils';

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    ...getPlatformTopSpacing('paddingTop', spacing.xl * 1.5, spacing.xl * 2.5),
    paddingBottom: spacing.xl,
  },
});
```

#### Adding top margin to a component:

```javascript
import { getPlatformTopSpacing } from '../../utils/platformUtils';

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    ...getPlatformTopSpacing('marginTop', spacing.md, spacing.xl),
    marginBottom: spacing.lg,
  },
});
```

#### Merging with existing styles:

```javascript
import { withPlatformTopSpacing } from '../../utils/platformUtils';

const baseStyles = {
  width: '100%',
  backgroundColor: colors.white,
};

const containerStyles = withPlatformTopSpacing(
  baseStyles, 
  'marginTop', 
  spacing.md, 
  spacing.xl
);
```

## Implementation Guidelines

1. Use these utilities for any screen or component that needs different top spacing on Android
2. For screens, apply the platform-specific spacing to the main container or scroll container
3. For headers or navigation bars, consider adding extra margin/padding on Android
4. Use the theme's spacing constants (e.g., `spacing.md`, `spacing.xl`) for consistency

## Recommended Values

- For screen containers: Base value of `spacing.xl * 1.5` with Android value of `spacing.xl * 2.5`
- For headers: Base value of `spacing.md` with Android value of `spacing.xl`
- For content sections: Base value of `spacing.sm` with Android value of `spacing.md`
