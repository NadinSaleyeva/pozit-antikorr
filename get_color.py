from PIL import Image
from collections import Counter
import os

images = [
    'c:\\Users\\nadov\\.gemini\\antigravity\\brain\\d079724a-dd29-4e80-8fce-70e06d563b63\\media__1772533858451.png',
    'c:\\Users\\nadov\\.gemini\\antigravity\\brain\\d079724a-dd29-4e80-8fce-70e06d563b63\\media__1772533906603.png'
]

for img_path in images:
    if os.path.exists(img_path):
        print(f"File: {os.path.basename(img_path)}")
        img = Image.open(img_path).convert('RGB')
        pixels = list(img.getdata())
        
        # Filter out white/grayish background pixels and dark text
        red_pixels = [p for p in pixels if p[0] > 150 and p[1] < 100 and p[2] < 100]
        
        count = Counter(red_pixels)
        most_common = count.most_common(1)
        
        if most_common:
            r, g, b = most_common[0][0]
            hex_color = "#{:02x}{:02x}{:02x}".format(r, g, b)
            print(f"Most common red color: {hex_color.upper()} (RGB: {r}, {g}, {b})")
        else:
            print("No red pixels found")
        print("-" * 20)
