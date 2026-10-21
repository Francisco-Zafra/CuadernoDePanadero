import { describe, expect, it } from 'vitest';
import { normalizeProcess } from '../data/normalize';
import { stepDetail } from '../components/bakeText';
import { newStep } from './defaults';
import { bakeStages, foldsDurationMin, stagesDurationMin } from './process';

describe('folds', () => {
  it('spans count × interval once both are known', () => {
    expect(foldsDurationMin(3, 20)).toBe(60);
    expect(foldsDurationMin(3, null)).toBeNull();
    expect(foldsDurationMin(null, 20)).toBeNull();
  });

  it('keeps fold fields only on folds steps', () => {
    const [folds, mix] = normalizeProcess([
      { id: 'a', kind: 'folds', foldCount: 3, foldEveryMin: 20, durationMin: 60 },
      { id: 'b', kind: 'mix', foldCount: 3 },
    ]);
    expect(folds).toMatchObject({ foldCount: 3, foldEveryMin: 20, durationMin: 60 });
    expect(mix).not.toHaveProperty('foldCount');
  });
});

describe('bake stages', () => {
  const stages = [
    { min: 20, tempC: 230, note: 'tapa cerrada' },
    { min: 10, tempC: 200, note: 'tapa abierta' },
  ];

  it('adds up the stretches and describes them in order', () => {
    expect(stagesDurationMin(stages)).toBe(30);
    expect(stepDetail(newStep('bake', { stages }))).toBe(
      '20 min a 230 °C, tapa cerrada · 10 min a 200 °C, tapa abierta',
    );
  });

  it('reads an old bake step as a single stretch', () => {
    expect(bakeStages(newStep('bake', { durationMin: 40, tempC: 250 }))).toEqual([
      { min: 40, tempC: 250, note: '' },
    ]);
  });

  it('keeps stages through normalization', () => {
    const [bake] = normalizeProcess([{ id: 'x', kind: 'bake', stages }]);
    expect(bake?.stages).toEqual(stages);
  });
});
