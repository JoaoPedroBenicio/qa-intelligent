import { describe, it, expect, beforeEach } from 'vitest';
import { useUiStore } from '@/stores/uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useUiStore.setState({
      sidebarOpen: true,
      theme: 'light',
      copilotOpen: true,
    });
  });

  it('toggles theme between light and dark', () => {
    const initial = useUiStore.getState().theme;
    useUiStore.getState().toggleTheme();
    expect(useUiStore.getState().theme).not.toBe(initial);
  });

  it('toggles sidebar', () => {
    expect(useUiStore.getState().sidebarOpen).toBe(true);
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebarOpen).toBe(false);
  });

  it('toggles copilot', () => {
    useUiStore.getState().toggleCopilot();
    expect(useUiStore.getState().copilotOpen).toBe(false);
  });
});


it('only restores valid preferences without replacing actions', async () => {
  useUiStore.setState({ theme: 'light', sidebarOpen: true, copilotOpen: false });
  localStorage.setItem('qa-fluxo:ui', JSON.stringify({ version: 1, state: {
    theme: 'invalid', sidebarOpen: false, copilotOpen: 'yes', toggleTheme: 'invalid',
  } }));
  await useUiStore.persist.rehydrate();
  expect(useUiStore.getState().theme).toBe('light');
  expect(useUiStore.getState().sidebarOpen).toBe(false);
  expect(useUiStore.getState().copilotOpen).toBe(false);
  expect(typeof useUiStore.getState().toggleTheme).toBe('function');
});
