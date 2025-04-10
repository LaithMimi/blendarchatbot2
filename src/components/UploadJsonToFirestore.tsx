import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, CheckCircle, AlertCircle, FileJson } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import useMaterialsUpload from '../hooks/useMaterialsUpload';

// Props for the component
interface UploadJsonToFirestoreProps {
  onUploadSuccess?: () => void;
  className?: string;
}

const UploadJsonToFirestore: React.FC<UploadJsonToFirestoreProps> = ({ 
  onUploadSuccess,
  className = ""
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const uploadAreaRef = useRef<HTMLDivElement>(null);
  
  // Use our custom hook
  const { 
    validationError, 
    setValidationError, 
    validateMaterials, 
    uploadMutation,
    parseJsonFile,
    getFormattedFileSize
  } = useMaterialsUpload();
  
  // Handle keyboard interactions for better accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!uploadAreaRef.current) return;
      
      // If focused and user presses Enter or Space, trigger click
      if (document.activeElement === uploadAreaRef.current && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        handleUploadClick();
      }
    };

    const currentRef = uploadAreaRef.current;
    if (currentRef) {
      currentRef.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      if (currentRef) {
        currentRef.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, []);
  
  // Configure success/error handlers
  uploadMutation.onSuccess = (count) => {
    toast({
      title: "Upload Successful",
      description: `${count} materials were uploaded to Firestore.`,
      variant: "default",
    });
    
    setSelectedFile(null);
    if (onUploadSuccess) {
      onUploadSuccess();
    }
    
    // Announce success for screen readers
    announceStatus(`Successfully uploaded ${count} materials to Firestore.`);
  };
  
  uploadMutation.onError = (error) => {
    console.error('Error uploading to Firestore:', error);
    toast({
      title: "Upload Failed",
      description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      variant: "destructive",
    });
    
    // Announce error for screen readers
    announceStatus(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  };

  // Simple screen reader announcement function
  const announceStatus = (message: string) => {
    const announcement = document.createElement('div');
    announcement.className = 'sr-only';
    announcement.setAttribute('aria-live', 'assertive');
    announcement.setAttribute('role', 'status');
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    // Remove after it's been announced
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setValidationError(null);
    
    if (file) {
      announceStatus(`File selected: ${file.name}`);
    }
  };

  // Handle the click on the upload zone
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop events
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setValidationError(null);
      announceStatus(`File dropped: ${file.name}`);
    }
  };

  // Handle the file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a JSON file to upload.",
        variant: "destructive",
      });
      announceStatus("Error: No file selected. Please select a JSON file to upload.");
      return;
    }
    
    // Check file type
    if (selectedFile.type && selectedFile.type !== "application/json" && !selectedFile.name.endsWith('.json')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a valid JSON file.",
        variant: "destructive",
      });
      announceStatus("Error: Invalid file type. Please select a JSON file.");
      setValidationError("Invalid file type. Please select a JSON file.");
      return;
    }
    
    // Check file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size exceeds 5MB limit.",
        variant: "destructive",
      });
      announceStatus("Error: File size exceeds 5MB limit.");
      setValidationError("File size exceeds 5MB limit.");
      return;
    }
    
    try {
      announceStatus("Processing file...");
      
      // Parse the file
      const data = await parseJsonFile(selectedFile);
      
      // Validate the data
      const validationResult = validateMaterials(data);
      
      // If valid, upload to Firestore
      if (validationResult.isValid && validationResult.data) {
        // Check if there are too many items
        if (validationResult.data.length > 1000) {
          toast({
            title: "Too Many Items",
            description: "The file contains more than 1000 items. Please split the file into smaller batches.",
            variant: "destructive",
          });
          announceStatus("Error: The file contains more than 1000 items. Please split the file into smaller batches.");
          setValidationError("Too many items (maximum 1000 allowed). Please split the file into smaller batches.");
          return;
        }
        
        announceStatus(`Starting upload of ${validationResult.data.length} items to Firestore.`);
        uploadMutation.mutate(validationResult.data);
      } else if (validationResult.errors.length > 0) {
        announceStatus(`Validation failed: ${validationResult.errors.length} errors found.`);
      }
    } catch (error) {
      console.error('Error processing JSON file:', error);
      setValidationError(`Invalid JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      announceStatus(`Error processing JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Calculate upload stats
  const formattedFileSize = getFormattedFileSize(selectedFile);

  return (
    <div className={`w-full ${className}`}>
      <div 
        ref={uploadAreaRef}
        className={`
          relative flex flex-col items-center justify-center w-full p-8 
          border-2 border-dashed rounded-lg transition-all cursor-pointer
          ${dragActive ? 'border-brand-bordeaux bg-brand-bordeaux/10' : 'border-gray-300 dark:border-gray-500'} 
          ${uploadMutation.isPending ? 'opacity-80 cursor-wait' : 'hover:bg-gray-50 dark:hover:bg-black/10'}
        `}
        onClick={handleUploadClick}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        aria-label="Upload JSON file"
        role="button"
        tabIndex={0}
        aria-busy={Boolean(uploadMutation.isPending)}
        aria-describedby="upload-description"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploadMutation.isPending}
          aria-hidden="true"
          id="file-upload"
        />
        
        <div id="upload-description" className="sr-only">
          {uploadMutation.isPending 
            ? 'Uploading your file to Firestore, please wait.' 
            : 'Drop a JSON file here or click to browse and select one from your computer.'}
        </div>
        
        {uploadMutation.isPending ? (
          <div className="flex flex-col items-center space-y-4" aria-live="polite">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-brand-bordeaux/30 border-t-brand-bordeaux animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-semibold text-brand-bordeaux">
                  {uploadMutation.isPending &&
                    (uploadMutation as any).variables?.length
                      ? `${(uploadMutation as any).variables.length}`
                      : ''
                  }
                </span>
              </div>
            </div>
            <p className="text-lg font-medium">Uploading materials to Firestore...</p>
            <div className="flex flex-col items-center">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-1">
                <div 
                  className="bg-brand-bordeaux h-2.5 rounded-full animate-pulse"
                  style={{ width: '100%' }}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={50}
                  aria-label="Upload progress"
                />
              </div>
              <p className="text-xs text-gray-500">
                {uploadMutation.isPending ? 'Processing...' : 'Upload complete'}
              </p>
            </div>
          </div>
        ) : uploadMutation.isSuccess ? (
          <div className="flex flex-col items-center space-y-4" aria-live="polite">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
            >
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle size={32} className="text-green-500" />
              </div>
            </motion.div>
            <p className="text-lg font-medium">Upload Complete!</p>
            <p className="text-sm text-gray-500">Click to upload another file</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {selectedFile ? (
                <div className="h-16 w-16 rounded-full bg-brand-bordeaux/10 flex items-center justify-center">
                  <FileJson size={32} className="text-brand-bordeaux" />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-full bg-brand-bordeaux/10 flex items-center justify-center">
                  <Upload size={32} className="text-brand-bordeaux" />
                </div>
              )}
            </motion.div>
            
            <p className="text-lg font-medium">
              {selectedFile 
                ? `Selected: ${selectedFile.name}`
                : 'Drag & drop a JSON file or click to browse'
              }
            </p>
            
            {selectedFile && (
              <div className="text-xs text-gray-500">
                {formattedFileSize}
              </div>
            )}
            
            <p className="text-sm text-gray-500 text-center">
              Upload teaching materials in JSON format
            </p>
          </div>
        )}
      </div>
      
      {/* Validation error display */}
      {validationError && (
        <div 
          className="mt-4 p-4 border border-red-400 bg-red-50 dark:bg-red-900/20 rounded-md"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start">
            <AlertCircle className="text-red-500 mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div>
              <h4 className="font-semibold text-red-700 dark:text-red-400">Validation Error</h4>
              <pre className="mt-1 text-sm text-red-600 dark:text-red-300 whitespace-pre-wrap">{validationError}</pre>
            </div>
          </div>
        </div>
      )}
      
      {/* Upload button */}
      {selectedFile && !uploadMutation.isPending && !uploadMutation.isSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex justify-center"
        >
          <button
            onClick={handleUpload}
            disabled={uploadMutation.isPending || !!validationError}
            className={`
              px-6 py-3 bg-green-600 text-white font-semibold rounded-full
              flex items-center space-x-2 shadow-md
              ${validationError 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-green-700 active:bg-green-800 hover:shadow-lg'
              }
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2
            `}
            aria-label="Upload JSON to Firestore"
          >
            <Upload size={20} aria-hidden="true" />
            <span>Upload JSON to Firestore</span>
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default UploadJsonToFirestore;