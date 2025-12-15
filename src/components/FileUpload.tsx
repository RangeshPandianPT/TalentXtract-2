import { useRef, useState, DragEvent } from "react";
import { FileText, Upload, X, Loader2, CloudUpload, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`;

interface FileUploadProps {
  onFileContent: (content: string, fileName: string, isImage?: boolean, imageBase64?: string) => void;
  uploadedFile: string | null;
  onClearFile: () => void;
}

export function FileUpload({ onFileContent, uploadedFile, onClearFile }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n";
    }
    
    return fullText.trim();
  };

  const extractTextFromWord = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  };

  const convertImageToBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processFile = async (file: File) => {
    const documentTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    const imageTypes = ["image/jpeg", "image/jpg", "image/png"];
    const isImage = imageTypes.includes(file.type) || 
                    file.name.toLowerCase().endsWith('.jpg') || 
                    file.name.toLowerCase().endsWith('.jpeg') || 
                    file.name.toLowerCase().endsWith('.png');
    const isDocument = documentTypes.includes(file.type) || file.name.endsWith(".txt");

    if (!isDocument && !isImage) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, Word document, text file, or image (JPG/PNG).",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      if (isImage) {
        // Convert image to base64 for AI OCR processing
        const base64 = await convertImageToBase64(file);
        onFileContent("", file.name, true, base64);
        toast({
          title: "Image loaded",
          description: `${file.name} ready for AI text extraction`,
        });
      } else {
        let text = "";

        if (file.type === "text/plain" || file.name.endsWith(".txt")) {
          text = await file.text();
        } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
          text = await extractTextFromPDF(file);
        } else if (
          file.type === "application/msword" ||
          file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          file.name.endsWith(".doc") ||
          file.name.endsWith(".docx")
        ) {
          text = await extractTextFromWord(file);
        }

        if (text.trim()) {
          onFileContent(text, file.name);
          toast({
            title: "File loaded",
            description: `Extracted ${text.split(/\s+/).filter(Boolean).length} words from ${file.name}`,
          });
        } else {
          toast({
            title: "No text found",
            description: "Could not extract text from this file. Try a different file.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Processing failed",
        description: "Failed to read file content. Please try again or paste text manually.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const isImageFile = uploadedFile?.toLowerCase().match(/\.(jpg|jpeg|png)$/);

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,image/jpeg,image/png"
        onChange={handleFileChange}
        className="hidden"
        disabled={isProcessing}
      />
      
      {uploadedFile ? (
        <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 bg-secondary rounded-lg text-xs sm:text-sm">
          {isImageFile ? (
            <Image className="w-4 h-4 text-primary flex-shrink-0" />
          ) : (
            <FileText className="w-4 h-4 text-primary flex-shrink-0" />
          )}
          <span className="text-secondary-foreground max-w-[80px] sm:max-w-[120px] truncate">
            {uploadedFile}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 hover:bg-destructive/10 flex-shrink-0"
            onClick={onClearFile}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleClick}
            disabled={isProcessing}
            className={`gap-1.5 sm:gap-2 text-muted-foreground hover:text-foreground transition-all text-xs sm:text-sm px-2 sm:px-3 ${
              isDragging ? "border-primary bg-primary/5 text-primary" : ""
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                <span className="hidden xs:inline sm:inline">Processing...</span>
              </>
            ) : isDragging ? (
              <>
                <CloudUpload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline sm:inline">Drop here</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline sm:inline">Upload</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
