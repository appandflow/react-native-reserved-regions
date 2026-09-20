import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ReservedRegionsProvider,
  useReservedRegions,
} from 'react-native-reserved-regions';

function RegionInspector() {
  const regions = useReservedRegions();
  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Reserved regions</Text>
        <Text style={styles.description}>
          Active divisions and occlusions relative to the bordered provider.
        </Text>
        {regions.length === 0 ? (
          <Text style={styles.empty}>No active reserved regions</Text>
        ) : (
          regions.map((region, index) => (
            <Text key={index} style={styles.region}>
              {region.kind} · x {region.frame.x.toFixed(1)} · y{' '}
              {region.frame.y.toFixed(1)} · {region.frame.width.toFixed(1)} ×{' '}
              {region.frame.height.toFixed(1)}
              {region.kind === 'division'
                ? ` · ${region.occludesContent ? 'occludes content' : 'content visible'}`
                : ''}
            </Text>
          ))
        )}
      </ScrollView>
      {regions.map((region, index) => (
        <View
          key={index}
          pointerEvents="none"
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
    </>
  );
}

export default function App() {
  return (
    <ReservedRegionsProvider style={styles.container}>
      <RegionInspector />
    </ReservedRegionsProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#3066be',
    backgroundColor: '#f7f9fc',
  },
  content: {
    padding: 32,
    paddingTop: 72,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#14213d',
  },
  description: {
    fontSize: 16,
    color: '#3b4c66',
  },
  empty: {
    fontSize: 16,
    color: '#65758b',
  },
  region: {
    fontSize: 14,
    color: '#14213d',
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
});
