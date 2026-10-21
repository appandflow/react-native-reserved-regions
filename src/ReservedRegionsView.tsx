import { useEffect } from 'react';
import { View, type ViewProps } from 'react-native';
import type { RegionsChangeEvent } from './ReservedRegionsViewNativeComponent';

export type ReservedRegionsViewProps = ViewProps & {
  barExtents?: readonly number[];
  onRegionsChange?: (event: { nativeEvent: RegionsChangeEvent }) => void;
};

export function ReservedRegionsView({ onRegionsChange, barExtents: _barExtents, ...props }: ReservedRegionsViewProps) {
  useEffect(() => {
    onRegionsChange?.({ nativeEvent: { regions: [], bars: [] } });
  }, [onRegionsChange]);
  return <View {...props} />;
}
