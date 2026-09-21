# Synchronous initial regions: iOS verification

Verified on September 20, 2026 using Xcode 27.1 beta and an owned iPhone Duo
simulator running iOS 27.1 (`5D1CA82B-C157-4C68-90D1-E9F821B3B2EA`).
The app was `reservedregions.example`, with Metro on port 8089.

## Native build

The example built React Native 0.88.0-rc.1 from source with the local event-beat
patch applied. `RCT_USE_PREBUILT_RNCORE=0` was set before importing the React
Native Podfile helpers, and the generated Pods project compiled
`React/Fabric/AppleEventBeat.mm`.

Stim reported a successful native build in 1 minute 18 seconds, 1 minute 44
seconds total, and 9 of 1121 compilation-cache hits. Bundle loading and a live
stable app process were confirmed. The final `stim logs --errors` query had no
matching records.

## Native observations

| Provider layout                | Result                |
| ------------------------------ | --------------------- |
| Full screen, 466 by 678 points | Ready, two occlusions |
| Content box, 418 by 398 points | Ready, empty regions  |

The full-screen native occlusions were:

- x 399.7, y 29.3, width 37.0, height 37.0 points.
- x 382.0, y 0.0, width 84.0, height 170.0 points.

The full-screen safe-area reading was top 0, right 84, bottom 34, left 0 points.
The content-box safe-area reading was top 0, right 60, bottom 0, left 0 points.
The content box correctly distinguished a completed empty measurement from
pending initialization.

## Cold-start display evidence

A display recording captured a cold app relaunch. The first captured new
content frame after the launch screen already displayed `Measurement: Ready`,
both nonempty region descriptions, and the corresponding purple overlays.
The immediately preceding captured frame was still the launch screen. No
pending measurement was visible in that transition.

The recording was inspected as decoded frames without frame dropping around
the transition. Simulator recording timestamps were nonmonotonic around the
app relaunch, so they are not used to claim exact event or display latency.
This is observed first-content-frame evidence for this simulator run, not a
guarantee for every OS/device or every kind of reserved region.

Changing fold geometry, division regions, physical hardware, and nested-window
transitions remain unverified in this run.
