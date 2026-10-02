---
title: Understanding regions
description: Scope measurements to a screen, panel, or nested provider.
---

## What is a region?

A region describes a part of the display that affects where you place content. The library reports two types: **divisions** and **occlusions**.

### Divisions

A division marks a fold in a flexible screen or a hinge between two screens. Divisions are reported as `kind: 'division'`.

Use `occludesContent` to check whether content is hidden in that area:

- `false`: content remains visible across the division.
- `true`: content is hidden within the division’s frame.

A division can have zero width or height. Keep these regions when calculating your layout; they still mark a boundary in the display.

Example of a fold that leaves content visible, using illustrative values:

```ts
{
  kind: 'division',
  occludesContent: false,
  frame: { x: 400, y: 0, width: 0, height: 800 },
}
```

### Occlusions

An occlusion marks an area where content is hidden, such as a camera cutout or space reserved by the system.

Occlusions are reported as `kind: 'occlusion'`. They have no `occludesContent` flag because they already represent hidden content.

Example of a camera cutout, using illustrative values:

```ts
{
  kind: 'occlusion',
  frame: { x: 20, y: 20, width: 30, height: 30 },
}
```

### Position and size

The provider is the view your app measures. Both region types include a `frame` describing their position and size relative to that view.

```ts
const frame = {
  x: 120,
  y: 0,
  width: 20,
  height: 800,
};
```

- `x`: distance from the provider’s left edge.
- `y`: distance from the provider’s top edge.
- `width` and `height`: the region’s size.

All values use logical points. On Android, the library converts physical pixels to density-independent units.

## Frames can extend outside the provider

The library includes regions that overlap the provider and returns their full frames. A frame can start outside the provider or extend past its edges.

For example, `y: -10` places the region’s top edge 10 points above the provider.

```ts
{ x: 0, y: -10, width: 20, height: 100 }
```

To draw only the part inside the provider, use `overflow: 'hidden'` on the overlay container. You can also calculate that portion using the provider’s size from `onLayout`.

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

On iOS, a frame may include extra space around an obstruction for touch interactions. It may be larger than the obstruction itself.
