export const specialJsonStringifyForThatCrookedFrontend = (
  input: object,
): string => {
  if ('data' in input) {
    const dataString = JSON.stringify(input.data);
    return JSON.stringify({ ...input, data: dataString });
  }
  return JSON.stringify(input);
};

export const spreialJsonParseForThatCrookedFrontend = (input: string): any => {
  try {
    const parsed = JSON.parse(input);
    if (typeof parsed === 'object' && 'data' in parsed) {
      try {
        const parsedData = JSON.parse(parsed.data);
        return { ...parsed, data: parsedData };
      } catch {}
      return parsed;
    }
  } catch {
    return input;
  }
};
