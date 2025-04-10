import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string to a standard format
 * @param dateString Date string to format
 * @param formatStr Optional format string
 * @returns Formatted date string
 */
export function formatDateString(dateString: string, formatStr: string = 'PP'): string {
  try {
    return format(new Date(dateString), formatStr);
  } catch (error) {
    return 'Invalid date';
  }
}

/**
 * Formats a file size in bytes to a human-readable string
 * @param bytes File size in bytes
 * @returns Formatted string (e.g., "1.5 MB", "500 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generates a sample JSON template for teaching materials
 * @returns JSON string with sample template
 */
export function getTeachingMaterialsTemplate(): string {
  const sample = [
    {
      id: "beginner_week_01_001",
      hebrew_input: "ברוכים הבאים",
      arabic_response: "أهْلًا وسَهْلًا",
      pronunciation: "אַהְלַן וַסַהְלַן"
    },
    {
      id: "beginner_week_01_002",
      hebrew_input: "שלום",
      arabic_response: "مَرْحَبَا",
      pronunciation: "מַרְחַבַּא"
    }
  ];
  
  return JSON.stringify(sample, null, 2);
}

/**
 * Downloads a string as a file
 * @param content Content to download
 * @param fileName Name of the file to save
 * @param contentType MIME type of the file
 */
export function downloadStringAsFile(content: string, fileName: string, contentType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}