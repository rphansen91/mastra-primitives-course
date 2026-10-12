/** Insert <wbr> at identifier boundaries (camelCase, ., /, _, () in an already-escaped long token so it
 * wraps between words instead of mid-word ("createDurable<wbr>Agent"). */
export function breakIdent(escaped: string, min = 16): string {
  if (escaped.length < min) return escaped;
  return escaped
    .replace(/([a-z0-9])([A-Z])/g, '$1<wbr>$2')
    .replace(/([._/(,])(?=[^\s<])/g, '$1<wbr>');
}

