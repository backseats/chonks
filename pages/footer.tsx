import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="py-8 px-4 sm:px-8 border-t border-gray-200 font-source-code-pro">
      <div className="flex flex-row mx-auto px-4">
        <div className="hidden sm:flex sm:flex-col mr-16">
          <Link href="/" className="hover:opacity-70 transition-opacity">
            <Image
              src="/chonks-head-outline.svg"
              alt="Chonks Head"
              width={48}
              height={48}
              className="h-12 md:h-12 w-auto"
            />
          </Link>

          <div className="text-sm mt-4">Chonks are CC0</div>
        </div>

        <div className="flex flex-col justify-between w-full sm:flex-row">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-8 w-full sm:w-auto">
            {/* Developers Column */}
            <div className="w-full sm:w-40">
              <h3 className="text-sm font-bold mb-4">Developers</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/docs"
                    className="text-[rgba(34,34,34,0.4)] hover:text-[rgba(34,34,34,0.8)] transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    href="/api"
                    className="text-[rgba(34,34,34,0.4)] hover:text-[rgba(34,34,34,0.8)] transition-colors"
                  >
                    API Reference
                  </Link>
                </li>
                {/* <li>
                  <Link
                    href="/github"
                    className="text-[rgba(34,34,34,0.4)] hover:text-[rgba(34,34,34,0.8)] transition-colors"
                  >
                    GitHub
                  </Link>
                </li> */}
              </ul>
            </div>

            {/* Resources Column */}
            <div className="w-full sm:w-40">
              <h3 className="text-sm font-bold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/get-started"
                    className="text-[rgba(34,34,34,0.4)] hover:text-[rgba(34,34,34,0.8)] transition-colors"
                  >
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link
                    href="/marketplace"
                    className="text-[rgba(34,34,34,0.4)] hover:text-[rgba(34,34,34,0.8)] transition-colors"
                  >
                    Marketplace
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="text-[rgba(34,34,34,0.4)] hover:text-[rgba(34,34,34,0.8)] transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="text-[rgba(34,34,34,0.4)] hover:text-[rgba(34,34,34,0.8)] transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div className="w-full sm:w-40">
              <h3 className="text-sm font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/about"
                    className="text-[rgba(34,34,34,0.4)] hover:text-[rgba(34,34,34,0.8)] transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/careers"
                    className="text-[rgba(34,34,34,0.4)] hover:text-[rgba(34,34,34,0.8)] transition-colors"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal"
                    className="text-[rgba(34,34,34,0.4)] hover:text-[rgba(34,34,34,0.8)] transition-colors"
                  >
                    Legal
                  </Link>
                </li>
              </ul>
            </div>

            <div className="sm:hidden flex flex-col text-[rgba(34,34,34,0.4)] text-sm">
              <Link href="/" className="hover:opacity-70 transition-opacity">
                <Image
                  src="/chonks-head-outline.svg"
                  alt="Chonks Head"
                  width={48}
                  height={48}
                  className="h-12 md:h-12 w-auto"
                />
              </Link>

              <div className="text-sm mt-4">Chonks are CC0</div>
              <div className="text-sm mt-2">Please remix accordingly</div>
            </div>
          </div>

          {/* Social Icons */}
          <div className="flex justify-start sm:justify-end space-x-4">
            <Link
              href="https://x.com/chonksxyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[rgba(34,34,34,0.4)] hover:text-[rgba(34,34,34,0.8)] transition-colors"
            >
              <svg
                width="18"
                height="19"
                viewBox="0 0 18 19"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.4898 7.62738L17.0515 0H15.4966L9.79908 6.62275L5.24853 0H0L6.88133 10.0148L0 18.0132H1.55499L7.57167 11.0194L12.3774 18.0132H17.6259L10.4894 7.62738H10.4898ZM8.36005 10.103L7.66282 9.10575L2.11527 1.17057H4.50364L8.98058 7.57452L9.6778 8.57176L15.4973 16.8959H13.1089L8.36005 10.1034V10.103Z"
                  fill="currentColor"
                ></path>
              </svg>
            </Link>

            {/* <Link
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[rgba(34,34,34,0.4)] hover:text-[rgba(34,34,34,0.8)] transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8.00621 0.5C3.85547 0.5 0.5 3.93749 0.5 8.19012C0.5 11.5895 2.64996 14.467 5.63253 15.4854C6.00543 15.562 6.14202 15.3199 6.14202 15.1163C6.14202 14.9381 6.12973 14.327 6.12973 13.6903C4.04169 14.1487 3.60687 12.7735 3.60687 12.7735C3.27131 11.8823 2.77411 11.6532 2.77411 11.6532C2.09069 11.1821 2.82389 11.1821 2.82389 11.1821C3.58198 11.2331 3.97977 11.9715 3.97977 11.9715C4.65074 13.1428 5.73194 12.8118 6.16691 12.6081C6.22899 12.1115 6.42796 11.7678 6.63922 11.5768C4.97386 11.3985 3.22168 10.7365 3.22168 7.78263C3.22168 6.94232 3.51975 6.25482 3.99206 5.72013C3.91754 5.5292 3.6565 4.73967 4.06673 3.68296C4.06673 3.68296 4.70052 3.47921 6.12958 4.47233C6.74141 4.30399 7.37238 4.21836 8.00621 4.21764C8.63999 4.21764 9.28607 4.30686 9.88268 4.47233C11.3119 3.47921 11.9457 3.68296 11.9457 3.68296C12.3559 4.73967 12.0947 5.5292 12.0202 5.72013C12.505 6.25482 12.7907 6.94232 12.7907 7.78263C12.7907 10.7365 11.0386 11.3857 9.36075 11.5768C9.63424 11.8187 9.87024 12.277 9.87024 13.0028C9.87024 14.034 9.85794 14.8617 9.85794 15.1162C9.85794 15.3199 9.99469 15.562 10.3674 15.4856C13.35 14.4668 15.5 11.5895 15.5 8.19012C15.5123 3.93749 12.1445 0.5 8.00621 0.5Z"
                  fill="currentColor"
                ></path>
              </svg>
            </Link> */}
          </div>
        </div>
      </div>
    </footer>
  );
}
