import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, render } from '@testing-library/react'
import { renderWithProviders } from '@/test/render'
import { useAppMotion } from './useAppMotion'
import { useLayoutMotion } from './useLayoutMotion'

function Controls() {
  useAppMotion('/league')
  return <button>Acción</button>
}
function Lineup({ reversed = false }: { reversed?: boolean }) {
  const ref = useLayoutMotion(String(reversed))
  return (
    <div ref={ref}>
      {(reversed ? ['b', 'a'] : ['a', 'b']).map((key, index) => (
        <div key={key} data-motion-key={key} data-position={index}>
          {key}
        </div>
      ))}
    </div>
  )
}
afterEach(() => vi.restoreAllMocks())
describe('motion safeguards', () => {
  it('releases tactile feedback on scroll gestures and pointer cancellation', () => {
    renderWithProviders(<Controls />)
    const button = screen.getByRole('button')
    // jsdom exposes no PointerEvent constructor; MouseEvent carries the same coordinates.
    fireEvent(
      button,
      new MouseEvent('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 20,
        clientY: 20,
      }),
    )
    expect(button).toHaveAttribute('data-pressed', 'true')
    fireEvent(
      document,
      new MouseEvent('pointermove', {
        bubbles: true,
        clientX: 20,
        clientY: 40,
      }),
    )
    expect(button).not.toHaveAttribute('data-pressed')
    fireEvent(
      button,
      new MouseEvent('pointerdown', { bubbles: true, button: 0 }),
    )
    fireEvent(document, new Event('pointercancel', { bubbles: true }))
    expect(button).not.toHaveAttribute('data-pressed')
  })
  it('animates changed placements and cancels them when unmounted', () => {
    const cancel = vi.fn()
    const animate = vi.fn(() => ({ cancel }))
    Object.defineProperty(Element.prototype, 'animate', {
      configurable: true,
      writable: true,
      value: animate,
    })
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: HTMLElement) {
        const x = Number(this.dataset.position ?? 0) * 100
        return {
          x,
          y: 0,
          left: x,
          top: 0,
          right: x + 50,
          bottom: 50,
          width: 50,
          height: 50,
          toJSON() {},
        }
      },
    )
    const view = render(<Lineup />)
    expect(animate).not.toHaveBeenCalled()
    view.rerender(<Lineup reversed />)
    expect(animate).toHaveBeenCalledTimes(2)
    view.unmount()
    expect(cancel).toHaveBeenCalledTimes(2)
    delete (Element.prototype as Partial<Element>).animate
  })
  it('keeps placements immediate when reduced motion is requested', () => {
    const animate = vi.fn()
    Object.defineProperty(Element.prototype, 'animate', {
      configurable: true,
      writable: true,
      value: animate,
    })
    vi.spyOn(window, 'matchMedia').mockReturnValueOnce({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList)
    const view = render(<Lineup />)
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList)
    view.rerender(<Lineup reversed />)
    expect(animate).not.toHaveBeenCalled()
    delete (Element.prototype as Partial<Element>).animate
  })
})
