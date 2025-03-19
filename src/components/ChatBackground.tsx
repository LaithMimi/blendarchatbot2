
import React from 'react';

const ChatBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Top left decorative element */}
      <img 
        src="/images/img2.png" 
        alt="Decorative Arabic calligraphy" 
        className="absolute top-[10%] left-[5%] w-24 md:w-32 lg:w-40 h-auto opacity-30 animate-float transition-all ease-in-out duration-&lsqb;11000ms&rsqb max-w-[15vw]"
      />
      <img
        src="/images/img2.png"
        alt="Decorative Arabic calligraphy"
        className="absolute top-[20%] right-[25%] w-20 md:w-28 lg:w-36 h-auto opacity-20 animate-float-slower transition-all ease-in-out duration-[12000ms] max-w-[15vw]"
      />
      <img
        src="/images/img3.png"
        alt="Decorative Arabic calligraphy"
        className="absolute bottom-[20%] left-[25%] w-20 md:w-28 lg:w-36 h-auto opacity-20 animate-float-slow transition-all ease-in-out duration-[12000ms] max-w-[15vw]"
      />
      <img
        src="/images/img1.png"
        alt="Decorative Arabic calligraphy"
        className="absolute bottom-[10%] right-[45%] w-24 md:w-32 lg:w-40 h-auto opacity-30 animate-float-slower transition-all ease-in-out duration-[12000ms] max-w-[15vw]"
      />

      {/* Top right decorative element */}
      <img 
        src="/images/img1.png" 
        alt="Decorative Arabic pattern" 
        className="absolute top-[8%] right-[5%] w-20 md:w-28 lg:w-36 h-auto opacity-20 animate-float-slow transition-all ease-in-out duration-&lsqb;11000ms&rsqb max-w-[15vw]"
      />
      
      {/* Bottom left decorative element */}
      <img 
        src="/images/img4.png" 
        alt="Decorative element" 
        className="absolute bottom-[12%] left-[8%] w-24 md:w-32 lg:w-40 h-auto opacity-30 animate-float-slower transition-all ease-in-out duration-&lsqb;11000ms&rsqb max-w-[15vw]"
      />
      
      {/* Bottom right decorative element */}
      <img 
        src="/images/img3.png" 
        alt="Decorative Arabic lettering" 
        className="absolute bottom-[15%] right-[7%] w-20 md:w-28 lg:w-36 h-auto opacity-25 animate-float-slow transition-all ease-in-out duration-&lsqb;11000ms&rsqb max-w-[15vw]"
      />
      <img
        src="/images/img5.png"
        alt="Decorative Arabic lettering"
        className="absolute top-[35%] right-[10%] w-20 md:w-28 lg:w-36 h-auto opacity-20 animate-float-slower transition-all ease-in-out duration-[12000ms] max-w-[15vw]"
      />
      <img
        src="/images/img6.png"
        alt="Decorative Arabic lettering"
        className="absolute bottom-[45%] left-[10%] w-20 md:w-28 lg:w-36 h-auto opacity-20 animate-float-slow transition-all ease-in-out duration-[12000ms] max-w-[15vw]"
      />
      <img
        src="/images/img3.png"
        alt="Decorative Arabic lettering"
        className="absolute top-[45%] left-[50%] w-20 md:w-28 lg:w-36 h-auto opacity-20 animate-float-slower transition-all ease-in-out duration-[12000ms] max-w-[15vw]"
      />

      <img
        src="/images/img4.png"
        alt="Decorative Arabic lettering"
        className="absolute top-[20%] right-[60%] w-20 md:w-28 lg:w-36 h-auto opacity-20 animate-float-slow transition-all ease-in-out duration-[12000ms] max-w-[15vw]"
      />
    </div>
  );
};

export default ChatBackground;
