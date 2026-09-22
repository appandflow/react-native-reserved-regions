---
title: Installation
description: Install the alpha prerelease and check native platform requirements.
---

`react-native-reserved-regions` reports display divisions and occlusions relative to a React Native view. Use it to inspect folds, hinges, camera cutouts, and supported system-reserved areas before choosing where to place content.

## Release status

`0.1.0-alpha.3` includes optional readiness gating, hinge-driven iOS region refreshes,
synchronous delivery, and cutout support. The repository [example](./example.md)
remains useful for testing native behavior on supported devices and simulators.

```sh
npm install react-native-reserved-regions@0.1.0-alpha.3
```

## Requirements

| Platform     | Requirement                                                                                                                                                                                                                                                                                   |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React Native | New Architecture / Fabric. The example uses `0.88.0-rc.1`; a broader supported version range has not been established.                                                                                                                                                                        |
| iOS          | Build with the iOS 27.1 SDK or later and run on iOS 27.1 or later to receive UIKit reserved regions. Older SDKs compile out reserved-region observation, including on newer devices; older runtimes return empty lists. The deployment minimum follows React Native's CocoaPods requirements. |
| Android      | API 24 or later, or your app's higher minimum. Display cutouts require API 28. Folds require device support for Jetpack WindowManager.                                                                                                                                                        |

Install CocoaPods dependencies after adding the package:

```sh
cd ios
bundle exec pod install
```

Android uses React Native autolinking. Rebuild your native app on either platform after installation. This package includes a native Fabric view, so adding the JavaScript dependency alone is insufficient.

Continue with [the provider and hook](./usage.md).
