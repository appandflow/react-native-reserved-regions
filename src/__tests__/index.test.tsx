import * as React from 'react';
import { beforeEach, expect, it, jest } from '@jest/globals';
import { View } from 'react-native';
import { act, create } from 'react-test-renderer';
import {
  ReservedRegionsGate,
  ReservedRegionsProvider,
  useReservedRegions,
  useReservedRegionsReady,
  type ReservedRegion,
} from '../index';
import type { RegionsChangeEvent } from '../ReservedRegionsViewNativeComponent';

type Handler = (event: { nativeEvent: RegionsChangeEvent }) => void;
const mockHandlers = new Map<string, Handler>();

jest.mock('../ReservedRegionsView', () => ({
  ReservedRegionsView: ({
    children,
    onRegionsChange,
    testID = 'default',
    ref,
  }: {
    children: React.ReactNode;
    onRegionsChange: Handler;
    testID?: string;
    ref?: React.Ref<React.ComponentRef<typeof View>>;
  }) => {
    mockHandlers.set(testID, onRegionsChange);
    const { View: MockView } = jest.requireActual<typeof import('react-native')>('react-native');
    return <MockView ref={ref}>{children}</MockView>;
  },
}));
beforeEach(() => mockHandlers.clear());

const division = {
  kind: 'division',
  frame: { x: 100, y: 0, width: 0, height: 400 },
  occludesContent: false,
};

it('distinguishes pending from a measured empty result and keeps readiness after later changes', async () => {
  const observed: { regions: readonly ReservedRegion[]; isReady: boolean }[] = [];
  function Probe() {
    observed.push({ regions: useReservedRegions(), isReady: useReservedRegionsReady() });
    return null;
  }
  let renderer: ReturnType<typeof create>;
  await act(() => {
    renderer = create(
      <ReservedRegionsProvider>
        <Probe />
      </ReservedRegionsProvider>,
    );
  });
  expect(observed.at(-1)).toEqual({ regions: [], isReady: false });
  await act(() => mockHandlers.get('default')?.({ nativeEvent: { regions: [] } }));
  expect(observed.at(-1)).toEqual({ regions: [], isReady: true });
  await act(() => mockHandlers.get('default')?.({ nativeEvent: { regions: [division] } }));
  expect(observed.at(-1)).toEqual({ regions: [division], isReady: true });
  await act(() => mockHandlers.get('default')?.({ nativeEvent: { regions: [] } }));
  expect(observed.at(-1)).toEqual({ regions: [], isReady: true });
  expect(observed.every((snapshot) => snapshot.isReady || snapshot.regions.length === 0)).toBe(true);
  await act(() => renderer.unmount());
});

it('delays descendants until ready and resets when the provider remounts', async () => {
  const onMount = jest.fn();
  const onUnmount = jest.fn();

  function Child() {
    React.useEffect(() => {
      onMount();
      return () => {
        onUnmount();
      };
    }, []);

    return null;
  }

  const child = <Child />;
  const tree = (key: number) => (
    <ReservedRegionsProvider key={key}>
      <ReservedRegionsGate>{child}</ReservedRegionsGate>
    </ReservedRegionsProvider>
  );

  let renderer: ReturnType<typeof create>;
  await act(() => {
    renderer = create(tree(0));
  });
  expect(onMount).not.toHaveBeenCalled();

  await act(() => mockHandlers.get('default')?.({ nativeEvent: { regions: [] } }));
  expect(onMount).toHaveBeenCalledTimes(1);

  await act(() => mockHandlers.get('default')?.({ nativeEvent: { regions: [division] } }));
  expect(onMount).toHaveBeenCalledTimes(1);
  expect(onUnmount).not.toHaveBeenCalled();

  await act(() => {
    renderer!.update(tree(1));
  });
  expect(onUnmount).toHaveBeenCalledTimes(1);
  expect(onMount).toHaveBeenCalledTimes(1);

  await act(() => mockHandlers.get('default')?.({ nativeEvent: { regions: [] } }));
  expect(onMount).toHaveBeenCalledTimes(2);

  await act(() => renderer!.unmount());
});

it('reports provider-relative region kinds and occlusion flags in the first ready snapshot', async () => {
  const observed: { regions: readonly ReservedRegion[]; isReady: boolean }[] = [];
  function Probe() {
    observed.push({ regions: useReservedRegions(), isReady: useReservedRegionsReady() });
    return null;
  }
  let renderer: ReturnType<typeof create>;
  await act(() => {
    renderer = create(
      <ReservedRegionsProvider>
        <Probe />
      </ReservedRegionsProvider>,
    );
  });
  const occlusion = { kind: 'occlusion', frame: { x: 20, y: 5, width: 30, height: 10 }, occludesContent: false };
  await act(() => mockHandlers.get('default')?.({ nativeEvent: { regions: [division, occlusion] } }));
  expect(observed.at(-1)).toEqual({
    regions: [division, { kind: 'occlusion', frame: occlusion.frame }],
    isReady: true,
  });
  await act(() => renderer.unmount());
});

it('scopes readiness to the nearest provider and resets it for a newly mounted provider', async () => {
  const observed = new Map<string, { regions: readonly ReservedRegion[]; isReady: boolean }>();
  function Probe({ name }: { name: string }) {
    observed.set(name, { regions: useReservedRegions(), isReady: useReservedRegionsReady() });
    return null;
  }
  const inner = <Probe name="inner" />;
  const tree = (key: number) => (
    <ReservedRegionsProvider testID="outer">
      <Probe name="outer" />
      <ReservedRegionsProvider testID="inner" key={key}>
        {inner}
      </ReservedRegionsProvider>
    </ReservedRegionsProvider>
  );
  let renderer: ReturnType<typeof create>;
  await act(() => {
    renderer = create(tree(0));
  });
  await act(() => mockHandlers.get('outer')?.({ nativeEvent: { regions: [division] } }));
  expect(observed.get('outer')).toEqual({ regions: [division], isReady: true });
  expect(observed.get('inner')).toEqual({ regions: [], isReady: false });
  await act(() => mockHandlers.get('inner')?.({ nativeEvent: { regions: [] } }));
  expect(observed.get('inner')).toEqual({ regions: [], isReady: true });
  await act(() => renderer.update(tree(1)));
  expect(observed.get('inner')).toEqual({ regions: [], isReady: false });
  expect(observed.get('outer')).toEqual({ regions: [division], isReady: true });
  await act(() => renderer.unmount());
});

it('attaches a ref to the provider view', async () => {
  const ref = React.createRef<React.ComponentRef<typeof View>>();
  let renderer: ReturnType<typeof create>;
  await act(() => {
    renderer = create(<ReservedRegionsProvider ref={ref} />);
  });
  expect(ref.current).toBeInstanceOf(View);
  await act(() => renderer.unmount());
});

it.each([useReservedRegions, useReservedRegionsReady])('%p throws outside a provider', (useHook) => {
  function Probe() {
    useHook();
    return null;
  }
  expect(() => {
    act(() => {
      create(<Probe />);
    });
  }).toThrow(`${useHook.name} must be used inside ReservedRegionsProvider`);
});

it('the unsupported-platform view reports a known empty result', async () => {
  const { ReservedRegionsView } =
    jest.requireActual<typeof import('../ReservedRegionsView')>('../ReservedRegionsView.tsx');
  const onRegionsChange = jest.fn();
  let renderer: ReturnType<typeof create>;
  await act(() => {
    renderer = create(<ReservedRegionsView onRegionsChange={onRegionsChange} />);
  });
  expect(onRegionsChange).toHaveBeenCalledWith({ nativeEvent: { regions: [] } });
  await act(() => renderer.unmount());
});
