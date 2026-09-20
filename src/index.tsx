import * as React from 'react';
import type { ViewProps } from 'react-native';
import { ReservedRegionsView } from './ReservedRegionsView';

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

const ReservedRegionsContext = React.createContext<readonly ReservedRegion[] | null>(null);

/** Makes active reserved regions available to descendants in provider coordinates. */
export function ReservedRegionsProvider({ children, ...props }: ViewProps): React.JSX.Element {
  const [regions, setRegions] = React.useState<readonly ReservedRegion[]>([]);

  return (
    <ReservedRegionsContext.Provider value={regions}>
      <ReservedRegionsView
        {...props}
        onRegionsChange={(event) => {
          setRegions(
            event.nativeEvent.regions.flatMap((region): ReservedRegion[] => {
              if (region.kind === 'division') {
                return [
                  {
                    kind: 'division' as const,
                    frame: region.frame,
                    occludesContent: region.occludesContent,
                  },
                ];
              }
              if (region.kind === 'occlusion') {
                return [{ kind: 'occlusion' as const, frame: region.frame }];
              }
              return [];
            }),
          );
        }}
      >
        {children}
      </ReservedRegionsView>
    </ReservedRegionsContext.Provider>
  );
}

/** Returns active regions reported by the nearest ReservedRegionsProvider. */
export function useReservedRegions(): readonly ReservedRegion[] {
  const regions = React.useContext(ReservedRegionsContext);
  if (regions === null) {
    throw new Error('useReservedRegions must be used inside ReservedRegionsProvider');
  }
  return regions;
}
