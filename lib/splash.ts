/** Apple startup images: iOS only uses one if the media query matches exactly. */
export type SplashSpec = { w: number; h: number; dw: number; dh: number; ratio: number; label: string };

export const SPLASH_SPECS: SplashSpec[] = [
  { w: 1320, h: 2868, dw: 440, dh: 956, ratio: 3, label: "iphone-16-pro-max" },
  { w: 1206, h: 2622, dw: 402, dh: 874, ratio: 3, label: "iphone-16-pro" },
  { w: 1290, h: 2796, dw: 430, dh: 932, ratio: 3, label: "iphone-15-pro-max" },
  { w: 1179, h: 2556, dw: 393, dh: 852, ratio: 3, label: "iphone-15-pro" },
  { w: 1284, h: 2778, dw: 428, dh: 926, ratio: 3, label: "iphone-13-pro-max" },
  { w: 1170, h: 2532, dw: 390, dh: 844, ratio: 3, label: "iphone-13" },
  { w: 1242, h: 2688, dw: 414, dh: 896, ratio: 3, label: "iphone-xs-max" },
  { w: 1125, h: 2436, dw: 375, dh: 812, ratio: 3, label: "iphone-x" },
  { w: 828, h: 1792, dw: 414, dh: 896, ratio: 2, label: "iphone-xr" },
  { w: 750, h: 1334, dw: 375, dh: 667, ratio: 2, label: "iphone-se" },
  { w: 1536, h: 2048, dw: 768, dh: 1024, ratio: 2, label: "ipad" },
  { w: 1668, h: 2388, dw: 834, dh: 1194, ratio: 2, label: "ipad-pro-11" },
  { w: 2048, h: 2732, dw: 1024, dh: 1366, ratio: 2, label: "ipad-pro-12" },
];

export function splashMedia(s: SplashSpec): string {
  return `(device-width: ${s.dw}px) and (device-height: ${s.dh}px) and (-webkit-device-pixel-ratio: ${s.ratio}) and (orientation: portrait)`;
}

export function splashHref(s: SplashSpec): string {
  return `/splash/${s.label}-${s.w}x${s.h}.png`;
}
