import bcrypt from "bcryptjs";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function comparePasswords(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
function generateSalt(): never {
  throw new Error(
    "generateSalt() is obsolete — bcrypt manages salting internally. Remove this call.",
  );
}
