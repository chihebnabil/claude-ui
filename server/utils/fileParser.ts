import Anthropic from "@anthropic-ai/sdk";

// Plain text files that can be read directly without Claude API
const PLAIN_TEXT_EXTENSIONS = new Set([
  "txt",
  "js",
  "ts",
  "json",
  "html",
  "htm",
  "md",
  "markdown",
  "xml",
  "csv",
  "css",
  "scss",
  "less",
  "yaml",
  "yml",
  "toml",
  "ini",
  "conf",
  "log",
]);

// File types that Claude API can process for text extraction
const CLAUDE_SUPPORTED_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "pptx",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "bmp",
  "tiff",
]);

const CLAUDE_SUPPORTED_MIMETYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/tiff",
]);

export async function parseFile(
  filename: string,
  buffer: Buffer,
  mimeType?: string,
  model: string,
): Promise<string> {
  try {
    const ext = filename.split(".").pop()?.toLowerCase();

    // Handle plain text files directly
    if (
      mimeType?.startsWith("text/") ||
      mimeType === "application/json" ||
      mimeType === "application/javascript" ||
      (ext && PLAIN_TEXT_EXTENSIONS.has(ext))
    ) {
      return buffer.toString("utf-8");
    }

    // Use Claude API for supported file types
    if (
      (ext && CLAUDE_SUPPORTED_EXTENSIONS.has(ext)) ||
      (mimeType && CLAUDE_SUPPORTED_MIMETYPES.has(mimeType))
    ) {
      return await extractTextWithClaude(filename, buffer, mimeType, model);
    }

    // Fallback to plain text for unsupported types
    return buffer.toString("utf-8");
  } catch (error) {
    console.error("Error parsing file:", error);
    throw new Error(`Failed to parse file: ${error.message}`);
  }
}

// Cache for storing Claude API instances to avoid recreating them
const claudeInstanceCache = new Map<string, Anthropic>();

function getClaudeInstance(apiKey: string): Anthropic {
  if (!claudeInstanceCache.has(apiKey)) {
    claudeInstanceCache.set(apiKey, new Anthropic({ apiKey }));
  }
  return claudeInstanceCache.get(apiKey)!;
}

async function extractTextWithClaude(
  filename: string,
  buffer: Buffer,
  mimeType?: string,
  model: string,
): Promise<string> {
  // Get the API key from runtime config
  const { anthropicKey } = useRuntimeConfig();
  // Validate file size (Claude has limits)
  const maxFileSize = 32 * 1024 * 1024; // 32MB limit
  if (buffer.length > maxFileSize) {
    throw new Error(`File too large: ${Math.round(buffer.length / (1024 * 1024))}MB. Maximum size is 32MB.`);
  }

  const anthropic = getClaudeInstance(anthropicKey);

  // Determine if this is an image file
  const isImage = mimeType?.startsWith("image/") || 
    /\.(png|jpe?g|gif|webp|bmp|tiff)$/i.test(filename);

  const base64Data = buffer.toString("base64");
  
  // Optimize prompts for better text extraction
  const content = isImage 
    ? [
        {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: mimeType || "image/jpeg",
            data: base64Data,
          },
        },
        {
          type: "text" as const,
          text: "Please extract all text content from this image using OCR. If the image contains structured data (like tables), preserve the structure. If no text is found, respond with 'No readable text detected in image'.",
        },
      ]
    : [
        {
          type: "document" as const,
          source: {
            type: "base64" as const,
            media_type: mimeType || "application/pdf",
            data: base64Data,
          },
        },
        {
          type: "text" as const,
          text: "Extract all text content from this document. Maintain original formatting, paragraph structure, bullet points, tables, and any other structural elements. Provide clean, readable text while preserving the document's organization.",
        },
      ];

  try {
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 8192, // Increased for larger documents
      temperature: 0, // Deterministic for text extraction
      messages: [
        {
          role: "user",
          content,
        },
      ],
    });

    const textContent = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.type === "text" ? block.text : "")
      .join("\n")
      .trim();

    if (!textContent || textContent === "No readable text detected in image" || textContent === "No text content extracted") {
      return `[${filename}]: No extractable text content found`;
    }

    return textContent;
  } catch (error: unknown) {
    console.error(`Error extracting text from ${filename}:`, error);
    
    // Provide more specific error messages
    const errorObj = error as { status?: number; message?: string };
    if (errorObj.status === 400) {
      throw new Error(`Invalid file format or content for ${filename}. Please check the file is not corrupted.`);
    } else if (errorObj.status === 413) {
      throw new Error(`File ${filename} is too large for processing. Maximum size is 32MB.`);
    } else if (errorObj.status === 429) {
      throw new Error("Rate limit exceeded. Please wait a moment before uploading more files.");
    } else if (errorObj.status && errorObj.status >= 500) {
      throw new Error("Claude API is temporarily unavailable. Please try again later.");
    }
    
    throw new Error(`Failed to extract text from ${filename}: ${errorObj.message || 'Unknown error'}`);
  }
}
