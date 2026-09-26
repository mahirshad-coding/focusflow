"""
Zero-dependency PNG Generator using Python standard library (zlib + struct)
Creates valid 192x192 and 512x512 PNG app icons for FocusFlow PWA.
"""

import zlib
import struct
import math

def create_png(width, height, filename):
    def png_chunk(chunk_type, data):
        c = chunk_type + data
        crc = struct.pack('>I', zlib.crc32(c) & 0xffffffff)
        return struct.pack('>I', len(data)) + c + crc

    # PNG Signature
    sig = b'\x89PNG\r\n\x1a\n'

    # IHDR chunk
    # Bit depth 8, Color type 6 (RGBA), compression 0, filter 0, interlace 0
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr = png_chunk(b'IHDR', ihdr_data)

    # Pixel data (scanlines with filter byte 0)
    raw_bytes = bytearray()
    center_x = width / 2.0
    center_y = height / 2.0
    radius = width * 0.42

    for y in range(height):
        raw_bytes.append(0) # Filter type 0 (None)
        for x in range(width):
            dx = x - center_x
            dy = y - center_y
            dist = math.sqrt(dx * dx + dy * dy)

            # Indigo-cyan gradient background
            t = (x + y) / (width + height)
            r = int(79 * (1 - t) + 6 * t)    # #4f46e5 to #06b6d4
            g = int(70 * (1 - t) + 182 * t)
            b = int(229 * (1 - t) + 212 * t)

            if dist > radius:
                # Rounded corners / outer circle
                a = 0
            else:
                a = 255
                # Simple clock/star symbol in center
                if abs(dx) < width * 0.08 and abs(dy) < height * 0.28: # vertical hour hand
                    r, g, b = 255, 255, 255
                elif abs(dy) < height * 0.08 and 0 <= dx < width * 0.25: # minute hand
                    r, g, b = 255, 255, 255
                elif dist < width * 0.06:
                    r, g, b = 255, 255, 255

            raw_bytes.extend((r, g, b, a))

    compressed = zlib.compress(bytes(raw_bytes), 9)
    idat = png_chunk(b'IDAT', compressed)
    iend = png_chunk(b'IEND', b'')

    with open(filename, 'wb') as f:
        f.write(sig + ihdr + idat + iend)

create_png(192, 192, 'icon-192.png')
create_png(512, 512, 'icon-512.png')
print("PWA Icons generated successfully!")
