"use client";
import React from "react";

interface AnimatedTextProps {
  text: string;
  className?: string;
  baseDelay?: number;
  spaceClassName?: string;
}

const AnimatedText = ({ text, className, baseDelay = 0, spaceClassName }: AnimatedTextProps) => {
  const characters = text.split("");

  const getAnimationDelay = (index: number) => {
    let delay = baseDelay;
    if ((index + 1) % 7 === 0) delay -= 1000;
    else if ((index + 1) % 5 === 0) delay -= 500;
    else if ((index + 1) % 3 === 0) delay -= 250;
    return `${delay}ms`;
  };

  return (
    <div className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 ${className} whitespace-nowrap`}>
      {characters.map((char, index) => {
        if (char === " ") {
          return <span key={index} className={spaceClassName} />;
        }
        return (
          <span
            key={index}
            className="m-0 [animation:fontSkew_2000ms_steps(1,end)_infinite,fontScale_1000ms_steps(1,end)_infinite]"
            style={{ animationDelay: getAnimationDelay(index) }}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
};

interface StaggeredTitleProps {
  line1: string;
  line2: string;
  className?: string;
}

export const StaggeredTitle = ({ line1, line2, className = "" }: StaggeredTitleProps) => {
  // Define responsive classes for the space between words.
  const spaceClassName = "mx-2 sm:mx-3 lg:mx-4";

  return (
    <div className={`relative w-full h-32 md:h-48 flex flex-col items-center justify-center select-none ${className}`}>
      {/* Line 1 (Londrina Solid + Sketch) */}
      <div className="relative w-full h-1/2 text-7xl sm:text-8xl md:text-9xl">
         <AnimatedText
           text={line1}
           className="font-['Londrina_Solid'] text-orange-500 dark:text-orange-400"
           baseDelay={200}
           spaceClassName={spaceClassName}
         />
         <AnimatedText
           text={line1}
           className="font-['Londrina_Sketch'] text-white"
           baseDelay={0}
           spaceClassName={spaceClassName}
         />
      </div>

      {/* Line 2 (Londrina Solid + Sketch) */}
      <div className="relative w-full h-1/2 text-7xl sm:text-8xl md:text-9xl mt-4 md:mt-8">
         <AnimatedText
           text={line2}
           className="font-['Londrina_Solid'] text-indigo-500 dark:text-indigo-400"
           baseDelay={200}
           spaceClassName={spaceClassName}
         />
         <AnimatedText
           text={line2}
           className="font-['Londrina_Sketch'] text-white"
           baseDelay={0}
           spaceClassName={spaceClassName}
         />
      </div>
    </div>
  );
};
