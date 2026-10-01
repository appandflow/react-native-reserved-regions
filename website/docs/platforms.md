---
title: Platform behavior
description: How UIKit and Jetpack WindowManager map to the public API.
---

## iOS

To receive regions on iOS, build your app with the iOS 27.1 SDK or later and run it on iOS 27.1 or later. Older SDKs or iOS versions return an empty region list.

The library uses UIKit to find folds and occluded areas that overlap the provider’s view. Each region includes its position and size.

| **UIKit region** | **Result**                                   |
| ---------------- | -------------------------------------------- |
| Division         | `kind: 'division'`, `occludesContent: false` |
| Occlusion        | `kind: 'occlusion'`                          |

Divisions are reported with `occludesContent: false`. They mark a boundary in the display but don’t block your content.

Regions with `kind: 'occlusion'` identify areas where content is hidden, such as a camera cutout or space reserved by iOS. Keep text and controls outside these areas.

[Apple: adaptive layouts on iPhone Duo](https://developer.apple.com/videos/play/tech-talks/111463/)

## Android

Android requires API 24 or later. Display cutouts require API 28 or later. Fold information depends on device support for Jetpack WindowManager.

The library reads folds and hinges from Jetpack WindowManager and display cutout rectangles from window insets.

| **Native result**                    | **JavaScript result**                           |
| ------------------------------------ | ----------------------------------------------- |
| Separating `FoldingFeature`          | `division`                                      |
| Fully occluding `FoldingFeature`     | `division`, even if it is not marked separating |
| `OcclusionType.FULL` on that feature | `occludesContent: true`                         |
| Other included folding features      | `occludesContent: false`                        |
| Display cutout rectangle on API 28+  | `occlusion`                                     |

A fold or hinge is reported when it separates the display into sections or fully hides content. If the device also has a camera cutout, both can appear in the region list.

Results can change when the device folds or unfolds. Use a compatible foldable device or emulator to test these changes.

The library does not report keyboards, system bars, or overlapping app windows as occlusions.

[Android: FoldingFeature](https://developer.android.com/reference/androidx/window/layout/FoldingFeature) · [Android: DisplayCutout](https://developer.android.com/reference/android/view/DisplayCutout)

## Other platforms

The provider renders a React Native `View`. After mounting, it returns an empty region list and sets readiness to `true`.

There is no browser fold or display-cutout support.

## Measurement timing

The provider measures regions when its layout or the supported device features change.

| iOS                              | Android                             |
| -------------------------------- | ----------------------------------- |
| The provider lays out            | The provider mounts or lays out     |
| The provider moves into a window | WindowManager reports a fold change |
| A hinge update arrives           | Window insets reach the provider    |

Scrolling, moving a parent view, or applying a transform does not trigger a measurement.

On Android:

- Older WindowManager extensions may wait for their first result before the provider becomes ready.
- A parent view that consumes window insets can prevent cutout updates from reaching the provider.
- After a provider is detached and reattached, it only measures again if its position or size within its parent, folding features, or cutout changed while detached.

The first measurement requests synchronous delivery to React. Later measurements use regular events. React Native limits synchronous delivery to one event per view and event name per frame, so regular events allow later changes in the same frame to be delivered. Intermediate updates may be combined before JavaScript processes them.

On iOS, processing the first measurement in the same frame requires [React Native #58530](https://github.com/react/react-native/pull/58530). The example’s React Native `0.88.0-rc.1` does not include it.

Readiness confirms that a measurement has completed. It does not guarantee that the resulting layout appears in the first visible frame.
