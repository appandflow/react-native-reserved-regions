# Dynamic Duo reserved regions: iOS verification

Verified September 22, 2026 for the 0.1.0 release candidate. Native implementation
is unchanged from `0.1.0-alpha.3` (main commit
`108a773e8be1276dbf32af252154dfd45be82778`).

## Configuration

- Xcode 27.1 beta and iOS 27.1 simulator runtime.
- Stim-owned iPhone Duo `5D1CA82B-C157-4C68-90D1-E9F821B3B2EA`.
- `reservedregions.example`, React Native `0.88.0-rc.1`, Fabric, and the
  repository's example-only event-beat patch. Metro on 8090.
- agent-device `0.21.12`, using timed angle keyframes through simulator HID.

## Observed geometry

Frames below are `(x, y, width, height)` in provider-relative logical points.
Every observed state reported `Measurement: Ready`.

| Posture and provider | Provider size | Active regions                                                    |
| -------------------- | ------------- | ----------------------------------------------------------------- |
| Closed, full screen  | 466 × 678     | Occlusions `(399.7, 29.3, 37, 37)` and `(382, 0, 84, 170)`        |
| 130°, full screen    | 951 × 669     | Division `(455.5, 0, 40, 669)`; occlusion `(867, 0, 84, 120)`     |
| 130°, inset 24       | 903 × 545     | Division `(431.5, -24, 40, 669)`; occlusion `(843, -24, 84, 120)` |
| 180°, inset 24       | 903 × 545     | Occlusion `(843, -24, 84, 120)`; no division                      |
| 113°, inset 24       | 903 × 545     | Division `(431.5, -24, 40, 669)`; occlusion `(843, -24, 84, 120)` |
| 113°, content box    | 903 × 389     | Division `(431.5, -180, 40, 669)`; no occlusion                   |

Returning the content-box provider to the closed display produced `418 × 398`
points, `Measurement: Ready`, and `No active reserved regions`. The final
`stim logs --errors` query returned no matching records.

The division disappeared at 180° and returned at 113° without changing the
inset provider's bounds or remounting it. This verifies region updates across
actual posture changes, including an arbitrary angle. All divisions reported
`content visible`, matching the library's iOS `occludesContent: false` mapping.

The inset frames moved by the expected 24 points. UIKit returned negative local
y coordinates and full division height; the library intentionally forwards
UIKit frames without an extra clipping pass. Moving the provider below the
system occlusion removed that occlusion while retaining the intersecting fold.

## Reproduction

Start and build from `example/` with Stim, then open `reservedregions.example`
using agent-device on the exact device reported by Stim. With that session open:

```sh
agent-device fold --keyframes '[{"atMs":0,"angle":0},{"atMs":2000,"angle":130}]'
agent-device snapshot -i
```

Select **Inset 24**, open to 180°, and fold back to 113°. Keep the same session
and provider selected; compare the region text after each fold. Select
**Content box** to verify that the top-right occlusion no longer intersects it.

## Limits

This closes the dynamic-posture gap in the September 21 iOS report. It is a
simulator runtime check, not physical-device or multiple-window evidence. It
verifies geometry after transitions, not per-frame latency or every intermediate
angle. The example contains an RN event-beat patch; the npm package does not
install that patch into consumers. Older-runtime fallback and camera-activation
changes were not exercised in this run.
