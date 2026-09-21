import { useEffect } from 'react';
import { View, type ViewProps } from 'react-native';
import type { RegionsChangeEvent } from './ReservedRegionsViewNativeComponent';

export type ReservedRegionsViewProps = ViewProps & {
  onRegionsChange?: (event: { nativeEvent: RegionsChangeEvent }) => void;
};

export function ReservedRegionsView({ onRegionsChange, ...props }: ReservedRegionsViewProps) {
  useEffect(() => {
    onRegionsChange?.({ nativeEvent: { regions: [] } });
  }, [onRegionsChange]);
  return <View {...props} />;
}
