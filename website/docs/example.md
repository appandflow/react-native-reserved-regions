---
title: Run the example
description: Compare full-screen and inset providers on a native device.
---

The repository includes a React Native `0.88.0-rc.1` app that imports the local library source. It includes `react-native-safe-area-context` to compare safe area insets and reserved region frames.

## Install and launch

Use the Node.js and pnpm versions declared by the repository, along with the native tooling required by the example's React Native version.

```sh
git clone https://github.com/appandflow/react-native-reserved-regions.git
cd react-native-reserved-regions
pnpm install
```

For iOS, install the example's Ruby and CocoaPods dependencies:

```sh
cd example
bundle install
cd ios
bundle exec pod install
cd ../..
```

Start Metro:

```sh
pnpm --filter react-native-reserved-regions-example start
```

In another terminal at the repository root, launch a platform:

```sh
pnpm --filter react-native-reserved-regions-example ios
# or
pnpm --filter react-native-reserved-regions-example android
```

Build with Xcode containing the iOS 27.1 SDK or later, and run on iOS 27.1 or later to inspect UIKit reserved regions. A build made with an older SDK has these features compiled out, even when installed on a newer runtime. The example adopts `UISceneDelegate` for the RN release candidate's iOS 27 compatibility; see [React Native issue #58606](https://github.com/react/react-native/issues/58606).

## Inspect provider bounds

The bottom controls change the measured view:

| Mode        | Provider bounds                                                                         |
| ----------- | --------------------------------------------------------------------------------------- |
| Full screen | Fills the root view.                                                                    |
| Shift 40    | Fills the root view, moved 40 points right without changing its size.                   |
| Inset 24    | Insets top, left, and right by 24 points; leaves 100 points at the bottom for controls. |
| Content box | Uses the same side and bottom insets, with the top at 180 points.                       |

Both providers occupy the blue rectangle. The dashed green outline marks safe area edges. Orange overlays show divisions; purple overlays show occlusions. A zero-width or zero-height division is drawn as a two-point line so it remains visible, while the text displays its native measurement.

Move between modes to inspect how coordinates change and which regions overlap the provider. The displayed data comes from the native platform; the example does not inject mock regions.

## Folds and cutouts

On Android, use a foldable emulator profile and change its posture to exercise WindowManager features. Android also offers simulated display cutouts in Developer options. Available features depend on the selected device profile and system image.

On iOS, use the supported simulator controls or a physical device to change the active display or posture. An outer-display screenshot alone does not establish fold-transition support.

[Android: test display cutouts](https://developer.android.com/develop/ui/compose/system/test-cutouts) · [Android emulator controls](https://developer.android.com/studio/run/emulator)

## Library checks

From the repository root:

```sh
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm test
pnpm run build
```

## Measurement status

The example displays Pending until the first measurement, then Ready even when
there are no active regions. Compare these states with the overlays rather than
treating an empty array as evidence that measurement finished.
