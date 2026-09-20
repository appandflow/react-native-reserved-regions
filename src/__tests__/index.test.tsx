import * as React from 'react';
import { expect, it, jest } from '@jest/globals';
import { act, create } from 'react-test-renderer';
import { ReservedRegionsProvider, useReservedRegions, type ReservedRegion } from '../index';
import type { RegionsChangeEvent } from '../ReservedRegionsViewNativeComponent';

let mockOnRegionsChange: ((event: { nativeEvent: RegionsChangeEvent }) => void) | undefined;

jest.mock('../ReservedRegionsView', () => ({
  ReservedRegionsView: ({
    children,
    onRegionsChange,
  }: {
    children: React.ReactNode;
    onRegionsChange: typeof mockOnRegionsChange;
  }) => {
    mockOnRegionsChange = onRegionsChange;
    return children;
  },
}));

it('reports provider-relative region kinds and occlusion flags', async () => {
  const observed: (readonly ReservedRegion[])[] = [];
  function Probe() {
    observed.push(useReservedRegions());
    return null;
  }

  await act(async () => {
    create(
      <ReservedRegionsProvider>
        <Probe />
      </ReservedRegionsProvider>,
    );
  });
  expect(observed.at(-1)).toEqual([]);

  await act(async () => {
    mockOnRegionsChange?.({
      nativeEvent: {
        regions: [
          {
            kind: 'division',
            frame: { x: 100, y: 0, width: 0, height: 400 },
            occludesContent: false,
          },
          {
            kind: 'occlusion',
            frame: { x: 20, y: 5, width: 30, height: 10 },
            occludesContent: false,
          },
        ],
      },
    });
  });

  expect(observed.at(-1)).toEqual([
    {
      kind: 'division',
      frame: { x: 100, y: 0, width: 0, height: 400 },
      occludesContent: false,
    },
    {
      kind: 'occlusion',
      frame: { x: 20, y: 5, width: 30, height: 10 },
    },
  ]);
});
