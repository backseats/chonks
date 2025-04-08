import { useRouter } from "next/router";
import { Fragment } from "react";

interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Tabs({ activeTab, onTabChange }: TabsProps) {
  const router = useRouter();
  const tabs = ["Traits", "Chonks", "For Sale", "Sales"]; //, 'Offers', 'Activity'];

  const handleTabClick = (tab: string) => {
    onTabChange(tab);

    // Handle navigation based on tab
    switch (tab) {
      case "Traits":
        router.push("/market/traits");
        break;
      case "Chonks":
        router.push("/market/chonks");
        break;
      case "For Sale":
        router.push("/market/forsale");
        break;
      case "Sales":
        router.push("/market/sales");
        break;
      default:
        break;
    }
  };

  return (
    <section className="tabs text-[14px] border-t border-gray-300 flex flex-col bg-white py-[1.725vw] sm:px-[3.45vw] justify-center items-center sm:items-start">
      <div className="flex flex-wrap justify-center sm:justify-start w-full">
        {tabs.map((tab, index) => {
          // Add horizontal rule between index 1 and 2
          const showDivider = index === 1;

          return (
            <Fragment key={index}>
              <button
                className={`hover:bg-gray-200 hover:text-black px-4 ${
                  index === tabs.length - 1 ? "" : "mr-2"
                } py-2 border border-black ${
                  activeTab === tab ? "bg-[#126E9D] text-white" : ""
                }`}
                onClick={() => handleTabClick(tab)}
              >
                {tab}
              </button>

              {showDivider && (
                <div className="hidden sm:block border-r border-gray-500 h-[39px] mr-4 ml-2 self-center" />
              )}
            </Fragment>
          );
        })}
      </div>
    </section>
  );
}
