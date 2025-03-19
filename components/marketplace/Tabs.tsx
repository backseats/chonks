import { useRouter } from "next/router";

interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Tabs({ activeTab, onTabChange }: TabsProps) {
  const router = useRouter();
  const tabs = ["Chonks", "Traits"]; //, 'Offers', 'Activity'];

  const handleTabClick = (tab: string) => {
    onTabChange(tab);

    // Handle navigation based on tab
    switch (tab) {
      case "Chonks":
        router.push("/market/chonks");
        break;
      case "Traits":
        router.push("/market/traits");
        break;
      // Offers and Activity tabs do nothing for now
      default:
        break;
    }
  };

  return (
    <section className="tabs text-[14px] border-t border-gray-300  flex flex-col bg-white py-[1.725vw] px-[3.45vw]">
      <div className="flex">
        {tabs.map((tab, index) => (
          <>
            <button
              key={tab}
              className={`hover:bg-gray-200 hover:text-black px-4 mr-2 py-2 border border-black ${
                activeTab === tab ? "bg-[#126E9D] text-white" : ""
              }`}
              onClick={() => handleTabClick(tab)}
            >
              {tab}
            </button>

            {/* vert divider */}
            {/* {index === 1 && (
              <div className="h-8 w-px bg-gray-300 mx-[1.725vw] self-center" />
            )} */}
          </>
        ))}
      </div>
    </section>
  );
}
