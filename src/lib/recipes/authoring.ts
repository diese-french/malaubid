import type { UnitCode } from './units';
import type { Amount } from './types';

type ExactAmountInput = {
  type?: 'exact' | undefined;
  value: number;
  unit?: UnitCode | undefined;
};
type RangeAmountInput = {
  type?: 'range' | undefined;
  min: number;
  max: number;
  unit?: UnitCode | undefined;
};
type QualitativeAmountInput = {
  type?: 'qualitative' | undefined;
  text: string;
};

export type AmountInput =
  ExactAmountInput | RangeAmountInput | QualitativeAmountInput;

export function normalizeAmount(input: AmountInput): Amount {
  if ('value' in input) {
    return {
      type: 'exact',
      value: input.value,
      ...(input.unit ? { unit: input.unit } : {}),
    };
  }
  if ('min' in input) {
    return {
      type: 'range',
      min: input.min,
      max: input.max,
      ...(input.unit ? { unit: input.unit } : {}),
    };
  }
  return { type: 'qualitative', text: input.text };
}
