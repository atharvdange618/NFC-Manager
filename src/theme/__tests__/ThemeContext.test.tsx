import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { storage } from '../../storage';
import { ThemeProvider, useThemeContext } from '../ThemeContext';

let ctx: ReturnType<typeof useThemeContext>;

function Probe() {
  ctx = useThemeContext();
  return null;
}

async function mount() {
  let renderer: ReactTestRenderer | undefined;
  await act(async () => {
    renderer = create(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
  });
  return renderer;
}

beforeEach(() => storage.clearAll());

describe('ThemeProvider', () => {
  it('defaults to dark', async () => {
    await mount();
    expect(ctx.theme.name).toBe('dark');
  });

  it('falls back to dark on an unknown stored value', async () => {
    storage.set('theme', 'dracula');
    await mount();
    expect(ctx.theme.name).toBe('dark');
  });

  it('persists the chosen theme across mounts', async () => {
    const first = await mount();
    await act(async () => ctx.setThemeName('light'));
    expect(ctx.theme.name).toBe('light');

    await act(async () => first?.unmount());
    await mount();
    expect(ctx.theme.name).toBe('light');
  });
});
