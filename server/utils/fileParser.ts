import textract from "@nosferatu500/textract";
import { promisify } from "util";

const textractFromBuffer = promisify(textract.fromBufferWithName);

export async function parseFile(
  filename: string,
  buffer: Buffer,
  mimeType?: string
): Promise<string> {
  try {
    console.log(mimeType)
    if (mimeType.startsWith("text/") || mimeType === "application/json") {
      return buffer.toString();
    }

    const text = await textractFromBuffer(filename, buffer);
    return text;
  } catch (error) {
    console.error("Error parsing file:", error);
    throw new Error(`Failed to parse file: ${error.message}`);
  }
}
