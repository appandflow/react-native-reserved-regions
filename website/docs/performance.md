---
title: Performance and first render
description: Choose where to measure regions and when to mount dependent content.
---

## Start with the provider

`ReservedRegionsProvider` owns one native view and shares its measurements with
all descendant consumers. Calling `useReservedRegions()` in several components
does not add native views or start separate observations. Use the provider in
place of an existing container where possible, and add nested providers only
when content needs a different coordinate space.

By default, children mount immediately. Region hooks return `[]` while the first
measurement is pending, then update when geometry is available. Native code
suppresses unchanged region snapshots. This is the simplest option when content
can render before its reserved regions are known.

## Gate content that needs the first measurement

`ReservedRegionsGate` returns `null` until the nearest provider is ready. It then
renders its children without adding a native view or a Suspense boundary.

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

`Content` first mounts with a measured snapshot, including when that snapshot is
empty. Later region changes update consumers normally; they do not close the
gate or remount the subtree. A new provider starts pending again.

Gating can avoid rendering an expensive subtree with pending geometry and then
correcting it. It also delays that subtree's mount and effects. It is optional;
measure startup behavior in your app before choosing it as an optimization.

### Keep the measured view mounted and sized

The gate belongs **inside** the provider. Its view must have dimensions even when
the gate returns `null`, for example through `flex: 1` in a sized parent or an
explicit width and height. If the measured view gets its size only from gated
children, the initial measurement may never complete.

A regions gate waits only for reserved regions. It does not establish readiness
for other contexts such as safe area insets.

### Synchronous delivery

Native events request synchronous React delivery. A gate does not make platform
measurements arrive sooner, and neither mechanism guarantees that the first
visible frame contains content on every React Native/platform combination.
