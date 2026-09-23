---
title: Coordinate spaces
description: Scope measurements to a screen, panel, or nested provider.
---

Every `frame` is expressed in **logical points relative to the nearest provider's top-left corner**. On Android, physical pixel measurements are converted to density-independent units before reaching JavaScript.

| Field    | Meaning                                          |
| -------- | ------------------------------------------------ |
| `x`      | Horizontal offset from the provider's left edge. |
| `y`      | Vertical offset from the provider's top edge.    |
| `width`  | Horizontal extent of the region.                 |
| `height` | Vertical extent of the region.                   |

These are provider coordinates, not screen coordinates. A provider can occupy a whole screen or a smaller view.

## A provider inside a panel

```tsx
<View style={{ flex: 1, padding: 24 }}>
  <ReservedRegionsProvider style={{ flex: 1 }}>
    <PanelContent />
  </ReservedRegionsProvider>
</View>
```

`PanelContent` receives measurements relative to the inset provider. Do not subtract the surrounding padding a second time. If you render an absolute-positioned overlay, place it directly inside that provider so the overlay and region share an origin.

## Native geometry

A provider receives the regions that intersect its bounds. Regions outside the provider are omitted. Each included region keeps its full frame, not only the part inside the provider, so a frame can have a negative `x` or `y` or extend past the provider's width or height. A fold that spans the window keeps its full length even when the provider covers only part of it. A fold can have zero width or height and still be meaningful; do not discard line-shaped regions.

On Android, the library translates window-relative folding features and screen-relative cutouts into provider coordinates. On iOS, UIKit performs the view-scoped query and the library forwards the returned frames. UIKit frames can include interaction margins around an obstruction, so they should not be interpreted as exact physical hardware outlines. See [Apple's reserved regions overview](https://developer.apple.com/videos/play/tech-talks/111463/).

To work with only the visible part, intersect a frame with the provider's size, for example from the provider's `onLayout`:

```ts
import type { ReservedRegionFrame } from 'react-native-reserved-regions';

function visiblePart(frame: ReservedRegionFrame, provider: { width: number; height: number }): ReservedRegionFrame {
  const x = Math.max(0, frame.x);
  const y = Math.max(0, frame.y);
  return {
    x,
    y,
    width: Math.max(0, Math.min(provider.width, frame.x + frame.width) - x),
    height: Math.max(0, Math.min(provider.height, frame.y + frame.height) - y),
  };
}
```

The native platforms have different geometry sources. Avoid assuming identical rectangles for similarly shaped hardware across iOS and Android.

## Inspect the difference

The [example app](./example.md) lets you switch between a full-screen provider, a provider inset by 24 points, and a smaller content box. It displays the provider bounds, region frames, and safe area insets together.
