export function parseIntegerEnvVar(envVarName: string): number | undefined;
export function parseIntegerEnvVar(envVarName: string, defaultValue: number): number;
export function parseIntegerEnvVar(envVarName: string, defaultValue: ErrorConstructor): number;
export function parseIntegerEnvVar(envVarName: string, defaultValue?: number | ErrorConstructor): number | undefined {
  const rawValue = process.env[envVarName];
  if (!rawValue) {
    if (typeof defaultValue === 'function')
      throw new defaultValue(`The ${envVarName} is not specified`);

    return defaultValue;
  }

  const value = Number(rawValue);
  if (!Number.isSafeInteger(value))
    throw new Error(`The ${envVarName} is invalid: ${rawValue} is not a valid integer`);
  return value;
};
