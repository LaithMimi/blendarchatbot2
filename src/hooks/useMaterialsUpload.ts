import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { formatFileSize } from '../lib/utils';

// Define the structure of each material item
export interface MaterialItem {
  id: string;
  hebrew_input: string;
  arabic_response: string;
  pronunciation: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data: MaterialItem[] | null;
}

export const useMaterialsUpload = () => {
  const [validationError, setValidationError] = useState<string | null>(null);

  // Validate the JSON file matches our schema
  const validateMaterials = (data: any): ValidationResult => {
    const errors: string[] = [];
    
    // Check if it's an array
    if (!Array.isArray(data)) {
      errors.push("Invalid JSON format: Expected an array of items");
      return { isValid: false, errors, data: null };
    }
    
    // Validate each item
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      
      // Check required fields
      if (!item.id) errors.push(`Item #${i+1}: Missing 'id' field`);
      if (!item.hebrew_input) errors.push(`Item #${i+1}: Missing 'hebrew_input' field`);
      if (!item.arabic_response) errors.push(`Item #${i+1}: Missing 'arabic_response' field`);
      if (!item.pronunciation) errors.push(`Item #${i+1}: Missing 'pronunciation' field`);
      
      // Check field types
      if (item.id && typeof item.id !== 'string') errors.push(`Item #${i+1}: 'id' must be a string`);
      if (item.hebrew_input && typeof item.hebrew_input !== 'string') errors.push(`Item #${i+1}: 'hebrew_input' must be a string`);
      if (item.arabic_response && typeof item.arabic_response !== 'string') errors.push(`Item #${i+1}: 'arabic_response' must be a string`);
      if (item.pronunciation && typeof item.pronunciation !== 'string') errors.push(`Item #${i+1}: 'pronunciation' must be a string`);
    }
    
    if (errors.length > 0) {
      setValidationError(errors.join('\n'));
      return { isValid: false, errors, data: null };
    }
    
    return { isValid: true, errors: [], data: data as MaterialItem[] };
  };

  // Mutation for uploading data to Firestore
  const uploadMutation = useMutation({
    mutationFn: async (materials: MaterialItem[]) => {
      const firestore = getFirestore();
      const batch = [];
      
      // Process each material and create a promise for each Firestore operation
      for (const material of materials) {
        const docRef = doc(firestore, 'materials', material.id);
        batch.push(setDoc(docRef, material));
      }
      
      // Execute all operations in parallel
      await Promise.all(batch);
      return materials.length;
    }
  });

  // Read and parse a file
  const parseJsonFile = (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  // Get formatted file size
  const getFormattedFileSize = (file: File | null): string => {
    if (!file) return '0 B';
    return formatFileSize(file.size);
  };

  return {
    validationError,
    setValidationError,
    validateMaterials,
    uploadMutation,
    parseJsonFile,
    getFormattedFileSize
  };
};

export default useMaterialsUpload;