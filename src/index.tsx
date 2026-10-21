import * as React from 'react';
import type { View, ViewProps } from 'react-native';
import { ReservedRegionsView } from './ReservedRegionsView';
import type { RegionsChangeEvent } from './ReservedRegionsViewNativeComponent';

/** A rectangle in logical points relative to the nearest ReservedRegionsProvider. Not clipped to the provider. */
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

/** Where the system places bar content of a given extent, such as the iPhone Duo status column. */
export type BarRegion = Readonly<{
  /** The layout-direction edge that holds the vertical bar. */
  edge: 'leading' | 'trailing';
  /** The bar layout region's bounds in the provider's coordinate space. */
  frame: ReservedRegionFrame;
}>;

/** Options for useBarRegion. */
export type BarRegionOptions = Readonly<{
  /** Width in points of the bar content to place, such as a 44-point button. */
  extent: number;
}>;

/** Props for ReservedRegionsProvider. */
type ReservedRegionsProviderProps = ViewProps & {
  /** Receives the provider's native view, for example to call `measure`. */
  ref?: React.Ref<React.ComponentRef<typeof View>>;
};

type MeasuredBar = Readonly<{ extent: number; region: BarRegion | null }>;

type ReservedRegionsSnapshot = Readonly<{
  regions: readonly ReservedRegion[];
  bars: readonly MeasuredBar[];
  isReady: boolean;
}>;

type ReservedRegionsContextValue = Readonly<{
  snapshot: ReservedRegionsSnapshot;
  registerBarExtent: (extent: number) => () => void;
}>;

const ReservedRegionsContext = React.createContext<ReservedRegionsContextValue | null>(null);

function useReservedRegionsContext(hookName: string): ReservedRegionsContextValue {
  const context = React.useContext(ReservedRegionsContext);
  if (context === null) {
    throw new Error(`${hookName} must be used inside ReservedRegionsProvider`);
  }
  return context;
}

/** Makes active reserved regions available to descendants in provider coordinates. */
export function ReservedRegionsProvider({ children, ...props }: ReservedRegionsProviderProps): React.JSX.Element {
  const [snapshot, setSnapshot] = React.useState<ReservedRegionsSnapshot>({ regions: [], bars: [], isReady: false });
  const [barExtents, setBarExtents] = React.useState<readonly number[]>([]);
  const barExtentCounts = React.useRef(new Map<number, number>());
  const registerBarExtent = React.useCallback((extent: number) => {
    const counts = barExtentCounts.current;
    const count = counts.get(extent) ?? 0;
    counts.set(extent, count + 1);
    if (count === 0) {
      setBarExtents([...counts.keys()]);
    }
    return () => {
      const remaining = (counts.get(extent) ?? 0) - 1;
      if (remaining > 0) {
        counts.set(extent, remaining);
        return;
      }
      counts.delete(extent);
      setBarExtents([...counts.keys()]);
    };
  }, []);
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
    const bars = (event.nativeEvent.bars ?? []).map((bar): MeasuredBar => ({
      extent: bar.extent,
      region: bar.edge === 'leading' || bar.edge === 'trailing' ? { edge: bar.edge, frame: bar.frame } : null,
    }));
    setSnapshot({ regions, bars, isReady: true });
  }, []);
  const context = React.useMemo(() => ({ snapshot, registerBarExtent }), [snapshot, registerBarExtent]);

  return (
    <ReservedRegionsContext.Provider value={context}>
      <ReservedRegionsView {...props} barExtents={barExtents} onRegionsChange={onRegionsChange}>
        {children}
      </ReservedRegionsView>
    </ReservedRegionsContext.Provider>
  );
}

/** Returns active regions reported by the nearest ReservedRegionsProvider. */
export function useReservedRegions(): readonly ReservedRegion[] {
  return useReservedRegionsContext('useReservedRegions').snapshot.regions;
}

/**
 * Whether the nearest provider has reported its first measurement, including an empty
 * result. Remains true for that provider's lifetime; does not imply platform support.
 */
export function useReservedRegionsReady(): boolean {
  return useReservedRegionsContext('useReservedRegionsReady').snapshot.isReady;
}

/**
 * Returns where the system places bar content of the given extent, such as the iPhone Duo
 * status column, in the nearest provider's coordinates. Returns null when no vertical bar
 * overlaps the provider, on platforms without vertical bars, and until the provider has
 * measured this extent, which happens one layout pass after the extent is first requested.
 */
export function useBarRegion({ extent }: BarRegionOptions): BarRegion | null {
  const { snapshot, registerBarExtent } = useReservedRegionsContext('useBarRegion');
  React.useLayoutEffect(() => registerBarExtent(extent), [registerBarExtent, extent]);
  return snapshot.bars.find((bar) => bar.extent === extent)?.region ?? null;
}

/** Renders children after the nearest provider reports its first measurement. */
export function ReservedRegionsGate({ children }: React.PropsWithChildren): React.ReactNode {
  return useReservedRegionsReady() ? children : null;
}
