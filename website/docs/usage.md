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

## First render and updates

`useReservedRegions()` initially returns `[]`; `useReservedRegionsReady()` initially returns `false`. The first measurement updates both together, including when the result is empty. Readiness then stays true for that provider's lifetime. A newly mounted provider starts pending. Use readiness to distinguish waiting for an initial result from a measured empty array.

Native measurements arrive during iOS layout or Android pre-draw. Android uses the current WindowManager result when extension version 9 or later is available; otherwise it waits for the first layout-info callback before publishing. Unsupported backends report an empty result. Without an Activity, Android cannot query folding features and reports only any available display cutouts. There is no timeout that turns missing data into readiness.

Give the provider nonzero dimensions even while rendering a placeholder. A provider whose size depends entirely on children that are hidden until readiness can otherwise remain pending. The unsupported-platform fallback reports a known empty result after mounting. Readiness means an initial result is available, not that the device supports reserved regions or that future geometry cannot change.

Native events request synchronous React delivery and suppress unchanged region snapshots. The first visible frame still depends on React Native scheduling and when the platform supplies its geometry; synchronous dispatch alone is not a first-frame guarantee.

Calling either hook outside a provider throws. Nested providers each establish a coordinate space; a consumer always reads the nearest one.

## Decide what to avoid

- A `division` describes a display split. Content can still be visible across it when `occludesContent` is `false`; your layout may benefit from placing controls on either side.
- An `occlusion` describes a reserved area where content is hidden. Treat its reported bounds as an area to avoid for important content and controls.

Use `kind` to narrow the [tagged union](./api.md). Regions have no public stable ID or guaranteed ordering; use their geometry and kind when making layout decisions.
