
import pdf from 'pdf-parse';
import * as xlsx from 'xlsx';

export async function parseFile(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();

    if (file.type === 'application/pdf') {
        const data = await pdf(Buffer.from(buffer));
        return data.text;
    }

    if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'text/csv') {
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // Convert sheet to CSV string
        const csvString = xlsx.utils.sheet_to_csv(sheet);
        return csvString;
    }
    
    // Fallback for plain text files like CSV if the mime type is not text/csv
    if (file.type.startsWith('text/')) {
        return file.text();
    }

    throw new Error(`Unsupported file type: ${file.type}`);
}
