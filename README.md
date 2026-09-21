# react-native-reserved-regions

Provider-scoped display divisions and occlusions for React Native's New Architecture.

## Requirements

- React Native New Architecture (Fabric)
- iOS 27.1 SDK and runtime for UIKit reserved regions; older SDKs compile out observation and older runtimes report an empty list
- Android 7.0 (API 24) or newer; folding features require a device supported by Jetpack WindowManager

The example app uses React Native 0.88.0-rc.1.
Its iOS target adopts `UISceneDelegate` because the RC template currently crashes on iOS 27 without it ([React Native issue #58606](https://github.com/react/react-native/issues/58606)).

## Installation

`0.1.0-alpha.2` is the functional release candidate. Install the explicit version
once publication is verified; until then, run the repository example.

```sh
npm install react-native-reserved-regions@0.1.0-alpha.2
```

On iOS, install pods in your app's `ios` directory. Android links automatically through React Native autolinking.

## Usage

```tsx
import { ReservedRegionsProvider, useReservedRegions, useReservedRegionsReady } from 'react-native-reserved-regions';

function Screen() {
  const regions = useReservedRegions();
  const isReady = useReservedRegionsReady();
  if (!isReady) return null;
  return regions.map((region, index) => {
    if (region.kind === 'division') {
      console.log(region.frame, region.occludesContent);
    } else {
      console.log(region.frame);
    }
    return null;
  });
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

## Native sources

- iOS queries UIKit's active `UIView` reserved division and occlusion regions on the provider view. Typed UIKit calls are guarded by the SDK version and runtime availability. Building with an SDK older than iOS 27.1 compiles out this feature. [Apple's reserved regions overview](https://developer.apple.com/videos/play/tech-talks/111463/)
- Android observes Jetpack WindowManager `FoldingFeature` values and Android display cutout rectangles. A separating or fully occluding fold becomes a division; `OcclusionType.FULL` sets `occludesContent` to `true`. Display cutouts become occlusions. [FoldingFeature reference](https://developer.android.com/reference/androidx/window/layout/FoldingFeature), [WindowInsets reference](https://developer.android.com/reference/android/view/WindowInsets)

The library reports geometry and does not reposition content. Normal safe area insets, system bars, and keyboard insets remain separate concerns.

## Measurement timing

Native events request synchronous delivery. Android measures after Fabric mounting
and also observes pre-draw changes. The iOS example tests same-frame delivery with
an [upstream React Native event-beat patch](docs/workflow.md#react-native-event-beat-test-patch).
That example patch is not installed into consuming apps. Readiness indicates a
completed measurement, not a universal first-frame guarantee.

### Readiness-gated animated content

On the tested RN `0.88.0-rc.1` Android stack, conditionally mounting Reanimated
`4.7.0` content when `useReservedRegionsReady()` becomes true can throw
`__requestMapperRunFinalizer` is undefined: Worklets `0.13.0` can run synchronous
UI work ahead of queued mapper initialization. The combined hinges example uses
an [example-only Worklets FIFO patch](https://github.com/appandflow/react-native-hinges/blob/main/patches/react-native-worklets%400.13.0.patch).
Installing either library does not patch a consuming app's Worklets dependency.
Keeping the animated subtree mounted avoided this failure in the tested case;
apps that gate its mount need to apply the patch, rebuild the native app, and
validate it themselves.

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
