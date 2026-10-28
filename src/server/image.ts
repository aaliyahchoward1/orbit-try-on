import { ShadeError } from "./errors";

export const MAX_PHOTO_BYTES = 10_000_000;

/** Read JPEG SOF dimensions without decoding or writing a temporary file. */
export function validatePhoto(photo: unknown): asserts photo is Buffer {
  if (!Buffer.isBuffer(photo) || photo.length < 4 || photo[0] !== 0xff || photo[1] !== 0xd8)
    throw new ShadeError("image_format", "please choose a jpeg photo. your browser can convert supported image uploads for you.");
  if (photo.length >= MAX_PHOTO_BYTES)
    throw new ShadeError("image_large", "this photo is too large. please choose a photo under 10 mb.", 413);
  let position = 2;
  while (position + 4 <= photo.length) {
    if (photo[position++] !== 0xff) break;
    while (photo[position] === 0xff) position++;
    const marker = photo[position++];
    if (marker === 0xda || marker === 0xd9) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (position + 2 > photo.length) break;
    const length = photo.readUInt16BE(position);
    if (length < 2 || position + length > photo.length) break;
    if ([0xc0, 0xc1, 0xc2].includes(marker) && length >= 8) {
      const height = photo.readUInt16BE(position + 3);
      const width = photo.readUInt16BE(position + 5);
      if (Math.max(width, height) > 1600)
        throw new ShadeError("image_large", "please resize your photo so its longest side is at most 1600 pixels.", 413);
      if (Math.min(width, height) < 320)
        throw new ShadeError("image_small", "choose a clearer photo at least 320 pixels wide and tall.");
      if (photo[photo.length - 2] !== 0xff || photo[photo.length - 1] !== 0xd9) break;
      return;
    }
    position += length;
  }
  throw new ShadeError("image_format", "we couldn't read this photo. please choose another jpeg image.");
}
