function safeParse(candidate: string): unknown {
  try {
    return JSON.parse(candidate);
  } catch {
    return undefined;
  }
}

/**
 * Pulls a JSON object out of a model response.
 *
 * Models wrap JSON in prose or code fences often enough that demanding clean
 * output is a reliability bug. This scans for the outermost balanced object
 * instead of trusting the response shape.
 */
export function parseJsonResponse(raw: string): unknown {
  const start = raw.indexOf('{');
  if (start === -1) {
    return undefined;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < raw.length; index += 1) {
    const character = raw[index];

    if (escaped) {
      escaped = false;
    } else if (inString && character === '\\') {
      escaped = true;
    } else if (character === '"') {
      inString = !inString;
    } else if (!inString && character === '{') {
      depth += 1;
    } else if (!inString && character === '}') {
      depth -= 1;
      if (depth === 0) {
        return safeParse(raw.slice(start, index + 1));
      }
    }
  }

  return undefined;
}
