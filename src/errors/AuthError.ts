export class AuthError extends Error {
  status: number;

  constructor(status: number, message = "Failed to fetch") {
    super(message);
    this.status = status;
    this.name = "AuthError";
  }
}
