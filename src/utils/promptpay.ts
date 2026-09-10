/**
 * EMVCo Compliant PromptPay QR Code Payload Generator (Bank of Thailand Standard)
 */

function formatField(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

/**
 * CRC16-CCITT (0x1021, init 0xFFFF) computation for EMVCo standard
 */
function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    const byte = data.charCodeAt(i) & 0xff;
    crc ^= byte << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Formats PromptPay Target ID (Mobile: 10 digits -> 0066xxxxxxxxx, Tax ID/National ID: 13 digits)
 */
export function formatPromptPayTarget(target: string): { subtag: string; value: string } {
  const cleaned = target.replace(/[^0-9]/g, '');
  if (cleaned.length === 10) {
    // Mobile number: e.g. 0812345678 -> 0066812345678
    const formattedMobile = `0066${cleaned.substring(1)}`;
    return { subtag: '01', value: formattedMobile };
  } else if (cleaned.length === 13) {
    // Tax ID / National ID (13 digits)
    return { subtag: '02', value: cleaned };
  } else {
    // Default fallback: 13-digit merchant e-wallet
    return { subtag: '03', value: cleaned.padStart(15, '0') };
  }
}

/**
 * Generates the full EMVCo PromptPay QR string
 */
export function generatePromptPayPayload(target: string, amount?: number): string {
  const targetFormatted = formatPromptPayTarget(target);

  // Tag 29: Merchant Account Information - PromptPay
  const aid = formatField('00', 'A000000677010111');
  const accountInfo = formatField(targetFormatted.subtag, targetFormatted.value);
  const tag29 = formatField('29', aid + accountInfo);

  // Tag 00: Payload Format Indicator
  let payload = formatField('00', '01');

  // Tag 01: Point of Initiation Method (12 = Dynamic with Amount, 11 = Static)
  payload += formatField('01', amount !== undefined && amount > 0 ? '12' : '11');

  // Tag 29: PromptPay AID & Target
  payload += tag29;

  // Tag 53: Transaction Currency (764 = THB)
  payload += formatField('53', '764');

  // Tag 54: Transaction Amount (if specified)
  if (amount !== undefined && amount > 0) {
    const formattedAmount = amount.toFixed(2);
    payload += formatField('54', formattedAmount);
  }

  // Tag 58: Country Code (TH)
  payload += formatField('58', 'TH');

  // Tag 63: CRC16 Checksum
  const withCrcHeader = payload + '6304';
  const checksum = crc16(withCrcHeader);

  return withCrcHeader + checksum;
}
