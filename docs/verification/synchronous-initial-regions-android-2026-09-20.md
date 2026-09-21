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

## Baseline cold-launch frames before the mount-timing fix

The recorded cold launch contains a visible Pending frame before Ready:

| Video presentation timestamp | Captured content                                                            |
| ---------------------------- | --------------------------------------------------------------------------- |
| 2.798133 seconds             | Measurement: Pending; Waiting for the first measurement; no region overlays |
| 2.812733 seconds             | Measurement: Ready; division and occlusion values and overlays present      |

The recorded frames are **14.600 ms apart**. A coarse 5 Hz contact sheet missed the Pending frame; the individual decoded source frames establish this startup gap.

Device logcat reports `WindowExtensionsImpl: Initializing Window Extensions, vendor API level=9` for this launch. The implementation therefore has the synchronous current-layout query available. This observation cannot be attributed solely to the older-extension callback-only path. The native/event timing investigation below identifies the scheduling boundary.

The baseline Android implementation **did not provide correct region geometry on the first visible frame** in this test. It does transition from Pending to Ready without needing the device to move, and consumers can distinguish that pending state from a known empty result.

## Confirmed timing cause and fix

Temporary native tracing on the same foldable cold launch established this order:

| Local device timestamp | Native phase                                             |
| ---------------------- | -------------------------------------------------------- |
| 21:01:47.462           | Fabric mount completes; event beat runs                  |
| 21:01:47.462           | Android pre-draw begins                                  |
| 21:01:47.463           | Regions event dispatches with its Fabric emitter present |
| 21:01:47.463           | First native draw                                        |
| 21:01:47.507           | Next event beat and draw                                 |

The synchronous flag requests synchronous processing at the event beat; pre-draw has already missed that frame's beat. An earlier `onLayout` experiment was also insufficient: Fabric had not installed the view's emitter at that point, so its synchronous receive path fell back to asynchronous dispatch. The ordinary emulator reproduced both facts.

The fix measures in `UIManagerListener.didMountItems`, after Fabric has installed emitters and before its event beat. Attach/detach register and remove that listener. Pre-draw remains necessary for ancestor scrolling and native changes outside React mounting. All temporary reflection and logging were removed.

The [upstream safe-area proposal](https://github.com/facebook/react-native/pull/58109) uses the same synchronous event flag. Its observer can attach and measure an already-laid-out view during a prop update, which occurs before the event beat. That explains why this path can behave differently from first attaching a new, zero-sized provider. The upstream proposal itself was inspected, not built or independently runtime-tested here.

The final source compiled through Stim in 1.4 seconds. Android still uses the React Native 0.88.0-rc.1 precompiled AAR; this result does not depend on recompiling the example's separate C++ React Native source patch.

## Final cold-launch verification

Three cold launches with the final production source showed Ready in their first captured content frame. Adjacent decoded source frames were inspected; no Pending content frame appeared.

| Recording           | Device        | First captured content timestamp | Regions                       |
| ------------------- | ------------- | -------------------------------- | ----------------------------- |
| `fold-final-1.mp4`  | emulator-5580 | 2.547689 s                       | Division and corner occlusion |
| `fold-final-2.mp4`  | emulator-5580 | 3.029356 s                       | Division and corner occlusion |
| `phone-final-1.mp4` | emulator-5584 | 1.667122 s                       | Top cutout occlusion          |

The Full screen → Inset 24 → Content box sequence retained the provider coordinates listed above. The ordinary Content box still reported Ready with an empty array. There was no crash or update loop, and the fresh client warning/error query was empty.

These are observed first-content-frame results on Android 16 emulators with Window SDK extension 9, not a general first-frame guarantee. Older extensions can await their first asynchronous WindowManager callback. OS-only scrolling or window changes measured during pre-draw can still reach React after that frame's beat. Physical devices, other extension versions and multiple windows remain untested.

## Runtime errors and evidence

The fresh client warning/error query (`stim logs --source client --level warn --since 2m --json`) exited 0 with empty output after the correct bundle was loaded. No application crash or synchronous update feedback loop was observed during layout changes and the recorded cold launch.

Task artifacts are under `regions-ready-android`: `known-empty.txt`, `fold-full.txt/png`, `fold-inset.txt`, `fold-content-box.txt/png`, `cold-launch.mp4`, `cold-launch.txt`, `cold-pending-2.798133.png`, `cold-ready-2.812733.png`, `cold-frame-timestamps.txt` and `client-warnings.ndjson`.

Additional task artifacts under `regions-layout-timing` contain the bounded native traces, three final videos, extracted first-content PNGs, adjacent source-frame contact sheets and timestamps, final provider snapshots, and `final-client-warnings.ndjson`. This report makes no iOS claim.
