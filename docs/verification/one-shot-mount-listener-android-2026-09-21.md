# Android one-shot mount listener, September 21, 2026

## Change under test

`ReservedRegionsView` still registers itself as a global `UIManagerListener` in
`onAttachedToWindow`, but it now removes that listener as soon as the first region snapshot has been
delivered from any measurement path, and it measures later React relayouts in
an `onLayout` override instead. `onLayout` deliberately does nothing until the
first mount snapshot has been delivered: measuring earlier would set `lastRegions`
and suppress the synchronous emit in `didMountItems`, and Fabric would then deliver
the queued copy a frame late. Pre-draw remains the catch-all.

## Configuration and build

- React Native 0.88.0-rc.1, Fabric; `reservedregions.example`.
- Emulator `emulator-5584`, AVD `stim-react-native-reserved-regions-example-f44c281f`,
  an ordinary phone profile, Android 16 (API 36), arm64-v8a, 1080 x 2400.
- Jetpack WindowManager extension level 9
  (`WindowExtensionsImpl: Initializing Window Extensions, vendor API level=9`).
- Display cutout emulated with
  `adb -s emulator-5584 shell cmd overlay enable com.android.internal.display.cutout.emulation.corner`,
  disabled again at the end of the session. This is an emulator override, not
  physical-device evidence. Enabling and disabling it restarts the Android
  framework on this emulator.
- Build and install, from `example/android`:
  `./gradlew :app:installDebug -PreactNativeArchitectures=arm64-v8a` →
  `BUILD SUCCESSFUL in 1m 15s`.
- Metro from the repository root on port 8095, reached from the device through
  the app's `debug_http_host` development setting. The emulator host also had
  another worktree's Metro on port 8081, which is the Android default; the
  development setting was pointed at 8095 so the recorded runs used this
  worktree's bundle. That setting was removed afterwards.

## Interactive check with the cutout enabled

Provider coordinates after a cold launch, read from the on-screen values:

| Layout      | Provider size, points | Regions                               |
| ----------- | --------------------- | ------------------------------------- |
| Full screen | 411.4 x 914.3         | occlusion x 363.4, y 0.0, 48.0 x 48.0 |
| Inset 24    | 363.4 x 790.5         | occlusion x 339.4, y 0.0, 24.0 x 24.0 |
| Content box | 363.4 x 634.3         | none; `No active reserved regions`    |

`Measurement: Ready` was present in the cold-launch snapshot and stayed present
across all three layout changes. The agent-device settle diffs for the Full
screen → Inset 24 → Content box → Full screen sequence listed only the provider
size, safe-area and region lines as changed; the `Measurement: Ready` line was
among the unchanged nodes in every step. The occlusion is clipped to the provider
when the provider is inset, and disappears when the provider no longer overlaps
the cutout.

Screenshots: `/tmp/rrr-evidence/01-full-screen.png`,
`/tmp/rrr-evidence/02-inset-24.png`, `/tmp/rrr-evidence/03-content-box.png`.

## First visible frame

Three cold launches were recorded with
`adb -s emulator-5584 shell screenrecord --bit-rate 12000000 --time-limit 14`,
each preceded by `am force-stop` and started with `am start -n
reservedregions.example/.MainActivity`. Every frame was decoded with
`ffmpeg -vsync 0 -frame_pts 0` and its presentation timestamp read with
`ffprobe -show_entries frame=pts_time`.

| Recording    | Frames | First app content frame | Content of that frame                  |
| ------------ | ------ | ----------------------- | -------------------------------------- |
| `cold-1.mp4` | 102    | 3.807178 s              | Ready, occlusion 363.4 / 0.0 / 48 x 48 |
| `cold-2.mp4` | 92     | 3.663789 s              | Ready, occlusion 363.4 / 0.0 / 48 x 48 |
| `cold-3.mp4` | 93     | 3.524178 s              | Ready, occlusion 363.4 / 0.0 / 48 x 48 |

In each recording the frames immediately before the first content frame are the
blank launch window: a cropped dark-pixel measurement of the title band reads
zero for those frames, so they cannot be a `Pending` render, which still draws the
title. No `Pending` frame appeared in any of the three recordings.

Artifacts: `/tmp/rrr-evidence/cold-1.mp4`, `cold-2.mp4`, `cold-3.mp4`, the decoded
frames under `/tmp/rrr-evidence/frames-cold-*/` with `timestamps.txt`, and the
cropped first-content frames `first-content-cold-1.png`, `first-content-cold-2.png`
and `first-content-cold-3.png`.

## Runtime state

Device logcat for the recorded launches contains no application crash, no React
Native error or warning overlay, and no repeated region updates that would
indicate a feedback loop. The pre-existing
`ViewManagerPropertyUpdater: Could not find generated setter` notice is unrelated
to this change.

Repository checks all passed on this branch: `format`, `format:check`, `lint`,
`typecheck`, `test` (7 tests), `build` and `docs:build`.

## Not established

- The listener removal itself was not observed directly. There is no logging or
  instrumentation in the shipped source, and a still-registered listener produces
  the same visible result, so this report shows the outcome, not the unregistration.
- The layout changes prove that regions still update after the first delivery, but
  they do not separate the new `onLayout` measurement from the existing pre-draw
  measurement. Either path alone would produce the same on-screen values here.
- Re-attach re-arming was not exercised. The example keeps one provider mounted
  for the lifetime of the screen, so the view never detached and re-attached.
- One emulator, one Android version, one WindowManager extension level, one
  window and an emulated cutout. No foldable, no physical device, and no iOS
  claim. The host was heavily loaded during this session, which lengthened launch
  times; the frame ordering is what this report relies on, not the absolute
  timings.
