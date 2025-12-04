#!/bin/bash

# Download Contact Icons from Reliable Sources
# These are from reputable icon libraries with proper licensing

cd "$(dirname "$0")/images"

echo "Downloading contact icons from reliable sources..."
echo ""

# Option 1: From Simpleicons.org (Recommended - MIT License)
# These are official brand icons maintained by the community
echo "Option 1: Simple Icons (Official brand SVG icons - MIT License)"
echo "=================================================="

# WhatsApp - Official green icon
curl -o whatsapp-icon-option1.svg "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/whatsapp.svg"
echo "✓ WhatsApp icon downloaded"

# Telegram - Official blue icon
curl -o telegram-icon-option1.svg "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/telegram.svg"
echo "✓ Telegram icon downloaded"

# Email - Standard envelope icon
curl -o email-icon-option1.svg "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/gmail.svg"
echo "✓ Email icon downloaded"

echo ""
echo "Option 2: Font Awesome (Free tier - CC BY 4.0 License)"
echo "=================================================="

# WhatsApp - Font Awesome
curl -o whatsapp-icon-option2.svg "https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/brands/whatsapp.svg"
echo "✓ WhatsApp icon downloaded"

# Telegram - Font Awesome
curl -o telegram-icon-option2.svg "https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/brands/telegram.svg"
echo "✓ Telegram icon downloaded"

# Email - Font Awesome
curl -o email-icon-option2.svg "https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/envelope.svg"
echo "✓ Email icon downloaded"

echo ""
echo "Option 3: Flaticon (Free with attribution - Freepik License)"
echo "=================================================="
echo "Note: For production use, check Flaticon's license terms"
echo ""
echo "Popular free Flaticon icons (requires manual download from https://www.flaticon.com/):"
echo "- WhatsApp: Search 'whatsapp' by Freepik"
echo "- Telegram: Search 'telegram' by Freepik"
echo "- Email: Search 'email' or 'gmail' by Freepik"

echo ""
echo "=================================================="
echo "Icon Download Summary:"
echo "=================================================="
echo ""
echo "RECOMMENDED: Simple Icons (Option 1)"
echo "  - Official brand icons"
echo "  - MIT License (free for commercial use)"
echo "  - Maintained by the community"
echo "  - Located at: https://simpleicons.org"
echo ""
echo "ALTERNATIVE: Font Awesome (Option 2)"
echo "  - Professional quality icons"
echo "  - CC BY 4.0 License"
echo "  - Requires attribution"
echo "  - Located at: https://fontawesome.com"
echo ""
echo "Next step: Convert SVG to PNG"
echo "Run this command:"
echo "for file in *-icon-option1.svg; do convert -background none -size 200x200 \"\$file\" -resize 200x200 \"\${file%.*}.png\"; done"
