interface TabsProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export default function Tabs({ activeTab, onTabChange }: TabsProps) {
    const tabs = ['Chonks', 'Traits', 'Offers', 'Activity'];

    return (
        <section className="tabs text-[1vw] border-t border-gray-300  flex flex-col bg-white py-[1.725vw] px-[3.45vw]">
            <div className="flex">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        className={`px-4 mr-2 py-2 border border-black ${
                            activeTab === tab ? 'bg-[#2F7BA7] text-white' : ''
                        }`}
                        onClick={() => onTabChange(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </section>
    );
} 