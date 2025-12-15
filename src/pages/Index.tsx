import { useRef, useState, useEffect } from "react";
import { Sparkles, AlertTriangle, Code, Wrench, Heart, Briefcase, ArrowDown, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { KeywordCard } from "@/components/KeywordCard";
import { ActionButtons } from "@/components/ActionButtons";
import { LoadingState } from "@/components/LoadingState";
import { FileUpload } from "@/components/FileUpload";
import { FeaturesSection } from "@/components/FeaturesSection";
import { FAQSection } from "@/components/FAQSection";
import { CTASection } from "@/components/CTASection";
import { ExtractionHistory } from "@/components/ExtractionHistory";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

interface ExtractedKeywords {
  mandatory: string[];
  technical: string[];
  tools: string[];
  soft: string[];
  role: string[];
}

export default function Index() {
  const [jobDescription, setJobDescription] = useState("");
  const [keywords, setKeywords] = useState<ExtractedKeywords | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasExtracted, setHasExtracted] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const scrollToInput = () => {
    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleExtract = async () => {
    if (!jobDescription.trim() && !uploadedImageBase64) return;
    
    setIsLoading(true);
    setHasExtracted(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('extract-keywords', {
        body: { 
          jobDescription: jobDescription.trim(),
          imageBase64: uploadedImageBase64 
        }
      });

      if (error) {
        console.error('Error extracting keywords:', error);
        toast({
          title: "Extraction failed",
          description: error.message || "Failed to extract keywords. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (data?.error) {
        toast({
          title: "Extraction failed",
          description: data.error,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setKeywords(data.keywords);
      setHasExtracted(true);
      
      // Save to history if user is logged in
      if (user) {
        const totalCount = 
          data.keywords.mandatory.length +
          data.keywords.technical.length +
          data.keywords.tools.length +
          data.keywords.soft.length +
          data.keywords.role.length;
          
        const excerpt = uploadedImageBase64 
          ? `[Image: ${uploadedFile}] ${jobDescription.trim().slice(0, 100)}`
          : jobDescription.trim().slice(0, 150) + (jobDescription.length > 150 ? "..." : "");
        
        await supabase.from("extraction_history").insert({
          user_id: user.id,
          job_description_excerpt: excerpt,
          keywords: data.keywords,
          total_keywords: totalCount,
        });
      }
      
      toast({
        title: "Keywords extracted",
        description: uploadedImageBase64 
          ? "AI has analyzed your image and extracted keywords."
          : "AI has successfully analyzed your job description.",
      });
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setJobDescription("");
    setKeywords(null);
    setHasExtracted(false);
    setUploadedFile(null);
    setUploadedImageBase64(null);
  };

  const handleLoadFromHistory = (loadedKeywords: ExtractedKeywords) => {
    setKeywords(loadedKeywords);
    setHasExtracted(true);
  };

  const handleFileContent = (content: string, fileName: string, isImage?: boolean, imageBase64?: string) => {
    if (isImage && imageBase64) {
      setUploadedImageBase64(imageBase64);
      setUploadedFile(fileName);
    } else {
      if (content) {
        setJobDescription(content);
      }
      setUploadedFile(fileName);
      setUploadedImageBase64(null);
    }
  };

  const handleClearFile = () => {
    setUploadedFile(null);
    setUploadedImageBase64(null);
  };

  const totalKeywords = keywords
    ? keywords.mandatory.length +
      keywords.technical.length +
      keywords.tools.length +
      keywords.soft.length +
      keywords.role.length
    : 0;

  const canExtract = jobDescription.trim() || uploadedImageBase64;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="hero-gradient py-8 sm:py-12 lg:py-20 xl:py-24">
          <div className="max-w-4xl mx-auto px-3 sm:px-6 text-center">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-4 sm:mb-6 animate-fade-in-up">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              AI-Powered Keyword Extraction
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-3 sm:mb-4 lg:mb-6 animate-fade-in-up stagger-1 leading-tight">
              Extract Job Keywords{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                in Seconds
              </span>
            </h1>
            
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 lg:mb-10 animate-fade-in-up stagger-2 px-2">
              Supercharge your hiring process with AI. Paste any job description or upload an image 
              and instantly get organized, categorized keywords.
            </p>
            
            {/* Input Area */}
            <div ref={inputRef} className="max-w-3xl mx-auto animate-fade-in-up stagger-3">
              <div className="bg-card rounded-xl sm:rounded-2xl card-shadow p-3 sm:p-4 lg:p-6 border border-border">
                {/* Image Preview */}
                {uploadedImageBase64 && (
                  <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-2">
                      <ImageIcon className="w-4 h-4" />
                      <span>Image uploaded - AI will extract text from it</span>
                    </div>
                    <img 
                      src={uploadedImageBase64} 
                      alt="Uploaded job description" 
                      className="max-h-32 sm:max-h-40 rounded-lg object-contain mx-auto"
                    />
                  </div>
                )}
                
                <Textarea
                  placeholder={uploadedImageBase64 
                    ? "Add additional context (optional)..." 
                    : "Paste your job description here or upload a file/image...\n\nExample: We are looking for a Senior Full Stack Developer with 5+ years of experience in React, Node.js, and AWS..."}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[120px] sm:min-h-[160px] lg:min-h-[200px] text-sm sm:text-base resize-none"
                />
                
                <div className="flex flex-col gap-3 mt-3 sm:mt-4">
                  {/* Mobile: Stack vertically */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <FileUpload 
                      onFileContent={handleFileContent}
                      uploadedFile={uploadedFile}
                      onClearFile={handleClearFile}
                    />
                    {user && (
                      <ExtractionHistory onSelectExtraction={handleLoadFromHistory} />
                    )}
                    <span className="text-xs text-muted-foreground ml-auto sm:ml-0">
                      {jobDescription.length > 0 
                        ? `${jobDescription.split(/\s+/).filter(Boolean).length} words`
                        : uploadedImageBase64 
                          ? "Image ready"
                          : "PDF, Word, Text, JPG, PNG"
                      }
                    </span>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-2 justify-end">
                    {(jobDescription || uploadedImageBase64) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className="text-muted-foreground text-xs sm:text-sm"
                      >
                        Clear
                      </Button>
                    )}
                    <Button
                      variant="hero"
                      size="default"
                      onClick={handleExtract}
                      disabled={!canExtract || isLoading}
                      className="gap-1.5 sm:gap-2 px-4 sm:px-6 text-sm sm:text-base"
                    >
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {isLoading ? "Analyzing..." : "Extract Keywords"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Scroll indicator */}
            {!hasExtracted && (
              <div className="mt-8 sm:mt-12 animate-bounce hidden sm:block">
                <ArrowDown className="w-5 h-5 mx-auto text-muted-foreground" />
              </div>
            )}
          </div>
        </section>
        
        {/* Results Section */}
        {(isLoading || hasExtracted) && (
          <section className="py-8 sm:py-12 lg:py-16 bg-muted/20">
            <div className="max-w-6xl mx-auto px-3 sm:px-6">
              {isLoading ? (
                <LoadingState />
              ) : keywords && totalKeywords > 0 ? (
                <>
                  <div className="text-center mb-6 sm:mb-8 lg:mb-10">
                    <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Analysis Complete
                    </div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      {totalKeywords} Keywords Extracted
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Organized into 5 professional categories
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8">
                    <KeywordCard
                      title="Mandatory"
                      keywords={keywords.mandatory}
                      category="mandatory"
                      icon={<AlertTriangle className="w-4 h-4" />}
                      delay={0}
                    />
                    <KeywordCard
                      title="Technical Skills"
                      keywords={keywords.technical}
                      category="technical"
                      icon={<Code className="w-4 h-4" />}
                      delay={100}
                    />
                    <KeywordCard
                      title="Tools & Tech"
                      keywords={keywords.tools}
                      category="tools"
                      icon={<Wrench className="w-4 h-4" />}
                      delay={200}
                    />
                    <KeywordCard
                      title="Soft Skills"
                      keywords={keywords.soft}
                      category="soft"
                      icon={<Heart className="w-4 h-4" />}
                      delay={300}
                    />
                    <KeywordCard
                      title="Role Keywords"
                      keywords={keywords.role}
                      category="role"
                      icon={<Briefcase className="w-4 h-4" />}
                      delay={400}
                    />
                  </div>
                  
                  <ActionButtons keywords={keywords} />
                </>
              ) : (
                <div className="text-center py-8 sm:py-12 animate-fade-in-up">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                    No keywords found
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto px-4">
                    Try pasting a more detailed job description with specific skills and requirements.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Features Section */}
        {!hasExtracted && <FeaturesSection />}

        {/* FAQ */}
        {!hasExtracted && <FAQSection />}

        {/* CTA */}
        {!hasExtracted && <CTASection onGetStarted={scrollToInput} />}
      </main>
      
      <Footer />
    </div>
  );
}
