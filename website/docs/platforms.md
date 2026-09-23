---
title: Platform behavior
description: How UIKit and Jetpack WindowManager map to the public API.
---

## iOS

When built with the iOS 27.1 SDK or later and running on iOS 27.1 or later, the provider queries UIKit's active `UIView` reserved regions for the division and occlusion kinds. It passes the default query options, which exclude inactive regions.

| UIKit result     | JavaScript result                            |
| ---------------- | -------------------------------------------- |
| Division region  | `kind: 'division'`, `occludesContent: false` |
| Occlusion region | `kind: 'occlusion'`                          |

The implementation assumes iOS divisions do not hide content. This is a library mapping, not a separate UIKit occlusion property. Occlusion frames can cover hardware or supported system UI and may include interaction margins.

UIKit returns only regions that intersect the provider, with their full frames in provider coordinates. The library does not clip them to the provider bounds.

The implementation calls typed UIKit APIs behind both an SDK compile guard and a runtime availability check:

```objc
#if defined(__IPHONE_27_1) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_27_1
if (@available(iOS 27.1, *)) {
  // The typed UIKit queries are compiled only with a supporting SDK.
}
#endif
```

Building with an older SDK compiles out reserved-region observation. Such a build returns empty arrays even on an iOS 27.1 device. A build with a supporting SDK also returns empty arrays on an older runtime. Rebuild with the newer SDK to enable the APIs; a device OS update alone is insufficient.

Region measurements refresh when the provider lays out, moves into a window, or receives a hinge update through `UIHingeInteraction` on iOS 27.1 or later. Inactive regions are not exposed.

To test iPhone Duo behavior, use an Xcode and simulator runtime that include it. The 0.1.0 simulator verification exercised closed, partially open, and flat states,
including removal and restoration of a division without changing provider bounds.
Physical Duo hardware and multiple-window behavior remain unverified.

[Apple: adaptive layouts on iPhone Duo](https://developer.apple.com/videos/play/tech-talks/111463/)

## Android

The library observes Jetpack WindowManager `1.5.1` and reads display cutout bounding rectangles from window insets.

| Native result                        | JavaScript result                               |
| ------------------------------------ | ----------------------------------------------- |
| Separating `FoldingFeature`          | `division`                                      |
| Fully occluding `FoldingFeature`     | `division`, even if it is not marked separating |
| `OcclusionType.FULL` on that feature | `occludesContent: true`                         |
| Other included folding features      | `occludesContent: false`                        |
| Display cutout rectangle on API 28+  | `occlusion`                                     |

Folding features and cutouts that do not intersect the provider are omitted. Those that do keep their full frames in provider coordinates, as on iOS; the library does not clip them to the provider bounds. See [coordinate spaces](./coordinates.md#native-geometry).

A non-separating fold with no full occlusion is omitted. Hardware and posture determine what WindowManager reports; an emulator needs a compatible foldable profile to provide folding features. Cutouts and folds are separate sources, so a provider can receive both kinds at once.

The Android implementation reports display cutouts and the included folding features. It does not report arbitrary overlapping app windows, the keyboard, or system bars as occlusion rectangles.

[Android: FoldingFeature](https://developer.android.com/reference/androidx/window/layout/FoldingFeature) · [Android: DisplayCutout](https://developer.android.com/reference/android/view/DisplayCutout)

## Other platforms

The fallback component renders a React Native `View` and reports a known empty result after mounting: regions are `[]` and readiness becomes `true`. This does not indicate native support. There is no browser fold or display-cutout integration.

## Measurement timing

Android takes its first measurement after Fabric mounts the view, when its event
emitter is available and before React Native's event beat. Later React relayouts
are measured in the Android layout pass, so their event reaches React at the beat
that follows the same mount batch. The provider also re-measures when WindowManager
reports new folding features and when window insets reach the provider, which
covers display cutout changes unless an ancestor consumes the insets. Scrolling,
moving an ancestor or transforming the provider does not trigger a measurement.
Older WindowManager extensions may await their first callback.

iOS measures in `layoutSubviews`. React Native processes a synchronous event
requested there one frame later unless it includes [react/react-native#58530](https://github.com/react/react-native/pull/58530),
which processes the event beat in the frame that requested it. That change is merged
into React Native's `main` branch but is not in the 0.88 release candidates. The
repository example applies it as a patch; the published package does not patch
your app's React Native. See [the example setup](./example.md#react-native-event-beat-patch).
Readiness means the provider has completed a measurement; it is not a guarantee
that every layout change is visible in its first frame.
