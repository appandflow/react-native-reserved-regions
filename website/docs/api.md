---
title: API reference
description: Provider, hook, and documented region types.
---

All public exports come from `react-native-reserved-regions`.

## ReservedRegionsProvider

```ts
function ReservedRegionsProvider(
  props: ViewProps & { ref?: React.Ref<React.ComponentRef<typeof View>> },
): React.JSX.Element;
```

A native view that supplies active reserved regions to descendants. It accepts React Native `ViewProps` and a `ref` to the native view, which you can use like a `View` ref, for example to call `measure`. Give it explicit dimensions or a layout style such as `flex: 1` so there is an area to measure.

Each provider maintains its own measurements. A nested provider replaces the context for its descendants.

## ReservedRegionsGate

```ts
function ReservedRegionsGate(props: { children?: React.ReactNode }): React.ReactNode;
```

Renders `null` until the nearest provider has completed its first measurement,
then renders `children`, including for an empty result. It adds no native view and
does not suspend. Throws outside a provider, like `useReservedRegionsReady()`.
Keep the measured view mounted and sized outside the gate. See
[performance and first render](./performance.md) for placement and tradeoffs.

## useReservedRegions

```ts
function useReservedRegions(): readonly ReservedRegion[];
```

Returns regions from the nearest provider, initially `[]`. Throws if there is no provider. The list has no guaranteed stable IDs or ordering. Treat both the array and its values as read-only.

## useReservedRegionsReady

```ts
function useReservedRegionsReady(): boolean;
```

Returns whether the nearest provider has reported its first measurement. Initially `false`, then `true` even when the measured region array is empty. Regions and readiness update together. It stays true for that provider's lifetime and resets for a newly mounted provider. Throws if there is no provider.

Readiness does not indicate hardware support or guarantee first-visible-frame timing. An unsupported platform reports a known empty result. A provider without laid-out bounds remains pending; Android also waits for its first WindowManager result when a synchronous query is unavailable.

## ReservedRegionFrame

```ts
/** Bounds in logical points relative to the nearest provider. Not clipped to the provider. */
type ReservedRegionFrame = Readonly<{
  /** Horizontal distance from the provider's left edge. */
  x: number;
  /** Vertical distance from the provider's top edge. */
  y: number;
  /** Horizontal extent; can be zero for a vertical fold. */
  width: number;
  /** Vertical extent; can be zero for a horizontal fold. */
  height: number;
}>;
```

A frame can extend past the provider's edges. Read [coordinate spaces](./coordinates.md) to get the visible part and for interaction-margin behavior.

## ReservedRegion

```ts
/** An active area reserved by the display or supported system UI. */
type ReservedRegion =
  | Readonly<{
      /** A seam, hinge, or fold dividing the usable display. */
      kind: 'division';
      /** Bounds in the provider's coordinate space. */
      frame: ReservedRegionFrame;
      /** True when content underneath this division is hidden. */
      occludesContent: boolean;
    }>
  | Readonly<{
      /** A reserved area where content is hidden, such as a cutout. */
      kind: 'occlusion';
      /** Bounds in the provider's coordinate space. */
      frame: ReservedRegionFrame;
    }>;
```

`kind` is a string-literal discriminant, not a runtime enum. `occludesContent` exists only on divisions: it distinguishes a visible fold from an occluding hinge. Occlusion regions already express hidden content and do not carry the boolean.

```ts
function hidesContent(region: ReservedRegion): boolean {
  return region.kind === 'occlusion' || region.occludesContent;
}
```

Currently iOS divisions always have `occludesContent: false`. Android derives it from `FoldingFeature.OcclusionType.FULL`. See [platform behavior](./platforms.md).
