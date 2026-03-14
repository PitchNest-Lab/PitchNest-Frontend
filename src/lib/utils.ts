import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Packages files and optional metadata into FormData for backend uploads.
 */
export function createFormData(files: File[], metadata?: Record<string, any>): FormData {
  const formData = new FormData();
  
  files.forEach((file, index) => {
    formData.append(`file_${index}`, file);
  });

  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }

  return formData;
}
