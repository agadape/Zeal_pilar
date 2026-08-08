import sys
import os
try:
    from PIL import Image
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image

input_path = r"C:\Users\Advan\Pictures\Christmas_Zeal_25\DSC02141.JPG"
output_path = r"D:\Zeal\Tugu\public\login-bg.jpg"

print(f"Opening {input_path}...")
img = Image.open(input_path)

# Resize maintaining aspect ratio
max_size = (1920, 1080)
img.thumbnail(max_size, Image.Resampling.LANCZOS)

# Save compressed
print(f"Saving to {output_path}...")
img.save(output_path, "JPEG", quality=80, optimize=True)

final_size = os.path.getsize(output_path)
print(f"Done! Final size: {final_size / 1024 / 1024:.2f} MB")
