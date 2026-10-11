import { deriveWorld, type TimeFoldState } from './timefold.ts';

export type EraVisual = Readonly<{
  era: 'past' | 'present' | 'future';
  label: string;
  year: string;
  x: number;
  state: TimeFoldState;
  powered: boolean;
  aimed: boolean;
  signalRecovered: boolean;
  status: string;
}>;

export function buildEraVisuals(state: TimeFoldState): readonly [EraVisual, EraVisual, EraVisual] {
  const world = deriveWorld(state);
  const base = { state, ...world };
  return [
    { ...base, era: 'past', label: 'PAST / EDITABLE', year: '1986', x: -1.15, status: 'Every repair begins here' },
    { ...base, era: 'present', label: 'PRESENT / DERIVED', year: '2026', x: 0, status: world.aimed ? 'Instrument aligned' : world.powered ? 'Motor energized' : 'Mechanism silent' },
    { ...base, era: 'future', label: 'FUTURE / DERIVED', year: '2086', x: 1.15, status: world.signalRecovered ? 'Lost signal recovered' : world.powered ? 'Beacon illuminated' : 'A future waiting for light' },
  ];
}
