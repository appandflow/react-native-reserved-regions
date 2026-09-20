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

On Android, the library translates window-relative folding features and screen-relative cutouts into provider coordinates, then clips them to the provider bounds. Regions outside the provider are omitted. A fold can have zero width or height and still be meaningful; do not discard line-shaped regions.

On iOS, UIKit performs the view-scoped query. The library forwards the returned frames without an additional clipping pass. UIKit frames can include interaction margins around an obstruction, so they should not be interpreted as exact physical hardware outlines. See [Apple's reserved regions overview](https://developer.apple.com/videos/play/tech-talks/111463/).

The native platforms have different geometry sources. Avoid assuming identical rectangles for similarly shaped hardware across iOS and Android.

## Inspect the difference

The [example app](./example.md) lets you switch between a full-screen provider, a provider inset by 24 points, and a smaller content box. It displays the provider bounds, region frames, and safe area insets together.
