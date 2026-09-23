# iPhone Duo reserved regions: 0.2.0 iOS verification

Verified September 23, 2026 against `0.2.0` (main commit
`f5a4f06a4a0b7af8a3a43fb3fcf5a2cf84fbaf25`) on a GitHub-hosted runner. The run
covers the 0.2.0 iOS changes that the September 22 report predates: origin-only
re-measurement (#17), unclipped frames and first-event-only synchronous
delivery (#25).

## Configuration

- Runner label `xcode-27-xlarge`, image `xcode-27-arm64` `20260921.0210`,
  macOS 27.0, 5 vCPUs and 15 GB of memory.
- Xcode 27.1 beta (`27A9269`, `/Applications/Xcode_27.1_beta.app`) through
  `DEVELOPER_DIR`. The iOS 27.1 simulator runtime (`24A94401`, 7.85 GB) is not
  preinstalled; `xcodebuild -downloadPlatform iOS` fetched it without an Apple
  account.
- A new iPhone Duo simulator (`com.apple.CoreSimulator.SimDeviceType.iPhone-Duo`,
  `4F91B05B-0146-4724-96E5-67FBD8A2FB83`), booted headless with `simctl`.
- `reservedregions.example` built in the Release configuration for
  `iphonesimulator`, so the JavaScript bundle is embedded and no Metro server
  runs. React Native `0.88.0-rc.1` with its prebuilt iOS core.
- agent-device `0.21.12` for taps, accessibility snapshots, screenshots and
  hinge angles. `fold` compiles a small HID helper against the simulator SDK,
  runs it with `xcrun simctl spawn`, and reads the angle back from
  `devicectl device motion hinge-angle`. It needs no Simulator.app or Device Hub.
- A temporary build of `ReservedRegionsView.mm` added three `NSLog` calls:
  one in the hinge handler and one on each dispatch path, logging the path,
  provider bounds and region payload. The logs were read with
  `simctl spawn <udid> log show`. This instrumentation is not part of 0.2.0.

## Observed geometry

Frames are `(x, y, width, height)` in provider-relative logical points, read
from the example's on-screen text. Every state reported `Measurement: Ready`.
Every division reported `content visible`.

| Step | Posture and provider | Provider size | Active regions                                                    |
| ---- | -------------------- | ------------- | ----------------------------------------------------------------- |
| 1    | Closed, full screen  | 466 × 678     | Occlusions `(399.7, 29.3, 37, 37)` and `(382, 0, 84, 170)`        |
| 2    | 130°, full screen    | 951 × 669     | Division `(455.5, 0, 40, 669)`; occlusion `(867, 0, 84, 120)`     |
| 3    | 130°, shift 40       | 951 × 669     | Division `(415.5, 0, 40, 669)`; occlusion `(827, 0, 84, 120)`     |
| 4    | 130°, inset 24       | 903 × 545     | Division `(431.5, -24, 40, 669)`; occlusion `(843, -24, 84, 120)` |
| 5    | 130°, content box    | 903 × 389     | Division `(431.5, -180, 40, 669)`; no occlusion                   |
| 6    | 130°, inset 24       | 903 × 545     | Division `(431.5, -24, 40, 669)`; occlusion `(843, -24, 84, 120)` |
| 7    | 180°, inset 24       | 903 × 545     | Occlusion `(843, -24, 84, 120)`; no division                      |
| 8    | 130°, inset 24       | 903 × 545     | Division `(431.5, -24, 40, 669)`; occlusion `(843, -24, 84, 120)` |
| 9    | 130°, full screen    | 951 × 669     | Division `(455.5, 0, 40, 669)`; occlusion `(867, 0, 84, 120)`     |

`fold` confirmed hinge angles of 130°, 180° and 130° through CoreDevice. The
closed, 130° full-screen, inset and content-box values match the
[September 22 report](dynamic-fold-ios-2026-09-22.md), where the content box
was measured at 113°.

### Origin-only moves

**Shift 40** keeps the provider size and moves it 40 points right. The division
moved from x 455.5 to 415.5 and the occlusion from 867 to 827, both exactly
−40. The native log shows a dispatch for this step with bounds still
`{951, 669}`, so the #17 origin-only re-measurement ran.

### Unclipped frames

In **Content box**, the provider is 389 points tall and starts 180 points below
the window top. The division is reported at y −180 with its full 669-point
height, extending past both provider edges. The top-right occlusion no longer
intersects the provider and is omitted. In **Inset 24**, both regions start at
y −24. UIKit frames are forwarded without clipping, as `platforms.md` states
and as Android does after #20.

### Hinge-driven removal and restoration

With **Inset 24** selected, opening to 180° removed the division and folding
back to 130° restored it. The provider stayed 903 × 545 and was not remounted;
all dispatches came from the same native view. Each change was dispatched 2 ms
after a hinge update, with unchanged bounds (native log, condensed):

```text
21:27:28.132 RRPROBE 0x102bf0e00 hinge <UIHingeInteractionUpdate: …>
21:27:28.134 RRPROBE 0x102bf0e00 unique bounds={{0, 0}, {903, 545}} regions=( occlusion {{843, -24}, {84, 120}} )
21:27:40.778 RRPROBE 0x102bf0e00 hinge <UIHingeInteractionUpdate: …>
21:27:40.780 RRPROBE 0x102bf0e00 unique bounds={{0, 0}, {903, 545}} regions=( division {{431.5, -24}, {40, 669}}, occlusion {{843, -24}, {84, 120}} )
```

The initial unfold behaved the same way. The provider resized to 951 × 669 at
21:26:45.9, but the first four dispatches at that size had no division. The
division first appeared at 21:26:47.679, 2 ms after a hinge update, with bounds
unchanged. The division arrived on a hinge-triggered layout pass, not on the
resize.

## Event delivery

The app process that ran the sequence dispatched 13 region payloads. Only the
first, the closed-posture mount at 21:26:39.684, used the synchronous
`experimental_flushSync` path. The other 12 used `dispatchUniqueEvent`. Those
12 include every layout switch and posture change.

During the two-second unfold, five payloads were dispatched in 1.8 seconds.
Two were transient: the closed-panel occlusions in rotated coordinates, then an
occlusion `(817, 0, 134, 82)`. The screen then settled on the last dispatched
payload. After every step, the on-screen values equal the last native payload
dispatched before the snapshot. So later events reach JavaScript and React ends
with the latest value.

## Reproduction

The temporary workflow `.github/workflows/duo-verify.yml` and driver
`e2e/ios-duo-verify.mjs` live on the unmerged branch `@janic/duo-verify`
(commit `a9b3f08`), together with the logging patch. Evidence is from
[run 35921251206](https://github.com/appandflow/react-native-reserved-regions/actions/runs/35921251206):
screenshots, accessibility snapshots, `results.json` and `rrprobe.log`. The
workflow downloads the runtime, builds Release, creates and boots the Duo, and
drives this sequence:

```sh
agent-device open reservedregions.example --relaunch
agent-device fold --keyframes '[{"atMs":0,"angle":0},{"atMs":2000,"angle":130}]'
agent-device press 'role=button label="Shift 40"' --settle
agent-device fold --keyframes '[{"atMs":0,"angle":130},{"atMs":2000,"angle":180}]'
```

The job takes about 13 minutes; the runtime download takes 1.5 to 3 minutes.

### Runner constraints

- The standard `xcode-27` runner (3 vCPUs, 7 GB) stopped responding within
  minutes of booting the iPhone Duo in three of three attempts. Steps with
  their own timeouts never finished, and no job log was uploaded. The 5-vCPU,
  15 GB `xcode-27-xlarge` runner completed the run.
- The `20260921` image, which adds Xcode 27.1 beta, was still rolling out.
  Two of seven jobs landed on `20260912`, which has only Xcode 27.0. The workflow
  checks for `/Applications/Xcode_27.1_beta.app` and fails in seconds.
- Deleting the preinstalled 27.0 runtimes with `simctl runtime delete` broke
  CoreSimulator in that job (`liblaunch_sim.dylib could not be opened`). Leave
  them in place.

## Limits

This is simulator evidence from one run, not physical-device or
multiple-window evidence. JavaScript receipt was not instrumented: event
delivery is established from the native dispatch path and the final on-screen
values, not from a per-event JavaScript log or frame timing. Intermediate
angles other than 130° and 180°, the older-runtime fallback and camera
activation were not exercised.
