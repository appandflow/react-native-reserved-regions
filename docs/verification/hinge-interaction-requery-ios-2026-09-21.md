# Hinge interaction re-query: iOS verification

Verified on September 21, 2026. The change adds one `UIHingeInteraction` in
`-[ReservedRegionsView initWithFrame:]` whose update handler calls
`setNeedsLayout` on the view, so a hinge update refreshes the reserved regions
through the existing `layoutSubviews` path.

## Configuration

- Xcode 27.1 beta (`Xcode-27.1.0-Beta.app`) and the iOS 27.1 simulator runtime.
- Owned iPhone Duo simulator `hinge-requery-duo`
  (`21DDEA30-001C-4B5B-9CF2-AEEAF8D3222B`), created for this task.
- `reservedregions.example`, React Native 0.88.0-rc.1 built from source with the
  repository event-beat patch and `RCT_USE_PREBUILT_RNCORE=0`. Metro on 8081.
- Ruby 3.3.4 from rvm for `bundle exec pod install`.

## Native observations with the iOS 27.1 SDK

The `xcodebuild` build for the Duo simulator succeeded. Installing and launching
the resulting app produced the same values recorded in the September 20 run.

| Provider layout                | Result                |
| ------------------------------ | --------------------- |
| Full screen, 466 by 678 points | Ready, two occlusions |
| Content box, 418 by 398 points | Ready, empty regions  |

The full-screen native occlusions were:

- x 399.7, y 29.3, width 37.0, height 37.0 points.
- x 382.0, y 0.0, width 84.0, height 170.0 points.

The full-screen safe-area reading was top 0, right 84, bottom 34, left 0 points.
The content-box safe-area reading was top 0, right 60, bottom 0, left 0 points.
Switching between the two layouts in both directions kept `Measurement: Ready`
and updated the coordinates. The app process stayed alive across the sequence,
no red box appeared, and a device log query for the app process contained no
React Native exception, red box or fatal record.

These values match the earlier run exactly, which is the intended result: the
interaction only schedules a layout pass and changes nothing on its own.

The active display was the Duo outer display. `xcrun simctl io <udid> enumerate`
reports two internal displays, 2007 by 2853 and 1398 by 2034 pixels; the app ran
on the 1398 by 2034 one, which is 466 by 678 points at 3x. Screenshots had to
name that display explicitly, since the default capture returned the inactive
display as a black image.

## The interaction is attached and its handler runs

A temporary instrumented build, not part of the committed diff, logged each
handler invocation. One update was delivered on launch:

```
RRPROBE hinge update hinge=<UIHinge: 0x1079d6f00> {
    status: closed;
    angleRadians: 0.00;
} angle=0
```

This establishes that the interaction attaches to the provider view, that the
Duo simulator hierarchy does provide hinge updates, and that the handler is
called with the initial state as `UIHingeInteraction.h` documents. The
instrumentation was removed and the final source was rebuilt and reinstalled
before the screenshots listed above were taken.

## A posture change could not be exercised

No supported way to change the fold posture of an iPhone Duo simulator was
found.

- `xcrun simctl help` lists no fold, hinge or posture subcommand. `simctl ui`
  covers appearance, contrast and content size only.
- Xcode 27.1 beta ships no `Simulator.app`. Its `Contents/Applications`
  directory contains `DeviceHub.app` instead, whose binary has no fold, hinge or
  posture strings, so there is no menu item to exercise.
- The `iPhone Duo.simdevicetype` profile declares no hinge or posture capability
  in `supportedFeatures`.
- `xcrun simctl io <udid> screenConfig power on|off` can move the app between
  the two internal displays, but it delivered no further hinge update: the whole
  session logged exactly one handler call, the launch one. This confirms the
  existing note in `docs/workflow.md` that display power is not a posture
  change. Toggling display power also crashed the simulator system shell once
  and required a reboot.
- The iOS 27.1 runtime does contain a private SpringBoard hinge replay facility
  (`SBFHingeSamplePlayback`, `replayHingeSamplesWithSettings` and a recorded
  `hinge-samples.csv` in `SpringBoardFoundation.framework`). It is private SPI
  with no public entry point and was not used.

So the re-query on an actual posture change is **not verified**. What is
verified is that the interaction is attached, that its handler is reached, and
that `setNeedsLayout` feeds the already-verified `layoutSubviews` re-query path.
This change is insurance for the case where a posture change does not force a
layout pass on the provider; that case was not reproduced.

## Compile guard with the iOS 27.0 SDK

`pod install` and a build were rerun with the default `Xcode.app`, which has the
27.0 SDK, into a separate derived data path:

```sh
xcodebuild -workspace ReservedRegionsExample.xcworkspace \
  -scheme ReservedRegionsExample -configuration Debug \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
  CODE_SIGNING_ALLOWED=NO build
```

It reported `** BUILD SUCCEEDED **`, so `UIHingeInteraction` compiles out cleanly
behind `#if defined(__IPHONE_27_1) && __IPHONE_OS_VERSION_MAX_ALLOWED >=
__IPHONE_27_1` with an older SDK. This is a compilation result only; it does not
exercise the older-runtime fallback.

## Repository checks

`pnpm run format`, `format:check`, `lint`, `typecheck`, `test`, `build` and
`docs:build` all passed on the final source.

## Not established

- Any hinge update after the initial one, on any device.
- Reserved regions changing in response to a posture change.
- Behavior on physical iPhone Duo hardware.
- Division-kind regions, which this simulator never reported.
- Whether a real posture change would already have forced a layout pass without
  this interaction.
