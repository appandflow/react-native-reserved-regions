---
title: API reference
description: Provider, hook, and documented region types.
---

Import all exports from `react-native-reserved-regions`.

## ReservedRegionsProvider

Wrap the view you want to measure with `ReservedRegionsProvider`. It accepts React Native `ViewProps` and a ref to its native view.

```ts
function ReservedRegionsProvider(
  props: ViewProps & {
    ref?: React.Ref<React.ComponentRef<typeof View>>;
  },
): React.JSX.Element;
```

Use the ref to call native view methods such as `measure`.

## ReservedRegionsGate

Wrap content with `ReservedRegionsGate` to mount it after the nearest provider completes its first measurement, including an empty result.

```ts
function ReservedRegionsGate(props: { children?: React.ReactNode }): React.ReactNode;
```

The gate adds no native view and does not use Suspense. Using it outside a provider throws an error.

See [Usage](./usage.md#wait-before-rendering) for an example.

## useReservedRegions

```ts
function useReservedRegions(): readonly ReservedRegion[];
```

Returns the regions from the nearest provider. Before the first measurement, it returns an empty array.

Treat the array and its values as read-only. Regions have no stable IDs or guaranteed order.

Calling the hook outside a provider throws an error.

## useReservedRegionsReady

```ts
function useReservedRegionsReady(): boolean;
```

Returns `false` while the first measurement is pending and `true` when it completes, including when no regions are found.

Readiness and regions update together. Readiness stays `true` until the provider unmounts. A new provider starts pending.

Calling the hook outside a provider throws an error.

## ReservedRegionFrame

Describes a region’s position and size.

```ts
type ReservedRegionFrame = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;
```

`x` and `y` are measured from the provider’s left and top edges. `width` and `height` describe the region’s size.

See [Understanding regions](./coordinates.md) for units, zero-width or zero-height divisions, and frames that extend outside the provider.

## ReservedRegion

```ts
type ReservedRegion =
  | Readonly<{
      kind: 'division';
      frame: ReservedRegionFrame;
      occludesContent: boolean;
    }>
  | Readonly<{
      kind: 'occlusion';
      frame: ReservedRegionFrame;
    }>;
```

A division represents a fold or hinge. Use `occludesContent` to check whether content is hidden within its frame.

An occlusion represents an area where content is hidden. It has no `occludesContent` property.

Check `kind` before accessing properties specific to a region type.

```ts
function hidesContent(region: ReservedRegion): boolean {
  return region.kind === 'occlusion' || region.occludesContent;
}
```
