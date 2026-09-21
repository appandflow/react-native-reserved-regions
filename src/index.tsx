import * as React from 'react';
import type { ViewProps } from 'react-native';
import { ReservedRegionsView } from './ReservedRegionsView';
import type { RegionsChangeEvent } from './ReservedRegionsViewNativeComponent';

/** A rectangle in logical points relative to the nearest ReservedRegionsProvider. */
export type ReservedRegionFrame = Readonly<{
  /** Distance from the provider's left edge. */
  x: number;
  /** Distance from the provider's top edge. */
  y: number;
  /** Horizontal extent of the reserved area. */
  width: number;
  /** Vertical extent of the reserved area. */
  height: number;
}>;

/** An active area reserved by the display or system UI. */
export type ReservedRegion =
  | Readonly<{
      /** A seam or fold that divides the usable display. */
      kind: 'division';
      /** The division's bounds in the provider's coordinate space. */
      frame: ReservedRegionFrame;
      /** Whether content underneath the division is hidden. */
      occludesContent: boolean;
    }>
  | Readonly<{
      /** An area where content is hidden, such as a camera cutout. */
      kind: 'occlusion';
      /** The occlusion's bounds in the provider's coordinate space. */
      frame: ReservedRegionFrame;
    }>;

type ReservedRegionsSnapshot = Readonly<{
  regions: readonly ReservedRegion[];
  isReady: boolean;
}>;

const ReservedRegionsContext = React.createContext<ReservedRegionsSnapshot | null>(null);

/** Makes active reserved regions available to descendants in provider coordinates. */
export function ReservedRegionsProvider({ children, ...props }: ViewProps): React.JSX.Element {
  const [snapshot, setSnapshot] = React.useState<ReservedRegionsSnapshot>({ regions: [], isReady: false });
  const onRegionsChange = React.useCallback((event: { nativeEvent: RegionsChangeEvent }) => {
    const regions = event.nativeEvent.regions.flatMap((region): ReservedRegion[] => {
      if (region.kind === 'division') {
        return [{ kind: 'division', frame: region.frame, occludesContent: region.occludesContent }];
      }
      if (region.kind === 'occlusion') {
        return [{ kind: 'occlusion', frame: region.frame }];
      }
      return [];
    });
    setSnapshot({ regions, isReady: true });
  }, []);

  return (
    <ReservedRegionsContext.Provider value={snapshot}>
      <ReservedRegionsView {...props} onRegionsChange={onRegionsChange}>
        {children}
      </ReservedRegionsView>
    </ReservedRegionsContext.Provider>
  );
}

/** Returns active regions reported by the nearest ReservedRegionsProvider. */
export function useReservedRegions(): readonly ReservedRegion[] {
  const snapshot = React.useContext(ReservedRegionsContext);
  if (snapshot === null) {
    throw new Error('useReservedRegions must be used inside ReservedRegionsProvider');
  }
  return snapshot.regions;
}

/**
 * Whether the nearest provider has reported its first measurement, including an empty
 * result. Remains true for that provider's lifetime; does not imply platform support.
 */
export function useReservedRegionsReady(): boolean {
  const snapshot = React.useContext(ReservedRegionsContext);
  if (snapshot === null) {
    throw new Error('useReservedRegionsReady must be used inside ReservedRegionsProvider');
  }
  return snapshot.isReady;
}
