---
title: Provider and hook
description: Read reserved regions from the nearest provider.
---

Give the provider the bounds of the content you want to inspect. Descendants read its regions with `useReservedRegions()`.

```tsx
import { Text, View } from 'react-native';
import { ReservedRegionsProvider, useReservedRegions } from 'react-native-reserved-regions';

function RegionSummary() {
  const regions = useReservedRegions();

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

The hook initially returns `[]`. Native measurements update it after layout, and subsequent native changes rerender consumers. An empty list also means no regions are reported for the provider, or the platform has no supported region source. There is no separate loading or availability flag.

Calling the hook outside a provider throws. Nested providers each establish a coordinate space; a consumer always reads the nearest one.

## Decide what to avoid

- A `division` describes a display split. Content can still be visible across it when `occludesContent` is `false`; your layout may benefit from placing controls on either side.
- An `occlusion` describes a reserved area where content is hidden. Treat its reported bounds as an area to avoid for important content and controls.

Use `kind` to narrow the [tagged union](./api.md). Regions have no public stable ID or guaranteed ordering; use their geometry and kind when making layout decisions.
