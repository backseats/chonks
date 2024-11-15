import Image from 'next/image';
import Link from 'next/link';

interface FooterProps {
  scrollToSection?: (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => void;
}

export default function Footer({ scrollToSection }: FooterProps) {
  const handleScrollToTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (scrollToSection) {
      scrollToSection(e, '#top');
    }
  };

  return (
    <footer className={`w-full flex flex-col sm:flex-row justify-between px-[3.45vw] py-[3.45vw] border-t text-[2vw] md:text-[1vw] bg-white`}>
      <div className="text-left mb-2 sm:mb-0 flex items-start">
        <Link href="/#home" onClick={handleScrollToTop} className="hover:opacity-70 transition-opacity">
          <Image
            src="/chonks-head-outline.svg"
            alt="Chonks Head"
            width={48}
            height={48}
            className="h-12 md:h-12 w-auto"
          />
        </Link>
        <span className="ml-[3.45vw] md:ml-[1.725vw]">
          Chonks are cc0. <br />
          We&apos;ll have some terms in here... eventually.
        </span>
      </div>
      <div className="text-center sm:text-right my-[3.45vw] md:my-0">
        <Link href="https://x.com/chonksxyz" target="_blank" rel="noopener noreferrer" className="hover:underline">
          Follow us on X - do it!
        </Link>
      </div>
    </footer>
  );
} 