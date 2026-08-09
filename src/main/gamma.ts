// Реализация гамма-функции Γ(z) — используется в формуле (12) статьи MasRouter
// для аппроксимации мультиномиального коэффициента:
//   C(k; n1,..nNm) ≈ Γ(δ(H)·γ+1) / [Γ(n1+1)·...·Γ(nNm+1)]
//
// Применяем Lanczos approximation (g=7, n=9) — стандарт для double precision.
// Это та же реализация, что в NumPy/SciPy по умолчанию.

const LANCZOS_G = 7;
const LANCZOS_COEF = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
  -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
  1.5056327351493116e-7
];

/**
 * Гамма-функция Γ(z) для вещественных z > 0.
 * Применяется Lanczos approximation.
 * @throws RangeError если z <= 0 (вне области определения для целых).
 */
export function gamma(z: number): number {
  if (Number.isNaN(z)) return NaN;
  if (z <= 0 && Number.isInteger(z)) {
    throw new RangeError(`gamma(${z}) is undefined for non-positive integers`);
  }
  if (z < 0.5) {
    // Reflection formula: Γ(z)·Γ(1-z) = π/sin(πz)
    return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  }
  z -= 1;
  let x = LANCZOS_COEF[0];
  for (let i = 1; i < LANCZOS_G + 2; i++) {
    x += LANCZOS_COEF[i] / (z + i);
  }
  const t = z + LANCZOS_G + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

/**
 * Multinomial coefficient через гамма-функцию.
 * C(n; n1,..nk) = Γ(n+1) / [Γ(n1+1)·...·Γ(nk+1)]
 * Используется для оценки "Topological Multiplier" в UI.
 */
export function multinomialGamma(n: number, ns: number[]): number {
  if (ns.some((v) => v < 0)) return 0;
  const sum = ns.reduce((a, b) => a + b, 0);
  if (sum !== n) return 0;
  const denom = ns.reduce((acc, v) => acc * gamma(v + 1), 1);
  return gamma(n + 1) / denom;
}

/**
 * Факториал через гамма: n! = Γ(n+1).
 */
export function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) {
    throw new RangeError(`factorial(${n}) requires non-negative integer`);
  }
  return gamma(n + 1);
}
