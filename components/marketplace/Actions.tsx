import { VscListFilter, VscSearch } from "react-icons/vsc";

interface ActionsProps {
  type: "chonk" | "trait";
  isSidebarVisible: boolean;
  setIsSidebarVisible: (visible: boolean) => void;
  searchId: string;
  setSearchId: (id: string) => void;
  sortOrder: "low-to-high" | "high-to-low";
  setSortOrder: (order: "low-to-high" | "high-to-low") => void;
}

export default function Actions({
  type,
  isSidebarVisible,
  setIsSidebarVisible,
  searchId,
  setSearchId,
  sortOrder,
  setSortOrder,
}: ActionsProps) {
  return (
    <section className="actions flex flex-col bg-white py-[1.725vw] px-[3.45vw]">
      <div className="flex justify-between items-center mb-4">
        {/* <button
          // onClick={() => setIsSidebarVisible(!isSidebarVisible)}
          onClick={() => {}} // temp disabled
          className="flex items-center gap-2 px-4 py-2 border border-black hover:bg-gray-100"
        >
          <VscListFilter />
        </button> */}

        <div className="flex items-center gap-4">
          {/* <div className="relative">
            <VscSearch className="absolute left-3 max-w-[1vw] top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="number"
              placeholder={`Search by ${
                type.charAt(0).toUpperCase() + type.slice(1)
              } ID`}
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="pl-10 px-4 py-2 border border-black text-[1vw] w-[40vw]"
            />
          </div> */}

          <div className="relative">
            <select
              className="px-4 py-2 pr-8 border border-black text-[14px] bg-white appearance-none"
              value={sortOrder}
              onChange={(e) =>
                setSortOrder(e.target.value as "low-to-high" | "high-to-low")
              }
            >
              <option value="low-to-high">Price: Low to High</option>
              <option value="high-to-low">Price: High to Low</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg
                className="fill-current h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
