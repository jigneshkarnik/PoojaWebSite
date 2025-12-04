#!/bin/bash

# Telegram Icon Color Changer
# Changes the Telegram icon to #0088cc (Official Telegram Blue)

cd "$(dirname "$0")/images"

echo "Changing Telegram icon color to #0088cc (Official Telegram Blue)..."
echo ""

# Step 1: Create a modified SVG with fill color
cp telegram-icon.svg telegram-icon-colored.svg

# Add fill attribute to the path
sed -i '' 's/<path/<path fill="#0088cc"/' telegram-icon-colored.svg

echo "✓ SVG file updated with color #0088cc"

# Step 2: Convert to PNG with the new color
rsvg-convert -w 200 -h 200 telegram-icon-colored.svg -o telegram-icon.png

echo "✓ PNG file converted"
echo ""
echo "✓ Telegram icon color changed successfully!"
echo "  Color: #0088cc (Official Telegram Blue)"
echo ""

# Verify
ls -lh telegram-icon.png
file telegram-icon.png

# Clean up temp file
rm -f telegram-icon-colored.svg
