import type { ColorValue, ViewProps } from 'react-native';

type Props = ViewProps & {
  color?: ColorValue;
};

export function ReservedRegionsView(_props: Props): never {
  throw new Error(
    "'react-native-reserved-regions' is only supported on native platforms."
  );
}
