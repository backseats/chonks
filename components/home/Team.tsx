import Image from "next/image";

const Team = () => {
  return (
    <section
      id="team"
      className={`ourTeam border-l border-r flex flex-col justify-center items-center bg-[#0D6E9D] text-white py-12`}
    >
      <h2 className="font-source-code-pro text-[6vw] font-weight-600 mx-[6.9vw] mb-[3.45vw]">
        Our Team
      </h2>

      <div className="flex flex-col sm:flex-row w-full justify-center items-center">
        <div
          className={`sm:w-1/2 px-[3.45vw] py-[3.45vw] flex flex-col items-center`}
        >
          <a
            href="https://twitter.com/backseats_eth"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <div className="w-[50vw] h-[50vw] sm:w-[30vw] sm:h-[30vw] bg-gray-200 border border-white-300 hover:bg-gray-600 transition-colors duration-300 flex items-center justify-center overflow-hidden">
              <Image
                src="/backseats/backseats-transparent-chonk.svg"
                alt="backseats"
                width={3000}
                height={3000}
                className="w-full h-full object-contain"
              />
            </div>
          </a>
          <p className="mt-4">
            <a
              className="hover:underline"
              href="https://twitter.com/backseats_eth"
              target="_blank"
              rel="noopener noreferrer"
            >
              backseats
            </a>
          </p>
        </div>
        <div
          className={`sm:w-1/2 px-[3.45vw] py-[6.9vw] flex flex-col items-center`}
        >
          <a
            href="https://twitter.com/marka_eth"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <div className="w-[50vw] h-[50vw] sm:w-[30vw] sm:h-[30vw] bg-gray-200 border border-white-300 hover:bg-gray-600 transition-colors duration-300 flex items-center justify-center overflow-hidden">
              <Image
                src="/marka/marka-transparent-chonk.svg"
                alt="marka"
                width={3000}
                height={3000}
                className="w-full h-full object-contain"
              />
            </div>
          </a>
          <p className="mt-4">
            <a
              className="hover:underline"
              href="https://twitter.com/marka_eth"
              target="_blank"
              rel="noopener noreferrer"
            >
              marka
            </a>
          </p>
        </div>
      </div>

      <p className="font-source-code-pro text-[2.5vw] md:text-[1.5vw] font-weight-600 mx-[3.45vw]">
        A special thank you{" "}
        <a
          href="https://twitter.com/theharveydean"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Dean Harvey
        </a>
        , who designed the original Chonk and many of the Season 1 Traits. Thank
        you to{" "}
        <a
          href="https://x.com/NaimePakniyat"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Naime
        </a>{" "}
        and{" "}
        <a
          href="https://x.com/nahidpakniyat"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Nahid
        </a>
        , who helped with additional Season 1 Traits.
      </p>
    </section>
  );
};

export default Team;
