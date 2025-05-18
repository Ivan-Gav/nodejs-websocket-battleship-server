export function deepParseJson(input: unknown): any {
  // If it's a string that looks like JSON, try to parse it
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return deepParseJson(parsed); // Recurse in case of further nesting
    } catch {
      return input;
    }
  }

  // If it's an array, recursively parse each element
  if (Array.isArray(input)) {
    return input.map(deepParseJson);
  }

  // If it's an object, recurse into each property
  if (input && typeof input === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      result[key] = deepParseJson(value);
    }
    return result;
  }

  // Primitives (number, boolean, null, etc.) — return as is
  return input;
}

export function deepStringifyJson(input: unknown): string {
  // If it's an object or array, stringify it
  if (Array.isArray(input) || (input && typeof input === 'object')) {
    // First, deep-convert children
    const deepConverted = Array.isArray(input)
      ? input.map(deepStringifyJson)
      : Object.fromEntries(
          Object.entries(input).map(([key, value]) => [
            key,
            deepStringifyJson(value),
          ]),
        );

    // Then stringify the entire thing
    return JSON.stringify(deepConverted);
  }

  // Primitives (string, number, boolean, null, etc.)
  return input as string;
}

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
