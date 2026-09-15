/**
 * The one rule for every photograph the league uploads.
 *
 * Player faces and match pitches land in different buckets, but both buckets
 * are created with the same ceiling and the same three types, so checking them
 * in one place keeps the message the uploader sees honest about what the
 * database would have accepted.
 */

const MAX_IMAGE_BYTES = 3 * 1024 * 1024

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/** Validates a chosen photograph and returns the extension its path will use. */
export function toImageExtension(file: File): string {
  const extension = IMAGE_EXTENSIONS[file.type]

  if (!extension) throw new Error('La imagen debe ser JPEG, PNG o WebP')

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('La imagen no puede superar los 3 MB')
  }

  return extension
}

/** Downsize new photographs locally; preserve their full composition and transparency. */
export async function preparePhoto(
  file: File,
  maximumSide = 768,
): Promise<File> {
  if (!IMAGE_EXTENSIONS[file.type])
    throw new Error('La imagen debe ser JPEG, PNG o WebP')
  if (file.size > 30 * 1024 * 1024)
    throw new Error('La imagen no puede superar los 30 MB antes de optimizarla')
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const scale = Math.min(
      1,
      maximumSide / Math.max(image.naturalWidth, image.naturalHeight),
    )
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) {
      toImageExtension(file)
      return file
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.86),
    )
    if (!blob) {
      toImageExtension(file)
      return file
    }
    const optimized = new File(
      [blob],
      file.name.replace(/\.[^.]+$/, '') +
        (blob.type === 'image/webp' ? '.webp' : '.png'),
      { type: blob.type },
    )
    toImageExtension(optimized)
    return optimized.size < file.size || scale < 1 ? optimized : file
  } catch (error) {
    if (error instanceof Error && error.message.includes('MB')) throw error
    throw new Error(
      'No se pudo leer esta foto. Prueba otra imagen JPEG, PNG o WebP.',
      { cause: error },
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}
