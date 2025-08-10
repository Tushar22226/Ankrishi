#!/bin/bash

# Ankrishi Website Deployment Script
# This script helps prepare your website for deployment

echo "🌱 Ankrishi Website Deployment Helper"
echo "======================================"

# Check if all required files exist
echo "📋 Checking required files..."

required_files=("index.html" "styles.css" "script.js" "sitemap.xml" "robots.txt" "logo.png")
missing_files=()

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -eq 0 ]; then
    echo "✅ All required files found!"
else
    echo "❌ Missing files: ${missing_files[*]}"
    echo "Please ensure all files are present before deployment."
    exit 1
fi

# Create deployment package
echo "📦 Creating deployment package..."
zip -r ankrishi-website-deploy.zip . -x "*.sh" "*.md" "deploy.sh" "DEPLOYMENT_GUIDE.md"

echo "✅ Deployment package created: ankrishi-website-deploy.zip"
echo ""
echo "🚀 Next Steps:"
echo "1. Go to https://netlify.com"
echo "2. Drag and drop the ankrishi-website-deploy.zip file"
echo "3. Copy the generated URL"
echo "4. Submit to Google Search Console"
echo ""
echo "📊 SEO Checklist:"
echo "✅ Meta tags optimized for 'Ankrishi'"
echo "✅ Sitemap.xml created"
echo "✅ Robots.txt configured"
echo "✅ Structured data added"
echo "✅ Mobile-responsive design"
echo "✅ Fast loading optimized"
echo ""
echo "🔍 To make searchable for 'ankrishi':"
echo "1. Deploy to live URL"
echo "2. Submit to Google Search Console"
echo "3. Request indexing"
echo "4. Share on social media"
echo "5. Wait 1-2 weeks for indexing"
echo ""
echo "📞 Contact: tusharsha4992@gmail.com"
echo "🎯 Good luck with your deployment!"
