
/**
 * Simple CSV Parser for B2B employee data import.
 */
export const parseCSV = (text: string): any[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const results: any[] = [];

    // Map common header variations to our CardData fields
    const mapping: Record<string, string> = {
        'name': 'name',
        'fio': 'name',
        'full name': 'name',
        'имя': 'name',
        'фио': 'name',
        'position': 'position',
        'job': 'position',
        'должность': 'position',
        'phone': 'phone',
        'tel': 'phone',
        'телефон': 'phone',
        'email': 'email',
        'mail': 'email',
        'почта': 'email',
        'address': 'address',
        'location': 'address',
        'адрес': 'address',
        'website': 'website',
        'site': 'website',
        'сайт': 'website',
        'slogan': 'slogan',
        'слоган': 'slogan',
        'telegram': 'telegram',
        'tg': 'telegram',
        'телеграм': 'telegram',
        'instagram': 'instagram',
        'inst': 'instagram',
        'инстаграм': 'instagram',
        'whatsapp': 'whatsapp',
        'wa': 'whatsapp',
        'ватсап': 'whatsapp'
    };

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const entry: any = {};
        
        headers.forEach((header, index) => {
            const field = mapping[header];
            if (field && values[index]) {
                entry[field] = values[index];
            }
        });

        if (Object.keys(entry).length > 0) {
            results.push(entry);
        }
    }

    return results;
};
