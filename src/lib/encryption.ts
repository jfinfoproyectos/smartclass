import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const ALGORITHM = 'aes-256-ctr';

// 🔒 SECURITY: Validate NEXTAUTH_SECRET at runtime
// This function ensures the secret key is properly configured before any encryption operation
function getSecretKey(): string {
    const SECRET_KEY = process.env.NEXTAUTH_SECRET;

    if (!SECRET_KEY) {
        throw new Error(
            'NEXTAUTH_SECRET environment variable is required for encryption. ' +
            'Please set it in your .env file with a strong random value (minimum 32 characters).'
        );
    }

    if (SECRET_KEY.length < 32) {
        throw new Error(
            'NEXTAUTH_SECRET must be at least 32 characters long for secure encryption. ' +
            'Current length: ' + SECRET_KEY.length
        );
    }

    return SECRET_KEY;
}

export async function encrypt(text: string): Promise<string> {
    const SECRET_KEY = getSecretKey();
    const iv = randomBytes(16);
    const key = (await promisify(scrypt)(SECRET_KEY, 'salt', 32)) as Buffer;
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export async function decrypt(text: string): Promise<string> {
    const SECRET_KEY = getSecretKey();
    const [ivPart, encryptedPart] = text.split(':');
    if (!ivPart || !encryptedPart) throw new Error('Invalid encrypted text format');

    const iv = Buffer.from(ivPart, 'hex');
    const encryptedText = Buffer.from(encryptedPart, 'hex');
    const key = (await promisify(scrypt)(SECRET_KEY, 'salt', 32)) as Buffer;
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString();
}
