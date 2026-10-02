---
title: Run the example
description: Compare full-screen and inset providers on a native device.
---

The example imports the local library source and displays reserved regions alongside safe area measurements.

## Install and launch

Use the Node.js and pnpm versions declared in the repository. Set up Xcode for iOS or Android Studio for Android.

```sh
git clone https://github.com/appandflow/react-native-reserved-regions.git
cd react-native-reserved-regions
pnpm install
```

For iOS, install the Ruby and CocoaPods dependencies:

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

From another terminal at the repository root, launch iOS or Android:

```sh
pnpm --filter react-native-reserved-regions-example ios
# or
pnpm --filter react-native-reserved-regions-example android
```

See [Getting Started](./installation.md) for platform requirements.

## View the measurements

| Color        | Measurement     |
| ------------ | --------------- |
| Blue         | Provider bounds |
| Dashed green | Safe area edges |
| Orange       | Divisions       |
| Purple       | Occlusions      |

Zero-width or zero-height divisions are drawn as two-point lines so they remain visible. The text shows their original measurements.

The app displays Pending until measurement completes, then Ready. The example displays the regions reported by your device.

## Change the provider bounds

| Mode        | Layout                                                                   |
| ----------- | ------------------------------------------------------------------------ |
| Full screen | Fills the root view                                                      |
| Shift 40    | Moves 40 points right without changing size                              |
| Inset 24    | Adds 24-point top and side insets, leaving 100 points below for controls |
| Content box | Uses the same side and bottom insets, with the top at 180 points         |

Switch modes to compare which regions intersect the provider and how their coordinates change.

## Test folds and cutouts

On Android, use a foldable emulator profile and fold or unfold the device. Simulated cutouts are available in Developer options. Available features depend on the device profile and system image.

On iOS, use supported simulator controls or fold or unfold the device.

[Android: test display cutouts](https://developer.android.com/develop/ui/compose/system/test-cutouts) · [Android emulator controls](https://developer.android.com/studio/run/emulator)
