import {
  codegenNativeComponent,
  type CodegenTypes,
  type ViewProps,
} from 'react-native';

export type RegionsChangeEvent = Readonly<{
  regions: {
    kind: string;
    frame: {
      x: CodegenTypes.Double;
      y: CodegenTypes.Double;
      width: CodegenTypes.Double;
      height: CodegenTypes.Double;
    };
    occludesContent: boolean;
  }[];
}>;

export interface NativeProps extends ViewProps {
  onRegionsChange?: CodegenTypes.DirectEventHandler<RegionsChangeEvent>;
}

export default codegenNativeComponent<NativeProps>('ReservedRegionsView');
