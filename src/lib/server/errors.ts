/**
 * A rule the caller broke. Services throw these; the API layer turns them into
 * `{ error: { code, message } }` with `status`. `message` is ready to show a user.
 */
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
  }
}
