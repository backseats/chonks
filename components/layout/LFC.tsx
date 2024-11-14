import { useEffect } from 'react';
import gsap from 'gsap';

export default function LFC() {
  useEffect(() => {
    // Marquee animation
    const marqueeWrapper = document.querySelector('.marquee-wrapper');
    if (marqueeWrapper) {
      const marqueeText = document.querySelector('.marquee-text');
      if (marqueeText) {
        // Clone the text and append it
        const clone = marqueeText.cloneNode(true);
        marqueeWrapper.appendChild(clone);
      }

      gsap.to('.marquee-text', {
        x: '-100%',
        repeat: -1,
        duration: 25,
        ease: "none",
        modifiers: {
          x: gsap.utils.unitize(x => parseFloat(x) % 100)
        }
      });
    }
  }, []);

  return (
    <section className="bg-black text-white overflow-hidden">
      <div className="marquee-wrapper relative flex whitespace-nowrap my-[3.45vw]">
        <div className="marquee-text inline-flex">
          <span className="font-source-code-pro text-[12vw] font-weight-600 mx-[1.725vw]">
            LET&apos;S F*CKING CHONK! &nbsp;
          </span>
          <span className="font-source-code-pro text-[12vw] font-weight-600 mx-[1.725vw]">
            LET&apos;S F*CKING CHONK! &nbsp;
          </span>
        </div>
      </div>
    </section>
  );
} 