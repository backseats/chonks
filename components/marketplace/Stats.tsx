import { FaEthereum } from "react-icons/fa6";

export default function Stats() {
    return (
        <section className={`mpStats  border-l border-r flex flex-col bg-white py-[3.45vw]`}> 
        {/* borderTopFull */}
            <div className="col-span-full flex flex-row flex-wrap gap-[3.45vw] ">
                <div className="w-auto flex-row items-center mx-[1.725vw]">
                    <h1 className="font-source-code-pro text-[2vw] font-weight-600 mb-1 font-bold">
                        Chonks Marketplace
                    </h1>
                </div>

                <div className="w-auto flex flex-row space-x-8 border border-black p-4 bg-gray-100">
                    <h2 className="flex flex-col px-8 border-r border-gray-300">
                        <span className="text-sm mb-1">Floor</span>
                        <span className="text-[1.5vw] flex items-center">0.68 <FaEthereum className="ml-1 text-[1vw]" /></span>
                    </h2>
                    <h2 className="flex flex-col px-8 border-r border-gray-300">
                        <span className="text-sm mb-1">On Sale</span>
                        <span className="text-[1.5vw]">420/10K</span>
                    </h2>
                    <h2 className="flex flex-col px-8 border-r border-gray-300">
                        <span className="text-sm mb-1">Owners</span>
                        <span className="text-[1.5vw]">4,329</span>
                    </h2>
                    <h2 className="flex flex-col px-8">
                        <span className="text-sm mb-1">Best Offer</span>
                        <span className="text-[1.5vw] flex items-center">0.58 <FaEthereum className="ml-1 text-[1vw]" /></span>
                    </h2>
                </div>
            </div>
        </section>
    );
} 