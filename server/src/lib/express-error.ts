export class ExpressError extends Error {
  constructor(
    public code: number,
    public override message: string,
  ) {
    super(message);
  }
}
