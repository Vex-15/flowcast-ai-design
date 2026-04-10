declare module 'ml-regression-simple-linear' {
  export class SimpleLinearRegression {
    constructor(x: number[], y: number[]);
    predict(x: number): number;
    score(x: number[], y: number[]): { r: number, r2: number, chi2: number, rmsd: number };
    slope: number;
    intercept: number;
    toString(fractionDigits?: number): string;
  }
}
