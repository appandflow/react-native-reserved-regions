# react-native-reserved-regions

Provider-scoped display divisions and occlusions for React Native's New Architecture.

## Requirements

- React Native 0.80 or newer with the New Architecture (Fabric); only 0.88.0-rc.1 is tested
- iOS 27.1 SDK and runtime for UIKit reserved regions; older SDKs compile out observation and older runtimes report an empty list
- Android 7.0 (API 24) or newer; folding features require a device supported by Jetpack WindowManager

The example app uses React Native 0.88.0-rc.1.
Its iOS target adopts `UISceneDelegate` because the RC template currently crashes on iOS 27 without it ([React Native issue #58606](https://github.com/react/react-native/issues/58606)).

## Installation

```sh
npm install react-native-reserved-regions
```

On iOS, install pods in your app's `ios` directory. Android links automatically through React Native autolinking.

## Usage

```tsx
import { View } from 'react-native';
import { ReservedRegionsProvider, useReservedRegions } from 'react-native-reserved-regions';

function Screen() {
  const fold = useReservedRegions().find(
    (region) => region.kind === 'division' && region.frame.height > region.frame.width,
  );
  if (!fold) return <Detail />;
  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <View style={{ width: fold.frame.x }}>
        <List />
      </View>
      <View style={{ width: fold.frame.width }} />
      <View style={{ flex: 1 }}>
        <Detail />
      </View>
    </View>
  );
}

export default function App() {
  return (
    <ReservedRegionsProvider style={{ flex: 1 }}>
      <Screen />
    </ReservedRegionsProvider>
  );
}
```

`useReservedRegions()` always returns an array, initially `[]`. `useReservedRegionsReady()` is initially `false` and becomes `true` with the first measurement, including an empty result. It stays true for that provider’s lifetime. Unsupported platforms report a known empty result; readiness does not indicate hardware support or guarantee first-frame timing. Both hooks must be called beneath a `ReservedRegionsProvider`. Each region's `frame` uses logical points relative to that provider's top-left corner. A nested provider establishes its own coordinate space. The provider accepts standard React Native `View` props and should cover the content whose reserved regions you want to inspect.

The public type is a tagged union:

```ts
type ReservedRegion =
  | {
      kind: 'division';
      frame: { x: number; y: number; width: number; height: number };
      occludesContent: boolean;
    }
  | {
      kind: 'occlusion';
      frame: { x: number; y: number; width: number; height: number };
    };
```

A division splits the available display. `occludesContent` tells you whether content under that division is hidden. An occlusion is an area where content is hidden. On iOS, division regions currently report `occludesContent: false`. The TypeScript declarations in `src/index.tsx` document every field.

## Why a provider and a hook?

A reserved region needs a coordinate space: the same fold has different local
coordinates in a full-screen view and an inset panel. `ReservedRegionsProvider`
renders the native view that defines those bounds and shares its measurements
with descendants. `useReservedRegions()` reads the nearest provider, so several
consumers can use the same measurements without each adding a native view. Place
a provider around each area that needs its own coordinate space; it can replace
an existing container `View`.

[react-native-hinges](https://appandflow.github.io/react-native-hinges/docs/usage)
exposes a hook without a provider because posture and angle do not depend on a
child view's position or size. It observes the existing React root's hierarchy/window.
Use both libraries when layout and animation need those separate inputs.

## Native sources

- iOS queries UIKit's active `UIView` reserved division and occlusion regions on the provider view. Typed UIKit calls are guarded by the SDK version and runtime availability. Building with an SDK older than iOS 27.1 compiles out this feature. [Apple's reserved regions overview](https://developer.apple.com/videos/play/tech-talks/111463/)
- Android observes Jetpack WindowManager `FoldingFeature` values and Android display cutout rectangles. A separating or fully occluding fold becomes a division; `OcclusionType.FULL` sets `occludesContent` to `true`. Display cutouts become occlusions. [FoldingFeature reference](https://developer.android.com/reference/androidx/window/layout/FoldingFeature), [WindowInsets reference](https://developer.android.com/reference/android/view/WindowInsets)

The library reports geometry and does not reposition content. Normal safe area insets, system bars, and keyboard insets remain separate concerns.

## Measurement timing

The first measurement requests synchronous delivery; later changes are regular
events. Android measures after Fabric mounting
and again on its own relayout, fold changes and window inset changes; scrolling
or moving an ancestor does not trigger a measurement. On iOS, same-frame delivery requires React Native
[#58530](https://github.com/react/react-native/pull/58530); see
[measurement timing](https://appandflow.github.io/react-native-reserved-regions/docs/platforms#measurement-timing).
Readiness indicates a completed measurement, not a
universal first-frame guarantee.

The [performance guide](https://appandflow.github.io/react-native-reserved-regions/docs/performance)
explains provider placement and optional readiness gating.

## Development

```sh
pnpm install --frozen-lockfile
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm test
pnpm run build
pnpm run docs:build
```

The example includes full-screen, inset and content-box providers with
`react-native-safe-area-context` values and overlays for comparison.
See [the development workflow](docs/workflow.md) for native runs,
[the docs website](website/README.md) for local previews, and
[the release process](RELEASE.md) for publishing.

## License

MIT
