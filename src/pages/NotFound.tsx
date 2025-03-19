
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col bg-brand-background dark:bg-brand-darkGray/90">
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white/70 dark:bg-brand-darkGray/50 backdrop-blur-sm border border-brand-bordeaux/10 p-8 rounded-2xl max-w-md w-full text-center animate-fade-in">
          <div className="text-6xl font-bold mb-2 text-brand-bordeaux">404</div>
          <h1 className="text-2xl font-bold mb-4 text-brand-darkGray dark:text-white">Page not found</h1>
          <p className="text-brand-darkGray/80 dark:text-white/80 mb-8">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <Link 
            to="/" 
            className="btn-primary inline-flex items-center justify-center"
          >
            Return to Home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
