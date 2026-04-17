import crypto from "node:crypto";

const SALT_BYTES = 32;
const KEY_BYTES = 64;
const ITERATIONS = 100_000;
const DIGEST = "sha512";

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_BYTES);
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_BYTES, DIGEST, (err, key) => {
      if (err) reject(err);
      else resolve(`${salt.toString("hex")}:${key.toString("hex")}`);
    });
  });
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, keyHex] = storedHash.split(":");
  if (!saltHex || !keyHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(keyHex, "hex");
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_BYTES, DIGEST, (err, key) => {
      if (err) reject(err);
      else {
        try {
          resolve(crypto.timingSafeEqual(key, expected));
        } catch {
          resolve(false);
        }
      }
    });
  });
}
