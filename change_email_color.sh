#!/bin/bash

# Email Icon Color Changer
# Changes the Email icon to #EA4335 (Official Gmail Red)

cd "$(dirname "$0")/images"

echo "Changing Email icon color to #EA4335 (Official Gmail Red)..."
echo ""

# Step 1: Create a modified SVG with fill color
cp email-icon.svg email-icon-colored.svg

# Add fill attribute to the path
sed -i '' 's/<path/<path fill="#EA4335"/' email-icon-colored.svg

echo "✓ SVG file updated with color #EA4335"

# Step 2: Convert to PNG with the new color
rsvg-convert -w 200 -h 200 email-icon-colored.svg -o email-icon.png

echo "✓ PNG file converted"
echo ""
echo "✓ Email icon color changed successfully!"
echo "  Color: #EA4335 (Official Gmail Red)"
echo ""

# Verify
ls -lh email-icon.png
file email-icon.png

# Clean up temp file
rm -f email-icon-colored.svg
