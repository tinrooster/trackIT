import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Button onClick={() => navigate("/dashboard")}>
        <Home className="mr-2 h-4 w-4" />
        Return to Dashboard
      </Button>
    </div>
  );
}