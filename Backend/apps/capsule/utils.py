import io
import os
from PIL import Image
from django.core.files.base import ContentFile


def compress_image_to_webp(image_file, quality=95, max_width=1920):

    # Open the image
    img = Image.open(image_file)
    
    # Convert to RGB if necessary (for PNG with transparency, etc.)
    if img.mode in ('RGBA', 'LA', 'P'):
        # Create a white background
        background = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode == 'P':
            img = img.convert('RGBA')
        background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
        img = background
    elif img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Resize if width exceeds max_width
    if img.width > max_width:
        aspect_ratio = img.height / img.width
        new_height = int(max_width * aspect_ratio)
        img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
    
    # Save to WebP format
    output = io.BytesIO()
    img.save(output, format='WEBP', quality=quality, method=6)
    output.seek(0)
    
    # Generate filename with .webp extension
    original_name = image_file.name
    base_name = os.path.splitext(original_name)[0]
    webp_name = f"{base_name}.webp"
    
    return ContentFile(output.read(), name=webp_name)


def compress_image_to_webp_thumbnail(image_file, quality=90, max_width=400):

    return compress_image_to_webp(image_file, quality=quality, max_width=max_width)