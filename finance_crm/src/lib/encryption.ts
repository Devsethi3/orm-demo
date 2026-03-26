const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

async function getKey(): Promise<CryptoKey> {
  const keyHex = process.env.ENCRYPTION_KEY!;
  const keyBuffer = hexToBuffer(keyHex);
  return crypto.subtle.importKey("raw", keyBuffer, ALGORITHM, false, [
    "encrypt",
    "decrypt",
  ]);
}

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded,
  );

  const ivHex = bufferToHex(iv.buffer);
  const ciphertextHex = bufferToHex(ciphertext);
  return `${ivHex}:${ciphertextHex}`;
}

export async function decrypt(encryptedText: string): Promise<string> {
  const key = await getKey();
  const [ivHex, ciphertextHex] = encryptedText.split(":");

  const iv = new Uint8Array(hexToBuffer(ivHex));
  const ciphertext = hexToBuffer(ciphertextHex);

  const plaintext = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext,
  );

  return new TextDecoder().decode(plaintext);
}
