import { useState } from "react";
import { XMarkIcon, ArrowRightCircleIcon } from "@heroicons/react/24/outline";
import { truncateEthAddress } from "@/utils/truncateEthAddress";

interface Props {
  address: string | undefined;
  traitName: string;
  traitNameRef: React.RefObject<HTMLInputElement>;
  traitType: string;
  traitTypes: string[];
  closeModal: () => void;
  handleModalBackgroundClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onTraitTypeChange: (newTraitType: string) => void;
  setTraitName: (newTraitName: string) => void;
}

export default function MetadataModal(props: Props) {
  const {
    address,
    traitName,
    traitNameRef,
    traitType,
    traitTypes,
    closeModal,
    handleModalBackgroundClick,
    handleSubmit,
    onTraitTypeChange,
    setTraitName,
  } = props;

  const [error, setError] = useState("");

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const name = traitName.trim();
    if (!/^[a-z\s]+$/i.test(name)) {
      setError("Only letters and spaces please");
      return;
    }

    setError("");

    const metadataObject = {
      traitName: name,
      creator: address,
      traitType,
    };
    console.log(metadataObject);

    handleSubmit(e);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleModalBackgroundClick}
    >
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-medium">Set Metadata</h2>
          <button
            onClick={closeModal}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit}>
          <div className="mb-4">
            <label
              htmlFor="trait-name"
              className="block text-sm font-sm text-gray-500"
            >
              Trait Name
            </label>
            <input
              type="text"
              id="trait-name"
              name="trait-name"
              placeholder="Trait Name e.g. 'Cap Forward'"
              ref={traitNameRef}
              value={traitName}
              onChange={(e) => setTraitName(e.target.value)}
              className="mt-1 py-1 block w-full rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring-0"
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          {address && (
            <div className="mb-4">
              <label
                htmlFor="creator"
                className="block text-sm font-sm text-gray-500"
              >
                Creator
              </label>
              <input
                type="text"
                id="creator"
                name="creator"
                className="mt-1 py-1 opacity-50 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                value={truncateEthAddress(address)}
                disabled={true}
              />
            </div>
          )}

          <div className="mb-4">
            <label
              htmlFor="trait-type"
              className="block text-sm font-sm text-gray-500"
            >
              Trait Type
            </label>
            <select
              id="trait-type"
              name="trait-type"
              className="mt-1 py-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              value={traitType}
              onChange={(e) => onTraitTypeChange(e.target.value)}
            >
              {traitTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <a
            href=""
            target="_blank"
            className="w-full h-[40px] mb-4 block text-center bg-green-500 hover:bg-green-600 text-white rounded-md py-2 px-4 focus: outline-none"
          >
            <div className="flex items-center justify-center gap-1">
              Follow @Chonksxyz on{" "}
              <img
                src="/x-logo.svg"
                width={14}
                height={14}
                className="ml-[2px] mr-1"
              />
              <ArrowRightCircleIcon className="w-5 h-5" />
            </div>
          </a>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white rounded-md py-2 px-4 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Download Your Chonk
          </button>
        </form>
      </div>
    </div>
  );
}
