// convex/lib/orderNumbers.ts
/**
 * Generate order number with client name abbreviation
 * Format: AF-[ClientCode]-YYMMDD-[Sequence]
 * Example: AF-AJO-241218-005 for Adebayo Johnson
 */
export function generateOrderNumber(
  clientName: string,
  date: Date,
  sequence: number
): string {
  // Get client code from name
  const nameParts = clientName.trim().split(/\s+/);
  let clientCode: string;

  if (nameParts.length >= 2) {
    // Use first letter of first name + first 2 letters of last name
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    clientCode = (firstName[0] + lastName.substring(0, 2)).toUpperCase();
  } else {
    // Single name - use first 3 letters
    clientCode = nameParts[0].substring(0, 3).toUpperCase();
  }

  // Get date parts
  const year = date.getFullYear().toString().slice(2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  // Get sequence with padding
  const seq = sequence.toString().padStart(3, "0");

  return `AF-${clientCode}-${year}${month}${day}-${seq}`;
}

/**
 * Parse order number to extract components
 */
export function parseOrderNumber(orderNumber: string) {
  const parts = orderNumber.split("-");

  if (parts.length === 4) {
    const [prefix, clientCode, dateCode, sequence] = parts;

    // Parse date code (YYMMDD)
    let orderDate: Date | null = null;
    if (dateCode.length === 6) {
      const year = parseInt("20" + dateCode.substring(0, 2));
      const month = parseInt(dateCode.substring(2, 4)) - 1;
      const day = parseInt(dateCode.substring(4, 6));
      orderDate = new Date(year, month, day);
    }

    return {
      prefix,
      clientCode,
      dateCode,
      sequence: parseInt(sequence),
      orderDate,
      full: orderNumber,
    };
  }

  return {
    prefix: "",
    clientCode: "",
    dateCode: "",
    sequence: 0,
    orderDate: null,
    full: orderNumber,
  };
}
