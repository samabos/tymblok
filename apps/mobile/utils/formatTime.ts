/** Format "HH:mm" for display: "09:00" → "9:00 AM", "14:30" → "2:30 PM" */
export function formatTimeDisplay(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${(minutes || 0).toString().padStart(2, '0')} ${period}`;
}
