---
title: Usage
description: Read reserved regions in your app.
---

Wrap your content with `ReservedRegionsProvider` and read regions from a child component:

```tsx
import { Text } from 'react-native';
import { ReservedRegionsProvider, useReservedRegions, useReservedRegionsReady } from 'react-native-reserved-regions';

function Content() {
  const regions = useReservedRegions();
  const isReady = useReservedRegionsReady();

  return <Text>{isReady ? `${regions.length} reserved regions` : 'Measuring…'}</Text>;
}

export default function App() {
  return (
    <ReservedRegionsProvider style={{ flex: 1 }}>
      <Content />
    </ReservedRegionsProvider>
  );
}
```

Each region’s coordinates are relative to the nearest provider. Use these regions to adjust your layout—the provider itself doesn’t add padding or move your content.

Use `useReservedRegionsReady()` to check whether measurement is complete. While measurement is still pending, `useReservedRegions()` returns an empty array.

## Wait before rendering

Wrap content in `ReservedRegionsGate` to mount it after the first measurement, including when no regions are found.

```tsx
import { ReservedRegionsGate, ReservedRegionsProvider } from 'react-native-reserved-regions';

function Screen() {
  return (
    <ReservedRegionsProvider style={{ flex: 1 }}>
      <ReservedRegionsGate>
        <Content />
      </ReservedRegionsGate>
    </ReservedRegionsProvider>
  );
}
```

Keep the gate inside a provider that has a size, such as `flex: 1` in a sized parent. If the provider depends on the hidden content for its size, measurement may never complete.

See the [API reference](./api.md) for region types and available props.
