export const isNonNegativeNumber = (value: number) => Number.isFinite(value) && value >= 0;
export const isNonNegativeInteger = (value: number) => Number.isSafeInteger(value) && value >= 0;

export const isValidPort = (port: number): boolean => Number.isSafeInteger(port) && port >= 1 && port <= 65535;
