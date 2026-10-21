import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ReservedRegionsProvider,
  useBarRegion,
  useReservedRegions,
  useReservedRegionsReady,
  type BarRegion,
} from 'react-native-reserved-regions';

const layouts = ['Full screen', 'Shift 40', 'Inset 24', 'Content box'] as const;
type Layout = (typeof layouts)[number];
const barButtonSize = 44;

function describeBar(extent: number, bar: BarRegion | null) {
  if (bar === null) {
    return `Bar ${extent}: none`;
  }
  const { x, y, width, height } = bar.frame;
  return `Bar ${extent}: ${bar.edge} · x ${x.toFixed(1)} · y ${y.toFixed(1)} · ${width.toFixed(1)} × ${height.toFixed(1)}`;
}

function RegionInspector() {
  const regions = useReservedRegions();
  const isReady = useReservedRegionsReady();
  const insets = useSafeAreaInsets();
  const frame = useSafeAreaFrame();
  const bar = useBarRegion({ extent: barButtonSize });
  const wideBar = useBarRegion({ extent: 48 });
  const [barTaps, setBarTaps] = useState(0);

  return (
    <>
      <View
        pointerEvents="none"
        style={[
          styles.safeArea,
          {
            top: insets.top,
            right: insets.right,
            bottom: insets.bottom,
            left: insets.left,
          },
        ]}
      />
      <View pointerEvents="none" style={styles.overlays}>
        {regions.map((region, index) => (
          <View
            key={index}
            style={[
              styles.overlay,
              region.kind === 'division' ? styles.division : styles.occlusion,
              {
                left: region.frame.x,
                top: region.frame.y,
                width: region.frame.width || 2,
                height: region.frame.height || 2,
              },
            ]}
          />
        ))}
        {bar ? (
          <View
            style={[
              styles.overlay,
              styles.bar,
              { left: bar.frame.x, top: bar.frame.y, width: bar.frame.width, height: bar.frame.height },
            ]}
          />
        ) : null}
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 24) + 24 }]}>
        <Text style={styles.title}>Reserved regions</Text>
        <Text style={styles.description}>
          Both providers use the blue rectangle. Green marks the safe area; orange marks divisions; purple marks
          occlusions; teal marks the 44-point bar region, which holds the round button.
        </Text>
        <Text style={styles.metric}>
          Provider: {frame.width.toFixed(1)} × {frame.height.toFixed(1)}
        </Text>
        <Text style={styles.metric}>
          Safe area: top {insets.top.toFixed(1)} · right {insets.right.toFixed(1)} · bottom {insets.bottom.toFixed(1)} ·
          left {insets.left.toFixed(1)}
        </Text>

        <Text style={styles.metric}>Measurement: {isReady ? 'Ready' : 'Pending'}</Text>
        {!isReady ? (
          <Text style={styles.empty}>Waiting for the first measurement</Text>
        ) : regions.length === 0 ? (
          <Text style={styles.empty}>No active reserved regions</Text>
        ) : (
          regions.map((region, index) => (
            <Text key={index} style={styles.metric}>
              {region.kind} · x {region.frame.x.toFixed(1)} · y {region.frame.y.toFixed(1)} ·{' '}
              {region.frame.width.toFixed(1)} × {region.frame.height.toFixed(1)}
              {region.kind === 'division'
                ? ` · ${region.occludesContent ? 'occludes content' : 'content visible'}`
                : ''}
            </Text>
          ))
        )}
        <Text style={styles.metric}>{describeBar(barButtonSize, bar)}</Text>
        <Text style={styles.metric}>{describeBar(48, wideBar)}</Text>
        <Text style={styles.metric}>Bar button taps: {barTaps}</Text>
      </ScrollView>
      {bar ? (
        <Pressable
          accessibilityLabel="Bar button"
          accessibilityRole="button"
          onPress={() => setBarTaps((taps) => taps + 1)}
          style={[styles.barButton, { left: bar.frame.x + (bar.frame.width - barButtonSize) / 2, top: bar.frame.y }]}
        >
          <Text style={styles.barButtonText}>+</Text>
        </Pressable>
      ) : null}
      <View pointerEvents="none" style={styles.boundary} />
    </>
  );
}

function Example() {
  const [layout, setLayout] = useState<Layout>('Full screen');
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.provider,
          (layout === 'Inset 24' || layout === 'Content box') && styles.inset,
          layout === 'Content box' && styles.contentBox,
        ]}
      >
        <ReservedRegionsProvider style={[styles.regionProvider, layout === 'Shift 40' && styles.shifted]}>
          <SafeAreaProvider>
            <RegionInspector />
          </SafeAreaProvider>
        </ReservedRegionsProvider>
      </View>
      <View style={[styles.controls, { bottom: Math.max(insets.bottom, 16) }]}>
        {layouts.map((option) => (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: layout === option }}
            onPress={() => setLayout(option)}
            style={[styles.button, layout === option && styles.selectedButton]}
          >
            <Text style={[styles.buttonText, layout === option && styles.selectedButtonText]}>{option}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Example />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#dce4ef',
  },
  provider: {
    ...StyleSheet.absoluteFill,
  },
  inset: {
    top: 24,
    left: 24,
    right: 24,
    bottom: 100,
  },
  contentBox: {
    top: 180,
  },
  shifted: {
    marginLeft: 40,
    marginRight: -40,
  },
  regionProvider: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  content: {
    padding: 24,
    paddingBottom: 120,
    gap: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#14213d',
  },
  description: {
    fontSize: 15,
    color: '#3b4c66',
  },
  metric: {
    fontSize: 14,
    color: '#14213d',
  },
  empty: {
    fontSize: 14,
    color: '#65758b',
  },
  boundary: {
    ...StyleSheet.absoluteFill,
    borderWidth: 2,
    borderColor: '#3066be',
  },
  safeArea: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#24804b',
  },
  overlays: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
  },
  division: {
    backgroundColor: '#d8693799',
  },
  occlusion: {
    backgroundColor: '#7f3fbd99',
  },
  bar: {
    backgroundColor: '#1f9e8a66',
  },
  barButton: {
    position: 'absolute',
    width: barButtonSize,
    height: barButtonSize,
    borderRadius: barButtonSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14213d',
  },
  barButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
  },
  controls: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#b8c7dc',
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  selectedButton: {
    backgroundColor: '#3066be',
  },
  buttonText: {
    color: '#244a80',
    fontWeight: '600',
    fontSize: 13,
  },
  selectedButtonText: {
    color: '#ffffff',
  },
});
