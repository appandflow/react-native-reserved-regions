# Development workflow

## Set up

The repository uses pnpm 12, TypeScript 7, Oxlint and Oxfmt. The root package is
the publishable library. `example/` and `website/` are private pnpm workspaces.
The hoisted linker keeps the React Native native build paths predictable.

```sh
corepack enable
pnpm install --frozen-lockfile
```

Use the Node version in `.nvmrc`. Build scripts use Bob; unit tests use Jest and
the React Native preset. The example uses React Native 0.88.0-rc.1 and Fabric.

## Plan and implement

1. Reproduce the behavior and identify the affected platform/API.
2. Search existing repository issues and PRs before opening duplicate work.
3. Create a focused `@janic/<change>` branch. Use an isolated worktree when another
   task is using the checkout; preserve its uncommitted work.
4. State what observable check will establish success, then implement the change.
5. Update TypeScript field documentation and the relevant website guide.

Separate unrelated changes and include a regression test when it catches a real
failure. For provider geometry, compare native frames with the visible overlay.

## Checks

```sh
pnpm run format
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm test
pnpm run build
pnpm run docs:build
pnpm pack --pack-destination artifacts
node scripts/check-package.mjs artifacts/*.tgz
```

Use an empty `artifacts/` directory for each candidate so the check receives one
tarball. Generated artifacts, Pods, native builds and documentation builds are
ignored. Commit the pnpm lockfile whenever dependencies change.

## Native verification

If Stim is not installed globally, replace `stim` below with `npx stim`.

```sh
cd example
stim doctor --platform ios
stim doctor --platform android
stim start
stim ios
stim android
stim logs --errors
```

For Duo, use Xcode 27.1 beta and an installed iOS 27.1 runtime:

```sh
DEVELOPER_DIR=/Applications/Xcode-27.1.0-Beta.app/Contents/Developer \
  stim ios --device-type 'iPhone Duo' --runtime 27.1
```

The library compiles with older SDKs, but the iOS 27.1 functionality is compiled
out when those declarations are absent. Test older-runtime fallback separately
from the iOS 27.1 implementation. A generic simulator build in CI verifies
compilation; it does not prove Duo behavior.

The example offers full-screen, shifted, inset and content-box providers and displays
safe-area-context values for comparison. Verify provider-relative coordinates,
unclipped frames that extend past the provider, empty results outside a region,
and line-shaped divisions.
On Android, use a foldable emulator to exercise native folding features and a
cutout to exercise occlusions. Record the emulator posture and runtime.

### Automated Android check

```sh
export ANDROID_HOME="$HOME/Library/Android/sdk"
E2E_ANDROID_SERIAL=emulator-5554 pnpm run e2e:android
```

`e2e/android.mjs` builds and installs the example release variant, so the run does
not need a Metro server. It puts the emulator in device state 1 with the corner
display-cutout overlay enabled, waits for the app to become launchable, and cold
launches it. On the Full screen layout it asserts that the measurement reports
Ready, that there is exactly one division and that the division is a line at
most 1 point wide (the foldable emulator reports a one-pixel hinge) whose x is
between 40 and 60 percent of the provider width and whose height matches the
provider height within 2 points, and that there is exactly one
occlusion whose frame sits in the provider top-right corner. It then taps Content
box and asserts Ready, one remaining division and no occlusion. A screenshot of
each asserted state is written to the ignored `e2e/artifacts/` directory, and a
failure prints the accessibility snapshot before exiting non-zero. The posture
and cutout overlay are left in place afterwards, because disabling the overlay
restarts the Android framework.

`E2E_ANDROID_SERIAL` is required when more than one device is attached. Set
`E2E_SKIP_BUILD=1` to reuse the installed APK. The emulator needs a hinge, because
a device without one has no device state 1. The same script runs in the opt-in
`e2e-android` GitHub Actions workflow, which is triggered manually or by adding the
`e2e-android` label to a pull request.

### Automated iOS check

```sh
DEVELOPER_DIR=/Applications/Xcode-27.1.0-Beta.app/Contents/Developer pnpm run e2e:ios
```

Prerequisites:

- Xcode 27.1 beta from [developer.apple.com](https://developer.apple.com/download/applications/),
  selected through `DEVELOPER_DIR` or `xcode-select`. It provides the iPhone Duo
  device type.
- The iOS 27.1 simulator runtime, installed with `xcodebuild -downloadPlatform iOS`
  using the same `DEVELOPER_DIR`.
- agent-device 0.21.12 or newer on `PATH`, for its `fold` command.
- CocoaPods installed in `example/`, as described below.

The script checks the Xcode version, the iPhone Duo device type, the runtime and
the agent-device version first and exits with a message naming the missing piece.
It reuses or creates an iPhone Duo simulator named `Reserved Regions E2E`, boots it
headless with `simctl`, builds and installs the example Release configuration, so
the run does not need a Metro server, and opens the app. It then opens the hinge to
130° with `agent-device fold` and asserts from the on-screen text:

- Full screen: the measurement reports Ready, there is exactly one division whose
  center is between 45 and 55 percent of the provider width, whose y is 0 and whose
  height matches the provider height within 2 points, and exactly one occlusion in
  the provider top-right corner.
- Shift 40: the provider size is unchanged and the division x is the full-screen x
  minus 40 within 1 point.
- Content box: one division with a negative y and a height larger than the
  provider, so the frame is not clipped, and no occlusion.
- Inset 24: opening to 180° removes the division without changing the provider
  size, and folding back to 130° restores the same division with the same provider
  size.

Each screen is read after two consecutive identical snapshots. A screenshot of each
asserted state is written to the ignored `e2e/artifacts/` directory, and a failure
prints the accessibility snapshot before exiting non-zero. The simulator stays
booted in its last posture; other simulators are not touched.

Set `E2E_IOS_UDID` to use an existing iPhone Duo simulator on iOS 27.1 or newer, and
`E2E_SKIP_BUILD=1` to reuse the installed app. This check has no workflow in the
repository. The GitHub-hosted `xcode-27-xlarge` runner can run it after
`xcodebuild -downloadPlatform iOS`; the standard `xcode-27` runner stops responding
after booting the iPhone Duo.

Use the device ID reported by Stim for app automation and screenshots. Some Duo
capture tools default to the inactive display; enumerate displays with
`xcrun simctl io <udid> enumerate` and choose the active display explicitly.
Device screen power is not proof of a fold posture change.

After retaining screenshots and logs, use `stim stop` from the example to stop
only its owned local resources.

For CocoaPods, use a Ruby version compatible with `example/Gemfile`, then run
`bundle install` and `bundle exec pod install --project-directory=ios` from
`example/`. Set `LANG=en_US.UTF-8` and `LC_ALL=en_US.UTF-8`.

To test same-frame delivery of the first iOS event, apply
[react/react-native#58530](https://github.com/react/react-native/pull/58530) to the
example's React Native manually, for example with `pnpm patch react-native`, and
reinstall pods with `RCT_USE_PREBUILT_RNCORE=0`; the prebuilt React Native core does
not contain that change.

## Pull requests

Before committing, run all checks above and the native builds affected by the
diff. Use conventional commit prefixes. Open a draft PR with a concise behavior
summary, testing evidence and any unavailable validation. Keep screenshots with
the review when the example UI changes. Resolve actionable review findings and
rerun affected checks. Merge only after required CI passes and a maintainer
has authorized the merge.

On pull requests, CI skips the `ios` and `android` jobs when the diff touches no
files that affect that platform's build; the path lists are in the `changes` job
of `.github/workflows/ci.yml`. Pushes to `main`, merge queue runs, manual runs and
the Release workflow always build both platforms.

## Documentation

```sh
pnpm run docs:start
pnpm run docs:build
```

Docusaurus serves the site locally; building it does not deploy it. Preview the
landing page and API documentation at desktop and mobile widths after UI edits.
