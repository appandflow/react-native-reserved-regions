import { View, type ViewProps } from 'react-native';
import type { RegionsChangeEvent } from './ReservedRegionsViewNativeComponent';

export type ReservedRegionsViewProps = ViewProps & {
  onRegionsChange?: (event: { nativeEvent: RegionsChangeEvent }) => void;
};

export function ReservedRegionsView({
  onRegionsChange: _onRegionsChange,
  ...props
}: ReservedRegionsViewProps) {
  return <View {...props} />;
}
