import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { DocumentUnreadableError, ValidationError } from '../errors';

export const PDF_MIME = 'application/pdf';
export const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/**
 * Extract plain text from a PDF or DOCX buffer.
 * Throws DocumentUnreadableError when the file cannot be parsed or is empty.
 */
export async function extractText(buffer: Buffer, mimetype: string): Promise<string> {
  let text: string;

  try {
    if (mimetype === PDF_MIME) {
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (mimetype === DOCX_MIME) {
      const { value } = await mammoth.extractRawText({ buffer });
      text = value;
    } else {
      // In practice multer's fileFilter blocks this upstream; kept as a guard.
      throw new ValidationError(`Unsupported file type: ${mimetype}`);
    }
  } catch (err) {
    if (err instanceof ValidationError) throw err;
    throw new DocumentUnreadableError(
      `Failed to extract text: ${err instanceof Error ? err.message : 'unknown error'}`,
    );
  }

  if (!text.trim()) {
    throw new DocumentUnreadableError('No readable text found in the document');
  }

  return text;
}
