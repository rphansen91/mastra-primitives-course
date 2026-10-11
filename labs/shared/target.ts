// Break-it tests run against `solutions/` by default. Set LAB_TARGET=exercises to run them
// against your own work in `exercises/` (they fail until you fix the deliberate bug).
export const TARGET = process.env.LAB_TARGET === 'exercises' ? 'exercises' : 'solutions';
export const load = <T = any>(moduleDir: string, file: string): Promise<T> => import(`${moduleDir}/${TARGET}/${file}`);
