/**
 * Calculates CRC16-CCITT for QRIS string.
 */
export function calculateCRC16(data: string): string {
  const polynomial = 0x1021;
  let crc = 0xFFFF;

  for (let i = 0; i < data.length; i++) {
    crc ^= (data.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ polynomial) : (crc << 1);
    }
  }

  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Converts a static QRIS string into a dynamic QRIS string with a specific amount.
 */
export function makeQRISDynamic(staticQris: string, amount: number): string {
  let qris = staticQris.trim();

  // Change initiation method from static (11) to dynamic (12)
  if (qris.includes("010211")) {
    qris = qris.replace("010211", "010212");
  }

  let baseQris = qris.slice(0, -4);

  if (!baseQris.endsWith("6304")) {
    const index6304 = baseQris.lastIndexOf("6304");
    if (index6304 !== -1) {
      baseQris = baseQris.slice(0, index6304 + 4);
    } else {
      baseQris += "6304";
    }
  }

  const baseWithoutCRC = baseQris.slice(0, -4); // Remove "6304"
  const amountStr = amount.toString();
  const amountLen = amountStr.length.toString().padStart(2, '0');
  const tag54 = `54${amountLen}${amountStr}`;

  let modifiedBase = baseWithoutCRC;
  const match = modifiedBase.match(/54\d{2}\d+/);
  if (match) {
    modifiedBase = modifiedBase.replace(match[0], tag54);
  } else {
    modifiedBase += tag54;
  }

  const finalBase = modifiedBase + "6304";
  const newCrc = calculateCRC16(finalBase);

  return finalBase + newCrc;
}

// A standard default static QRIS template for Photomatics
export const DEFAULT_STATIC_QRIS = "00020101021126670016COM.NOBUBANK.WWW011893600503000008782402151111111111111110303UME51440014ID.CO.QRIS.WWW0215ID10202111111110303UME5204000053033605802ID5918Photomatics Premium6007Jakarta61051234562070703A016304";
