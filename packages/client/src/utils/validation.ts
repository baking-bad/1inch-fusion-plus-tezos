export const isNonNegativeNumber = (value: number) => Number.isFinite(value) && value >= 0;
export const isNonNegativeInteger = (value: number) => Number.isSafeInteger(value) && value >= 0;
