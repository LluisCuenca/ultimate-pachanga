import { afterEach, expect, it, vi } from 'vitest'
import { preparePhoto } from './images'
afterEach(() => vi.restoreAllMocks())
it('reduces a large camera image while preserving its proportions', async () => {
  vi.stubGlobal(
    'Image',
    class {
      src = ''
      naturalWidth = 4000
      naturalHeight = 3000
      decode() {
        return Promise.resolve()
      }
    },
  )
  const drawImage = vi.fn()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage,
  } as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
    this: HTMLCanvasElement,
    callback,
  ) {
    expect(this.width).toBe(768)
    expect(this.height).toBe(576)
    callback(new Blob(['compressed'], { type: 'image/webp' }))
  })
  const result = await preparePhoto(
    new File([new Uint8Array(4 * 1024 * 1024)], 'camera.jpg', {
      type: 'image/jpeg',
    }),
  )
  expect(result.type).toBe('image/webp')
  expect(result.size).toBeLessThan(3 * 1024 * 1024)
  expect(drawImage).toHaveBeenCalledOnce()
  vi.unstubAllGlobals()
})
it('rejects an unsupported image before attempting an upload', async () => {
  await expect(
    preparePhoto(new File(['x'], 'x.svg', { type: 'image/svg+xml' })),
  ).rejects.toThrow('JPEG, PNG o WebP')
})
