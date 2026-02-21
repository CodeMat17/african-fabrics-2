// utils/date-utils.ts
export function parseCSVDateToTimestamp(dateStr: string | undefined): number {
  if (!dateStr) {
    // Default to 7 days from now if no date provided
    return Date.now() + 7 * 24 * 60 * 60 * 1000;
  }

  // Handle different date formats that might appear in the CSV
  let year: number, month: number, day: number;

  if (dateStr.includes("-")) {
    // Format: YYYY-MM-DD
    [year, month, day] = dateStr.split("-").map(Number);
  } else if (dateStr.includes("/")) {
    // Format: MM/DD/YYYY or DD/MM/YYYY (assuming YYYY-MM-DD from your data)
    const parts = dateStr.split("/");
    if (parts[0].length === 4) {
      // Format: YYYY/MM/DD
      [year, month, day] = parts.map(Number);
    } else {
      // Assume YYYY-MM-DD was intended
      console.warn(`Unexpected date format: ${dateStr}, using current date`);
      return Date.now() + 7 * 24 * 60 * 60 * 1000;
    }
  } else {
    console.warn(`Unable to parse date: ${dateStr}, using default`);
    return Date.now() + 7 * 24 * 60 * 60 * 1000;
  }

  // Create date at UTC midnight to avoid timezone shifts
  // This ensures the date remains the same regardless of the user's timezone
  const timestamp = Date.UTC(year, month - 1, day, 12, 0, 0); // Use noon UTC to avoid date boundary issues

  return timestamp;
}

// Alternative: If you want to preserve the exact date in local timezone
export function parseCSVDateToTimestampLocal(
  dateStr: string | undefined,
): number {
  if (!dateStr) {
    return Date.now() + 7 * 24 * 60 * 60 * 1000;
  }

  // Parse the date string
  const date = new Date(dateStr);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date: ${dateStr}, using default`);
    return Date.now() + 7 * 24 * 60 * 60 * 1000;
  }

  // Set to noon to avoid any timezone boundary issues
  date.setHours(12, 0, 0, 0);

  return date.getTime();
}
