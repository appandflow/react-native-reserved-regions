---
title: Alongside safe area context
description: Compare edge insets with reserved rectangles inside a view.
---

`react-native-safe-area-context` returns four edge insets: top, right, bottom, and left. `react-native-reserved-regions` returns frames for folds, hinges, and occluded areas.

A hinge in the middle of a display cannot be represented by edge insets alone. Use both libraries when your layout needs both measurements.

`react-native-safe-area-context` is an optional dependency and must be installed separately.

## Using both providers

Give both providers the same bounds when comparing their measurements:

```tsx
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ReservedRegionsProvider } from 'react-native-reserved-regions';

function MeasuredPanel() {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <ReservedRegionsProvider style={{ flex: 1 }}>
        <PanelContent />
      </ReservedRegionsProvider>
    </SafeAreaProvider>
  );
}
```

Inside `PanelContent`, read the measurements with their respective hooks:

```tsx
const insets = useSafeAreaInsets();
const regions = useReservedRegions();
```

Each hook reads from its own provider. If the providers have different positions or sizes, account for that difference when comparing their values.

Reserved regions do not report keyboard bounds or provide keyboard avoidance.
