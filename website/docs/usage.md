---
title: Provider and hook
description: Read reserved regions from the nearest provider.
---

Give the provider the bounds of the content you want to inspect. Descendants read its regions with `useReservedRegions()`.

```tsx
import { Text, View } from 'react-native';
import { ReservedRegionsProvider, useReservedRegions, useReservedRegionsReady } from 'react-native-reserved-regions';

function RegionSummary() {
  const regions = useReservedRegions();
  const isReady = useReservedRegionsReady();

  if (!isReady) return <Text>Measuring reserved regions…</Text>;

  return (
    <View>
      <Text>{regions.length} active reserved regions</Text>
      {regions.map((region, index) => (
        <Text key={index}>
          {region.kind}: {region.frame.x}, {region.frame.y}
          {' · '}
          {region.frame.width} × {region.frame.height}
          {region.kind === 'division' ? ` · content ${region.occludesContent ? 'hidden' : 'visible'}` : ''}
        </Text>
      ))}
    </View>
  );
}

export default function App() {
  return (
    <ReservedRegionsProvider style={{ flex: 1 }}>
      <RegionSummary />
    </ReservedRegionsProvider>
  );
}
```

The provider accepts standard React Native `View` props, including `style` and `onLayout`. It measures its own native view and supplies region data; it does not pad, split, or reposition your content.

## Why a provider and a hook?

The provider defines **which view the geometry belongs to**. For example, a fold
at `x = 300` in a full-screen provider would be at `x = 276` in a panel whose left
edge is 24 points farther right, if the fold still intersects that panel. A hook
with only a window snapshot could not know which panel's coordinates you need.

`ReservedRegionsProvider` renders a native view so it can measure that view's
position and bounds. React context shares the resulting snapshot with its
descendants; `useReservedRegions()` reads the nearest snapshot without rendering
another view. Multiple consumers can share one provider. Add a nested provider
when a panel needs its own coordinate space, and use the provider in place of an
existing container `View` where possible.

[react-native-hinges](https://appandflow.github.io/react-native-hinges/docs/usage)
uses the existing React root as its observation scope. Posture and angle do not
change just because a child panel moves, so `useHinges()` needs no extra provider
or native view. The libraries can be used together: hinge readings drive behavior
or animation, while reserved regions supply the geometry for layout. A division
rectangle and a hinge reading have no shared ID or guaranteed array-index mapping.

The provider's own position and bounds determine the geometry; placing a consumer
inside a nested child `View` does not change the coordinate origin. See
[coordinate spaces](./coordinates.md) for platform details.

## First render and updates

`useReservedRegions()` initially returns `[]`; `useReservedRegionsReady()` initially returns `false`. The first measurement updates both together, including when the result is empty. Readiness then stays true for that provider's lifetime. A newly mounted provider starts pending. Use readiness to distinguish waiting for an initial result from a measured empty array.

Native measurements arrive during iOS layout. On Android the first measurement follows Fabric mounting; later React relayouts of the provider, folding feature updates and window inset changes are measured again. Scrolling, moving an ancestor or transforming the provider does not trigger a measurement. Android uses the current WindowManager result when extension version 9 or later is available; otherwise it waits for the first layout-info callback before publishing. Unsupported backends report an empty result. Without an Activity, Android cannot query folding features and reports only any available display cutouts. There is no timeout that turns missing data into readiness.

Give the provider nonzero dimensions even while rendering a placeholder. A provider whose size depends entirely on children that are hidden until readiness can otherwise remain pending. The unsupported-platform fallback reports a known empty result after mounting. Readiness means an initial result is available, not that the device supports reserved regions or that future geometry cannot change.

Native code suppresses unchanged region snapshots. iOS events and the first Android measurement request synchronous React delivery; later Android changes are regular events that React receives at the next event beat. The first visible frame still depends on React Native scheduling and when the platform supplies its geometry; synchronous dispatch alone is not a first-frame guarantee.

Calling either hook outside a provider throws. Nested providers each establish a coordinate space; a consumer always reads the nearest one.

## Mounting content after measurement

The optional [`ReservedRegionsGate`](./performance.md#gate-content-that-needs-the-first-measurement)
can delay mounting descendants until the provider is ready. The default provider
continues to render children immediately. See [performance and first render](./performance.md)
for placement and sizing considerations.

## Decide what to avoid

- A `division` describes a display split. Content can still be visible across it when `occludesContent` is `false`; your layout may benefit from placing controls on either side.
- An `occlusion` describes a reserved area where content is hidden. Treat its reported bounds as an area to avoid for important content and controls.

Use `kind` to narrow the [tagged union](./api.md). Regions have no public stable ID or guaranteed ordering; use their geometry and kind when making layout decisions.
