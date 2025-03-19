import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';
import TutorialPopup from '@/components/TutorialPopup';
import { 
  ChevronDown, 
  Calendar, 
  Users, 
  Briefcase, 
  Heart, 
  ExternalLink, 
  ArrowRight,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle
} from 'lucide-react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { motion } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const [scrolled, setScrolled] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const aboutRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    const tutorialShown = localStorage.getItem('tutorialShown');
    if (!tutorialShown) {
      setShowTutorial(true);
    }
    
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 100) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
      
      const elements = document.querySelectorAll('.animate-on-scroll');
      elements.forEach(element => {
        const rect = element.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.8) {
          element.classList.add('animate-fade-in');
        }
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      {showTutorial && <TutorialPopup onClose={() => setShowTutorial(false)} />}
      
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 overflow-hidden bg-brand-background dark:bg-brand-darkGray/90 text-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img 
            src="/images/img3.png" 
            alt="Decorative Element 1" 
            className="absolute top-[5%] md:top-[5%] left-[5%] md:left-[20%] w-36 md:w-46 h-auto opacity-90 animate-float transition-all ease-in-out duration-[15000ms] hover:scale-105 hover:rotate-[3deg] hover:opacity-100 max-w-[20vw] md:max-w-[15vw]"
          />

          <img 
            src="/images/img2.png" 
            alt="Decorative Element 2" 
            className="absolute top-[15%] right-[5%] md:right-[20%] w-28 md:w-44 h-auto opacity-90 animate-float-slow transition-all ease-in-out duration-[12000ms] hover:scale-105 hover:rotate-[-3deg] hover:opacity-100 max-w-[20vw] md:max-w-[15vw]"
          />

          <img 
            src="/images/img1.png" 
            alt="Decorative Element 3" 
            className="absolute bottom-[15%] left-[8%] md:left-[15%] w-32 md:w-52 h-auto opacity-90 animate-float-slower transition-all ease-in-out duration-[14000ms] hover:scale-110 hover:opacity-100 hover:translate-x-2 max-w-[20vw] md:max-w-[15vw]"
          />

          <img 
            src="/images/img4.png" 
            alt="Decorative Element 4" 
            className="absolute top-[60%] right-[8%] md:right-[15%] w-24 md:w-40 h-auto opacity-90 animate-float transition-all ease-in-out duration-[13000ms] hover:rotate-[5deg] hover:scale-110 hover:opacity-100 max-w-[20vw] md:max-w-[15vw]"
          />

          <img 
            src="/images/img5.png" 
            alt="Decorative Element 5" 
            className="absolute top-[40%] left-[5%] md:left-[15%] w-28 md:w-50 h-auto opacity-90 animate-float transition-all ease-in-out duration-[11000ms] hover:skew-x-6 hover:scale-110 hover:opacity-100 max-w-[20vw] md:max-w-[15vw]"
          />

        </div>
        
        <div className="z-10 max-w-6xl mx-auto text-center space-y-8 animate-fade-in">
            <div className="w-full max-w-lg mx-auto mb-2 md:mb-6">
            <motion.img 
              src="/images/blendar2.png" 
              alt="Blend.Ar Logo" 
              className="w-full h-auto"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
            </div>
          
            <motion.h1 
            className="text-3xl sm:text-5xl md:text-6xl font-alef font-bold text-brand-darkGray dark:text-white text-center" 
            dir="rtl"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            >
            <span className="text-brand-bordeaux">أهلاً وسهلاً في بوت تعلم العربي</span> 
            </motion.h1>
            
            
            
            <motion.p 
            className="text-xl md:text-2xl lg:text-3xl font-alef text-brand-darkGray/80 dark:text-white/80 max-w-3xl mx-auto text-center" 
            dir="rtl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: "easeInOut", delay: 0.5 }}
            >
            {Array.from("מחברים בין תרבויות, יוצרים קשרים משמעותיים").map((char, index) => (
              <motion.span
              key={index}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.05, delay: index * 0.05 }}
              >
              {char}
              </motion.span>
            ))}
            </motion.p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <a 
              href="https://www.blendarabic.com/" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                className="w-full sm:w-auto bg-transparent border-2 border-brand-darkGray dark:border-white text-brand-darkGray dark:text-white text-lg py-6 px-8 rounded-full transition-transform transform hover:scale-105 hover:bg-brand-darkGray/10 dark:hover:bg-white/10 flex items-center gap-2"
              >
                למד עוד
                <ExternalLink className="h-5 w-5" />
              </Button>
            </a>
            <Link to={isAuthenticated ? "/chat" : "/auth"}>
              <Button
                className="w-full sm:w-auto bg-brand-yellow hover:bg-brand-yellow/90 text-brand-darkGray text-lg py-6 px-8 rounded-full transition-transform transform hover:scale-105 flex items-center gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                {isAuthenticated ? "המשך לצ'אט-בוט" : "התחבר לצ'אט-בוט"}
              </Button>
            </Link>
            <Link to="/subscription">
              <Button
                variant="outline"
                className="w-full sm:w-auto bg-brand-bordeaux hover:bg-brand-bordeaux/90 text-white text-lg py-6 px-8 rounded-full transition-transform transform hover:scale-105 flex items-center gap-2"
              >
                Premium Plans
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
          
          <div className="absolute bottom-10 left-0 right-0 flex justify-center animate-bounce">
            <button 
              className="rounded-full p-2 bg-white/20 backdrop-blur-sm border border-white/10 dark:bg-black/20"
              onClick={() => scrollToSection(aboutRef)}
              aria-label="Scroll down"
            >
              <ChevronDown className="w-6 h-6 text-brand-darkGray dark:text-white" />
            </button>
          </div>
        </div>
      </section>
      
      <section ref={aboutRef} className="py-16 md:py-24 px-6 md:px-10 bg-white dark:bg-black/20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 md:gap-16 items-center">
          <div className="overflow-hidden rounded-xl shadow-xl animate-on-scroll order-2 md:order-1 h-full">
            <img 
              src="/images/people.png" 
              alt="Diverse group of people learning together" 
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              style={{ minHeight: '400px', maxHeight: '600px' }}
            />
            
          </div>
          <div className="space-y-6 animate-on-scroll order-1 md:order-2">
         
            <motion.h2 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-3xl md:text-4xl lg:text-5xl font-alef font-bold text-brand-darkGray dark:text-white text-right" 
              dir="rtl"
            >
              מי <span className="text-brand-bordeaux">אנחנו</span>?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg md:text-xl text-brand-darkGray/80 dark:text-white/80 text-right" 
              dir="rtl"
            >
              Blend.Ar היא קהילה של לומדי ודוברי ערבית, המטפחת דור חדש של יהודים-ישראלים המבינים את השפה והתרבות הערבית. אנחנו מאמינים שלימוד שפה הוא הצעד הראשון ליצירת קשרים משמעותיים בין תרבויות.
            </motion.p>
            
            <motion.blockquote 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="border-r-4 border-brand-bordeaux pr-4 my-8 text-right" 
              dir="rtl"
            >
              <p className="text-xl italic text-brand-bordeaux dark:text-brand-yellow">
              "הבנת שפה היא הבנת אנשים."
              </p>
            </motion.blockquote>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-lg md:text-xl text-brand-darkGray/80 dark:text-white/80 text-right" 
              dir="rtl"
            >
              באמצעות גישה חדשנית ללימוד השפה הערבית והתרבות שלה, אנו בונים גשרים של הבנה, יוצרים הזדמנויות כלכליות ומקדמים שיתוף פעולה חברתי.
            </motion.p>
          </div>
        </div>
      </section>
      
      <section ref={ctaRef} className="relative py-16 md:py-24 px-6 md:px-10 bg-brand-bordeaux text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJ3aGl0ZSIgZmlsbC1ydWxlPSJldmVub2RkIj48Y2lyY2xlIGN4PSIyIiBjeT0iMiIgcj0iMiIvPjwvZz48L3N2Zz4=')]"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8 animate-on-scroll">
            <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-4xl lg:text-5xl font-alef font-bold"
            >
            צור קשר
            </motion.h2>
            <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl opacity-90 mx-auto max-w-2xl"
            >
            יחד, אנו יכולים לבנות גשרים תרבותיים ולחזק את החברה הישראלית
            </motion.p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://api.whatsapp.com/send/?phone=97225383892&text&app_absent=0" target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                className="w-full sm:w-auto bg-transparent border-2 border-white text-white text-lg py-6 px-8 rounded-full transition-transform transform hover:scale-105 hover:bg-white/10 flex items-center gap-2"
              >
                צור קשר
                <ExternalLink className="h-5 w-5" />
              </Button>
            </a>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
