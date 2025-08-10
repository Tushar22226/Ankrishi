#!/bin/bash

# Script to add Android-specific top margin to all screens
# This script will:
# 1. Add the import for getPlatformTopSpacing
# 2. Update the header/container styles to use platform-specific spacing

# Set the root directory to the project root
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
echo "Working from directory: $ROOT_DIR"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Adding Android-specific top margin to all screens...${NC}"

# Find all screen files
SCREEN_FILES=$(find screens -name "*.tsx")

# Loop through each file
for file in $SCREEN_FILES; do
  echo -e "${YELLOW}Processing ${file}...${NC}"

  # Check if the file already has the import
  if grep -q "getPlatformTopSpacing" "$file"; then
    echo -e "${GREEN}Import already exists in ${file}${NC}"
  else
    # Add the import after the last import statement
    LAST_IMPORT=$(grep -n "import .* from .*;" "$file" | tail -1 | cut -d: -f1)
    if [ ! -z "$LAST_IMPORT" ]; then
      sed -i "${LAST_IMPORT}a import { getPlatformTopSpacing } from '../../utils/platformUtils';" "$file"
      echo -e "${GREEN}Added import to ${file}${NC}"
    else
      echo -e "${RED}Could not find import statements in ${file}${NC}"
    fi
  fi

  # Check if the file has a header or container style
  if grep -q "header: {" "$file" || grep -q "container: {" "$file" || grep -q "contentContainer: {" "$file"; then
    # Look for header style
    if grep -q "header: {" "$file"; then
      # Check if it already has platform-specific padding
      if grep -q "getPlatformTopSpacing.*paddingTop" "$file"; then
        echo -e "${GREEN}Header already has platform-specific padding in ${file}${NC}"
      else
        # Add platform-specific padding to header
        HEADER_LINE=$(grep -n "header: {" "$file" | head -1 | cut -d: -f1)
        if [ ! -z "$HEADER_LINE" ]; then
          NEXT_LINE=$((HEADER_LINE + 1))
          sed -i "${NEXT_LINE}a \ \ \ \ ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl)," "$file"
          echo -e "${GREEN}Added platform-specific padding to header in ${file}${NC}"
        fi
      fi
    fi

    # Look for contentContainer style
    if grep -q "contentContainer: {" "$file"; then
      # Check if it already has platform-specific padding
      if grep -q "getPlatformTopSpacing.*paddingTop" "$file"; then
        echo -e "${GREEN}ContentContainer already has platform-specific padding in ${file}${NC}"
      else
        # Add platform-specific padding to contentContainer
        CONTAINER_LINE=$(grep -n "contentContainer: {" "$file" | head -1 | cut -d: -f1)
        if [ ! -z "$CONTAINER_LINE" ]; then
          NEXT_LINE=$((CONTAINER_LINE + 1))
          sed -i "${NEXT_LINE}a \ \ \ \ ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl)," "$file"
          echo -e "${GREEN}Added platform-specific padding to contentContainer in ${file}${NC}"
        fi
      fi
    fi

    # Look for container style if no contentContainer
    if ! grep -q "contentContainer: {" "$file" && grep -q "container: {" "$file"; then
      # Check if it already has platform-specific padding
      if grep -q "getPlatformTopSpacing.*paddingTop" "$file"; then
        echo -e "${GREEN}Container already has platform-specific padding in ${file}${NC}"
      else
        # Add platform-specific padding to container
        CONTAINER_LINE=$(grep -n "container: {" "$file" | head -1 | cut -d: -f1)
        if [ ! -z "$CONTAINER_LINE" ]; then
          NEXT_LINE=$((CONTAINER_LINE + 1))
          sed -i "${NEXT_LINE}a \ \ \ \ ...getPlatformTopSpacing('paddingTop', 0, spacing.md)," "$file"
          echo -e "${GREEN}Added platform-specific padding to container in ${file}${NC}"
        fi
      fi
    fi
  else
    echo -e "${YELLOW}No header or container style found in ${file}${NC}"
  fi

  echo -e "${GREEN}Finished processing ${file}${NC}"
  echo ""
done

echo -e "${GREEN}Done! Android-specific top margin added to all screens.${NC}"
