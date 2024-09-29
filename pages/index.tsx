export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-10 bg-[#356D9A] text-[#F5F5F5]">
      <div className="text-4xl md:text-5xl font-semibold">Chonks</div>
      <div className="text-2xl md:text-3xl font-semibold px-4">
        Coming to Base in October
      </div>
      <a
        href="https://twitter.com/chonksxyz"
        target="_blank"
        className="text-2xl md:text-3xl font-semibold px-4"
      >
        <span className="underline">Follow @Chonksxyz</span> on
        <img
          src="/x-logo.svg"
          width={20}
          height={20}
          className="inline ml-2 -mt-1"
        />
      </a>
    </div>
  );
}
