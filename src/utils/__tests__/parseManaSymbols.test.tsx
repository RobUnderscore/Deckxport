import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { parseManaSymbols } from '../parseManaSymbols';

describe('parseManaSymbols', () => {
  it('should parse uppercase tap symbol {T}', () => {
    const { container } = render(<>{parseManaSymbols('{T}: Add {C}.')}</>);
    const tapSymbol = container.querySelector('.ms-tap');
    expect(tapSymbol).toBeTruthy();
    expect(tapSymbol?.getAttribute('aria-label')).toBe('T');
  });

  it('should parse lowercase tap symbol {t}', () => {
    const { container } = render(<>{parseManaSymbols('{t}: Add {c}.')}</>);
    const tapSymbol = container.querySelector('.ms-tap');
    expect(tapSymbol).toBeTruthy();
    expect(tapSymbol?.getAttribute('aria-label')).toBe('t');
  });

  it('should parse colorless mana {C}', () => {
    const { container } = render(<>{parseManaSymbols('Add {C}{C}.')}</>);
    const colorlessSymbols = container.querySelectorAll('.ms-c');
    expect(colorlessSymbols).toHaveLength(2);
  });

  it('should parse generic mana costs', () => {
    const { container } = render(<>{parseManaSymbols('{4}: This becomes a creature.')}</>);
    const fourSymbol = container.querySelector('.ms-4');
    expect(fourSymbol).toBeTruthy();
  });

  it('should parse colored mana symbols', () => {
    const { container } = render(<>{parseManaSymbols('{W}{U}{B}{R}{G}')}</>);
    expect(container.querySelector('.ms-w')).toBeTruthy();
    expect(container.querySelector('.ms-u')).toBeTruthy();
    expect(container.querySelector('.ms-b')).toBeTruthy();
    expect(container.querySelector('.ms-r')).toBeTruthy();
    expect(container.querySelector('.ms-g')).toBeTruthy();
  });

  it('should handle multi-line oracle text', () => {
    const text = '{T}: Add {G}.\n{4}: This land becomes a 4/2 creature.';
    const { container } = render(<>{parseManaSymbols(text)}</>);
    const tapSymbol = container.querySelector('.ms-tap');
    const greenSymbol = container.querySelector('.ms-g');
    const fourSymbol = container.querySelector('.ms-4');
    expect(tapSymbol).toBeTruthy();
    expect(greenSymbol).toBeTruthy();
    expect(fourSymbol).toBeTruthy();
  });

  it('should handle unrecognized symbols as text', () => {
    const { container } = render(<>{parseManaSymbols('{UNKNOWN}: Do something.')}</>);
    const unknownText = container.textContent;
    expect(unknownText).toContain('{UNKNOWN}');
  });

  it('should apply size classes correctly', () => {
    const { container } = render(<>{parseManaSymbols('{T}', 'ms-large')}</>);
    const tapSymbol = container.querySelector('.ms-tap');
    expect(tapSymbol?.classList.contains('ms-large')).toBe(true);
  });
});