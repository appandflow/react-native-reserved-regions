---
title: Installation
description: Install the package and check native platform requirements.
---

`react-native-reserved-regions` reports display divisions and occlusions relative to a React Native view. Use it to inspect folds, hinges, camera cutouts, and supported system-reserved areas before choosing where to place content.

## Release status

The current release is `0.2.0`. See the [release notes](https://github.com/appandflow/react-native-reserved-regions/blob/main/docs/releases/0.2.0.md)
for changes from `0.1.0`, including unclipped Android frames. The first measurement requests
synchronous delivery; see [measurement timing](./performance.md) for its limits. The repository [example](./example.md)
remains useful for testing native behavior on supported devices and simulators.

```sh
npm install react-native-reserved-regions
```

## Requirements

| Platform     | Requirement                                                                                                                                                                                                                                                                                   |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React Native | `0.80` or later with the New Architecture / Fabric.                                                                                                                                                                                                                                           |
| iOS          | Build with the iOS 27.1 SDK or later and run on iOS 27.1 or later to receive UIKit reserved regions. Older SDKs compile out reserved-region observation, including on newer devices; older runtimes return empty lists. The deployment minimum follows React Native's CocoaPods requirements. |
| Android      | API 24 or later, or your app's higher minimum. Display cutouts require API 28. Folds require device support for Jetpack WindowManager.                                                                                                                                                        |

Install CocoaPods dependencies after adding the package:

```sh
cd ios
bundle exec pod install
```

Android uses React Native autolinking. Rebuild your native app on either platform after installation. This package includes a native Fabric view, so adding the JavaScript dependency alone is insufficient.

Continue with [the provider and hook](./usage.md).
