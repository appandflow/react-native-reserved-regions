---
title: Alongside safe area context
description: Compare edge insets with reserved rectangles inside a view.
---

Safe area insets and reserved regions answer different layout questions.

|                  | `react-native-safe-area-context`              | `react-native-reserved-regions`               |
| ---------------- | --------------------------------------------- | --------------------------------------------- |
| Geometry         | Four edge distances: top, right, bottom, left | A list of frames and region kinds             |
| Typical use      | Keep content within safe edges                | Inspect a fold, hinge, or occluded area       |
| Coordinate scope | Nearest safe area provider                    | Nearest reserved regions provider             |
| Layout behavior  | Offers hooks and `SafeAreaView`               | Reports geometry; your app chooses the layout |

Four edge distances cannot describe every obstruction in the middle of a display. A region list also does not replace normal system bar or keyboard handling. Use both libraries when your screen needs both kinds of information.

## Match the provider bounds

For a direct comparison, make both provider views occupy the same rectangle:

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

`PanelContent` can call `useSafeAreaInsets()` and `useReservedRegions()`. These providers add no padding in this example. If you put a padded `SafeAreaView` between them, their measured bounds may differ, and direct numerical comparisons need to account for that.

`react-native-safe-area-context` is an optional app dependency. The reserved regions library does not depend on it; the example includes it to show both measurements.
