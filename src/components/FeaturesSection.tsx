import { Users, FileText, Zap, TrendingUp, Shield, Clock, Image, Camera, Search } from "lucide-react";

const stats = [
  { value: "10K+", label: "Keywords Extracted" },
  { value: "500+", label: "HR Teams" },
  { value: "98%", label: "Accuracy Rate" },
  { value: "2s", label: "Avg. Speed" },
];

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Extract keywords in seconds with our AI-powered engine",
  },
  {
    icon: Camera,
    title: "Image OCR Support",
    description: "Upload JPG/PNG images - AI extracts text automatically",
  },
  {
    icon: FileText,
    title: "Multi-Format Support",
    description: "Upload PDF, Word, text files or images directly",
  },
  {
    icon: Shield,
    title: "Smart Categorization",
    description: "Automatically sort keywords into 5 professional categories",
  },
  {
    icon: TrendingUp,
    title: "ATS Optimized",
    description: "Keywords formatted for applicant tracking systems",
  },
  {
    icon: Search,
    title: "Resume Matching",
    description: "Use extracted keywords to screen candidates faster",
  },
  {
    icon: Users,
    title: "Team Ready",
    description: "Export and share results with your hiring team",
  },
  {
    icon: Clock,
    title: "Save Hours",
    description: "Reduce manual screening time by 80%",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-12 sm:py-16 lg:py-20 bg-muted/30">
      <div className="max-w-6xl mx-auto px-3 sm:px-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-10 sm:mb-16">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center p-3 sm:p-4 lg:p-6 rounded-xl bg-card border border-border card-shadow animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">{stat.value}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2 sm:mb-3">
            Why HR Teams Choose TalentXtract
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
            Powerful features designed to streamline your hiring process
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-4 sm:p-5 rounded-xl bg-card border border-border card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
              style={{ animationDelay: `${(index + 4) * 100}ms` }}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-foreground mb-1.5 sm:mb-2">{feature.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
