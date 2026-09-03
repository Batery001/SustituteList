/** Compara fecha guardada en BD con un `YYYY-MM-DD` del formulario. */
export function datesOnSameDay(stored: Date, input: string): boolean {
  const s = new Date(stored);
  const i = new Date(input.includes("T") ? input : `${input}T12:00:00`);
  if (Number.isNaN(s.getTime()) || Number.isNaN(i.getTime())) return false;
  return (
    s.getFullYear() === i.getFullYear() &&
    s.getMonth() === i.getMonth() &&
    s.getDate() === i.getDate()
  );
}
