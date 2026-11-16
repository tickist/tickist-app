/** Compact duration for chips, such as "3h 20m", "45m" or "2h". */
export function formatMinutesShort(minutes: number): string {
  const rounded = Math.max(0, Math.round(minutes));
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;

  if (hours === 0) {
    return `${rest}m`;
  }

  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}
