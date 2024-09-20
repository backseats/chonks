interface Props {
  category: string;
  selectedCategory: string;
  onClick: () => void;
}

export default function CategoryButton(props: Props) {
  const { category, selectedCategory, onClick } = props;

  return (
    <button
      className={`rounded-md px-4 py-2 ${
        selectedCategory === category
          ? "bg-black text-white"
          : "bg-gray-500 text-white hover:bg-black"
      }`}
      onClick={onClick}
    >
      {category}
    </button>
  );
}
