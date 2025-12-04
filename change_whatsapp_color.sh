#!/bin/bash

# WhatsApp Icon Color Changer
# Changes the WhatsApp icon to #25D366 (Official WhatsApp Green)

cd "$(dirname "$0")/images"

echo "Changing WhatsApp icon color to #25D366 (Official WhatsApp Green)..."
echo ""

# Step 1: Create a modified SVG with fill color
cp whatsapp-icon.svg whatsapp-icon-colored.svg

# Add fill attribute to the path
sed -i '' 's/<path/<path fill="#25D366"/' whatsapp-icon-colored.svg

echo "✓ SVG file updated with color #25D366"

# Step 2: Convert to PNG with the new color
rsvg-convert -w 200 -h 200 whatsapp-icon-colored.svg -o whatsapp-icon.png

echo "✓ PNG file converted"
echo ""
echo "✓ WhatsApp icon color changed successfully!"
echo "  Color: #25D366 (Official WhatsApp Green)"
echo ""

# Verify
ls -lh whatsapp-icon.png
file whatsapp-icon.png

# Clean up temp file
rm -f whatsapp-icon-colored.svg
