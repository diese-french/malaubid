import {
  calculateScale,
  formatAmount,
  scaleAmount,
} from '../lib/recipes/domain';
import type { Amount } from '../lib/recipes/types';

export function applyYieldScale(
  container: HTMLElement,
  targetYield: number,
): boolean {
  const baseYield = Number(container.dataset.baseYield);
  const scale = calculateScale(targetYield, baseYield);
  if (scale === null) return false;

  for (const element of container.querySelectorAll<HTMLElement>(
    '[data-base-amount]',
  )) {
    const serializedAmount = element.dataset.baseAmount;
    if (!serializedAmount) continue;
    const amount = JSON.parse(serializedAmount) as Amount;
    element.textContent = formatAmount(scaleAmount(amount, scale));
  }
  return true;
}

export function initializeQuantityScalers(root: ParentNode = document): void {
  for (const container of root.querySelectorAll<HTMLElement>(
    '[data-recipe-scaler]',
  )) {
    const input =
      container.querySelector<HTMLInputElement>('[data-yield-input]');
    const reset =
      container.querySelector<HTMLButtonElement>('[data-yield-reset]');
    const status = container.querySelector<HTMLElement>('[data-yield-status]');
    if (!input || !reset || !status) continue;

    const update = (): void => {
      const target = input.valueAsNumber;
      if (!applyYieldScale(container, target)) {
        input.setAttribute('aria-invalid', 'true');
        status.textContent = 'Saisissez une quantité supérieure à zéro.';
        return;
      }
      input.removeAttribute('aria-invalid');
      status.textContent = `Quantités recalculées pour ${input.value} ${input.dataset.yieldLabel ?? ''}.`;
    };

    input.addEventListener('input', update);
    reset.addEventListener('click', () => {
      input.value = container.dataset.baseYield ?? '';
      update();
      input.focus();
    });
  }
}

initializeQuantityScalers();
