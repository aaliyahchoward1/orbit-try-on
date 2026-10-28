export class ShadeError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message);
  }
}

// Inspect codes only. Never include provider messages, payloads or URLs in logs
// or user-facing errors: they can contain sensitive request information.
export function providerError(code: unknown, httpStatus = 400): ShadeError {
  const value = String(code ?? "").toLowerCase();
  if (/credit|insufficien|balance/.test(value) || httpStatus === 402)
    return new ShadeError("credits", "lunuff is out of preview credits for now. please try again later.", 503);
  if (/too_small|below_min/.test(value))
    return new ShadeError("face_small", "move a little closer: your whole face should fill most of the photo.");
  if (/angle|forward_facing/.test(value))
    return new ShadeError("face_angled", "look straight at the camera with your head level, then try a new photo.");
  if (/boundary|position_invalid/.test(value))
    return new ShadeError("face_hidden", "keep your whole face visible and centered, with nothing covering your lips.");
  if (/no_face|face_not_found|face_not_detected|face_detection|detect_face/.test(value))
    return new ShadeError("no_face", "we couldn't find a face. try a clear, front-facing selfie in natural light.");
  if (/max.*size|filesize|too_large/.test(value))
    return new ShadeError("image_large", "this photo is too large. choose a smaller photo and try again.", 413);
  if (/invalidtask|timeout|expired/.test(value))
    return new ShadeError("expired", "this preview session has expired. please choose your photo again.", 410);
  if (httpStatus === 401 || httpStatus === 403)
    return new ShadeError("configuration", "live previews aren't available right now. please try again later.", 503);
  if (httpStatus === 429)
    return new ShadeError("provider_busy", "lunuff is helping a few starfriends. please wait a moment and try again.", 429);
  return new ShadeError("provider_error", "we couldn't process this photo. try a clear, front-facing selfie with your whole face visible.", 502);
}
