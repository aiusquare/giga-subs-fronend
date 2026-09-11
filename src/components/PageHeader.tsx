import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
}

export function PageHeader({ title, showBack = true }: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    // Check if there's history to go back to, otherwise go to dashboard
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <header className="flex items-center gap-3 py-4 animate-fade-in">
      {showBack && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      )}
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
    </header>
  );
}
