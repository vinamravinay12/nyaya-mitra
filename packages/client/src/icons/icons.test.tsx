import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import * as icons from './index.js';

const ALL = Object.entries(icons);

describe('icon set', () => {
  it('exports every icon as a renderable component', () => {
    expect(ALL.length).toBeGreaterThan(0);
  });

  it.each(ALL)('%s renders an svg hidden from assistive technology', (_name, IconComponent) => {
    const { container } = render(<IconComponent />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    // Icons always sit beside text that carries the meaning, so they are
    // decorative and must not be announced.
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
  });

  it.each(ALL)('%s defaults to a size when none is given', (_name, IconComponent) => {
    const { container } = render(<IconComponent />);
    expect(container.querySelector('svg')?.getAttribute('class')).toContain('size-5');
  });

  it.each(ALL)('%s accepts a size override', (_name, IconComponent) => {
    const { container } = render(<IconComponent className="size-8" />);
    expect(container.querySelector('svg')?.getAttribute('class')).toContain('size-8');
  });
});
