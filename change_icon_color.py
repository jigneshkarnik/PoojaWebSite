#!/usr/bin/env python3
"""
WhatsApp Icon Color Changer
Changes the WhatsApp icon color to any hex color you specify
"""

import os
import re
import subprocess
import sys

def change_icon_color(icon_name='whatsapp', hex_color='#25D366'):
    """Change icon color in SVG and convert to PNG"""
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    images_dir = os.path.join(script_dir, 'images')
    
    svg_file = os.path.join(images_dir, f'{icon_name}-icon.svg')
    png_file = os.path.join(images_dir, f'{icon_name}-icon.png')
    
    print(f"Changing {icon_name} icon color to {hex_color}...")
    print("")
    
    # Check if SVG file exists
    if not os.path.exists(svg_file):
        print(f"❌ Error: {svg_file} not found!")
        return False
    
    try:
        # Read the SVG file
        with open(svg_file, 'r') as f:
            svg_content = f.read()
        
        # Find all hex colors in the SVG
        original_colors = set(re.findall(r'#[0-9a-fA-F]{6}', svg_content))
        print(f"Found colors in SVG: {original_colors}")
        
        # Replace all colors with the new color
        modified_svg = re.sub(r'#[0-9a-fA-F]{6}', hex_color, svg_content)
        
        # Write back to file
        with open(svg_file, 'w') as f:
            f.write(modified_svg)
        
        print(f"✓ SVG file updated with color {hex_color}")
        
        # Convert SVG to PNG using rsvg-convert
        result = subprocess.run(
            ['rsvg-convert', '-w', '200', '-h', '200', svg_file, '-o', png_file],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print(f"✓ PNG file created: {png_file}")
            print("")
            print(f"✓ {icon_name.capitalize()} icon color changed successfully!")
            print(f"  Color: {hex_color}")
            return True
        else:
            print(f"❌ Error converting SVG to PNG: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == '__main__':
    # Get color from command line argument or use default
    color = sys.argv[1] if len(sys.argv) > 1 else '#25D366'
    icon = sys.argv[2] if len(sys.argv) > 2 else 'whatsapp'
    
    success = change_icon_color(icon, color)
    sys.exit(0 if success else 1)

# Usage examples:
# python3 change_icon_color.py '#25D366' whatsapp
# python3 change_icon_color.py '#0088cc' telegram
# python3 change_icon_color.py '#EA4335' email
