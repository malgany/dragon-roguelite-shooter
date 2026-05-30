type FullscreenCapableElement = HTMLElement & {
  webkitRequestFullscreen?: (options?: FullscreenOptions) => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  msFullscreenElement?: Element | null;
};

export function getViewportSize() {
  const viewport = window.visualViewport;
  return {
    width: Math.max(320, Math.round(viewport?.width ?? window.innerWidth)),
    height: Math.max(240, Math.round(viewport?.height ?? window.innerHeight))
  };
}

export async function enterImmersiveMode() {
  const doc = document as FullscreenDocument;
  const element = document.documentElement as FullscreenCapableElement;
  const fullscreenElement = document.fullscreenElement ?? doc.webkitFullscreenElement ?? doc.msFullscreenElement;

  if (!fullscreenElement) {
    const requestFullscreen = element.requestFullscreen ?? element.webkitRequestFullscreen ?? element.msRequestFullscreen;
    await Promise.resolve(requestFullscreen?.call(element)).catch(() => undefined);
  }

  const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
  await orientation.lock?.("landscape").catch(() => orientation.lock?.("landscape-primary").catch(() => undefined));

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}
