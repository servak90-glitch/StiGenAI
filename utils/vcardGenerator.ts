
import { CardData } from '../types';

/**
 * Generates a vCard 3.0 formatted string for contact exchange.
 */
export const generateVCard = (data: CardData): string => {
    const vcard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${data.name}`,
        `ORG:${data.company}`,
        `TITLE:${data.position}`,
        `TEL;TYPE=CELL:${data.phone}`,
        `EMAIL;TYPE=INTERNET:${data.email}`,
        `ADR;TYPE=WORK:;;${data.address};;;`,
        `URL:${data.website}`,
        'END:VCARD'
    ];

    return vcard.join('\n');
};
