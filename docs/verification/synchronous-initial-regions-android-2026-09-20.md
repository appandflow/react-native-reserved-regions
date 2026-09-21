# Android initial region readiness — September 20, 2026

## Configuration and build

- React Native 0.88.0-rc.1; Android 16/API 36.
- `reservedregions.example`, Metro 8089.
- Stim-owned ordinary emulator `emulator-5584`; this task's existing foldable emulator `emulator-5580`.
- Foldable test settings: HALF_OPENED posture, zero-width fold at pixel x=1038 and corner display-cutout overlay. These are emulator overrides, not physical-device evidence.

Stim compiled the current readiness implementation in 3.4 seconds, installed and launched on emulator-5584, and verified the bundle and live process. The same APK was installed on emulator-5580. The ordinary emulator showed a boot-time system-process ANR dialog; choosing Wait dismissed it and the app remained interactive. The foldable automation session initially retained another project's Metro port; explicitly binding it to 8089 restored the correct app bundle.

## Readiness and provider coordinates

Cold launching on the foldable emulator, without changing the hinge or posture afterward, produced Ready with both a non-occluding division and a display-cutout occlusion.

| Provider    | Size, points  | Division                            | Occlusion                     |
| ----------- | ------------- | ----------------------------------- | ----------------------------- |
| Full screen | 851.7 × 882.9 | x=425.8, y=0, width=0, height=882.9 | x=803.7, y=0, 48.0 × 48.0     |
| Inset 24    | 803.7 × 758.6 | x=401.6, y=0, width=0, height=758.6 | x=779.5, y=0, 24.2 × 23.8     |
| Content box | 803.7 × 602.7 | x=401.6, y=0, width=0, height=602.7 | None; outside provider bounds |

Native pixel rounding explains the fractional point offsets. Zero-width divisions survived clipping. Changing provider layout updated the coordinates and retained Ready without a feedback loop or additional hinge movement.

On emulator-5584, Content box showed **Measurement: Ready** and **No active reserved regions**. Its provider was 363.4 × 634.3 points with zero safe-area insets. This verifies that a known empty result is distinct from Pending.

## Exact cold-launch frames

The recorded cold launch contains a visible Pending frame before Ready:

| Video presentation timestamp | Captured content                                                            |
| ---------------------------- | --------------------------------------------------------------------------- |
| 2.798133 seconds             | Measurement: Pending; Waiting for the first measurement; no region overlays |
| 2.812733 seconds             | Measurement: Ready; division and occlusion values and overlays present      |

The recorded frames are **14.600 ms apart**. A coarse 5 Hz contact sheet missed the Pending frame; the individual decoded source frames establish this startup gap.

Device logcat reports `WindowExtensionsImpl: Initializing Window Extensions, vendor API level=9` for this launch. The implementation therefore has the synchronous current-layout query available. This observation cannot be attributed solely to the older-extension callback-only path. Native/event timestamp instrumentation was not added, so the specific mount, pre-draw or React scheduling boundary responsible remains unproven.

The Android implementation **does not guarantee correct region geometry on the first visible frame** in this test. It does transition from Pending to Ready without needing the device to move, and consumers can distinguish that pending state from a known empty result.

## Runtime errors and evidence

The fresh client warning/error query (`stim logs --source client --level warn --since 2m --json`) exited 0 with empty output after the correct bundle was loaded. No application crash or synchronous update feedback loop was observed during layout changes and the recorded cold launch.

Task artifacts are under `regions-ready-android`: `known-empty.txt`, `fold-full.txt/png`, `fold-inset.txt`, `fold-content-box.txt/png`, `cold-launch.mp4`, `cold-launch.txt`, `cold-pending-2.798133.png`, `cold-ready-2.812733.png`, `cold-frame-timestamps.txt` and `client-warnings.ndjson`.

Other Window SDK extension versions, physical devices, multiple windows and repeated-launch statistics were not tested. This report makes no iOS claim.
