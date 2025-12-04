#!/bin/bash

# Create images directory if it doesn't exist
mkdir -p images

# List of images from the website with their URLs and local filenames

# 1. WhatsApp Icon
curl -L "https://lh3.googleusercontent.com/sitesv/AAzXCkcEr6RcPrM448MoXlBw91E8zFoT-gtcPXsAbgaDlMH-7VxgUB8C-tITmJjtjMefO3We4pqOV4hxPjcC_YLf5XqdeeoQ2kuFP4xSogJhIOx1PiUb46yfBXm9E4x9Lj0lWWAVZ178bsqRlDDqV4qU3o0EUSRIlN19f_UOAnUybV75q5MshoBetd1XoI8BEs-mdqXyg3rfOLD5xZnM3Pzv2SguCAo08zrm3F67mJU=w1280" -o "images/whatsapp-icon.png"
echo "✓ Downloaded WhatsApp icon"

# 2. Telegram Icon
curl -L "https://lh3.googleusercontent.com/sitesv/AAzXCkectj8Q0uWImCwcrlIIFvsoMuceXmIQlga9EG9bvavfBWcAwWGpoqh9BCm4PYBmVSjKETTBm78zwhHv0b3mGWSl5t2nyu5JCCQqNUfEd045vJoXtgXUVRwvNdHmOZgwLeelsnLIcBkZZffEVLsPpgLB-qmOvix89U-Lsp1l8cd2u9La_SEEfYZ6YUq9GpyJqBdsbWg7g2O7T0KDsXMnebQED9siO1sdddWj=w1280" -o "images/telegram-icon.png"
echo "✓ Downloaded Telegram icon"

# 3. Email Icon
curl -L "https://lh3.googleusercontent.com/sitesv/AAzXCkdw_Uff9K7IHutZDl1v-RQxeL-5z_LcGgFjX1sL6szzG8GAZjISNxD4iF6ax4vmRKPX_NtYSQWKa0obgh9W41-bjdmzRIzJwnqbIQchUSSiyLc4wwBamOvw8T3dXdiJ1QVVDo5aQdl3YVD33Ips702CxY-joic-GNmd3Syq-YmBA4RZChyoDYdxWJsY0BrdYgIUgcWuhV7_hAuL0AaDyeW9_56t_ssDGZIfjtU=w1280" -o "images/email-icon.png"
echo "✓ Downloaded Email icon"

echo ""
echo "All images have been downloaded successfully!"
echo "Images are saved in the 'images' folder"
