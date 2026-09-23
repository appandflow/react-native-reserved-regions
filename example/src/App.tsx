import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReservedRegionsProvider, useReservedRegions, useReservedRegionsReady } from 'react-native-reserved-regions';

const layouts = ['Full screen', 'Inset 24', 'Content box'] as const;
type Layout = (typeof layouts)[number];

function RegionInspector() {
  const regions = useReservedRegions();
  const isReady = useReservedRegionsReady();
  const insets = useSafeAreaInsets();
  const frame = useSafeAreaFrame();

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
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 24) + 24 }]}>
        <Text style={styles.title}>Reserved regions</Text>
        <Text style={styles.description}>
          Both providers use the blue rectangle. Green marks the safe area; orange marks divisions; purple marks
          occlusions.
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
      </ScrollView>
      <View pointerEvents="none" style={styles.boundary} />
    </>
  );
}

function Example() {
  const [layout, setLayout] = useState<Layout>('Full screen');
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <SafeAreaProvider
        style={[
          styles.provider,
          layout !== 'Full screen' && styles.inset,
          layout === 'Content box' && styles.contentBox,
        ]}
      >
        <ReservedRegionsProvider style={styles.regionProvider}>
          <RegionInspector />
        </ReservedRegionsProvider>
      </SafeAreaProvider>
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
