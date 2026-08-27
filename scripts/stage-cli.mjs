import { copyFile, mkdir } from 'node:fs/promises';
import { chmod } from 'node:fs/promises';

await mkdir(new URL('../dist/bin/', import.meta.url), { recursive: true });
const destination = new URL('../dist/bin/nightjar', import.meta.url);
await copyFile(new URL('../target/release/nightjar', import.meta.url), destination);
await chmod(destination, 0o755);
console.log('staged dist/bin/nightjar');
