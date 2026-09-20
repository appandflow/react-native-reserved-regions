# react-native-reserved-regions

Provider-scoped display divisions and occlusions for React Native's New Architecture.

## Requirements

- React Native New Architecture (Fabric)
- iOS 27.1 for UIKit reserved regions; earlier iOS versions report an empty list
- Android 7.0 (API 24) or newer; folding features require a device supported by Jetpack WindowManager

The example app uses React Native 0.88.0-rc.1.
Its iOS target adopts `UISceneDelegate` because the RC template currently crashes on iOS 27 without it ([React Native issue #58606](https://github.com/react/react-native/issues/58606)).

## Installation

```sh
npm install react-native-reserved-regions@next
```

On iOS, install pods in your app's `ios` directory. Android links automatically through React Native autolinking.

## Usage

```tsx
import {
  ReservedRegionsProvider,
  useReservedRegions,
} from 'react-native-reserved-regions';

function Screen() {
  const regions = useReservedRegions();
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

`useReservedRegions()` returns an empty array until the native view reports its first layout and when no active regions overlap the provider. It must be called beneath a `ReservedRegionsProvider`. Each region's `frame` uses logical points relative to that provider's top-left corner. A nested provider establishes its own coordinate space. The provider accepts standard React Native `View` props and should cover the content whose reserved regions you want to inspect.

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

- iOS queries UIKit's active `UIView` reserved division and occlusion regions on the provider view. The selectors are resolved at runtime so the library can compile with an SDK older than iOS 27.1. [Apple's reserved regions overview](https://developer.apple.com/videos/play/tech-talks/111463/)
- Android observes Jetpack WindowManager `FoldingFeature` values and Android display cutout rectangles. A separating or fully occluding fold becomes a division; `OcclusionType.FULL` sets `occludesContent` to `true`. Display cutouts become occlusions. [FoldingFeature reference](https://developer.android.com/reference/androidx/window/layout/FoldingFeature), [WindowInsets reference](https://developer.android.com/reference/android/view/WindowInsets)

The library reports geometry and does not reposition content. Normal safe area insets, system bars, and keyboard insets remain separate concerns.

## Development

```sh
yarn install
yarn typecheck
yarn lint
yarn test --watch=false
yarn prepare
```

To run the example, use `yarn example start`, then `yarn example ios` or `yarn example android`.

## License

MIT
