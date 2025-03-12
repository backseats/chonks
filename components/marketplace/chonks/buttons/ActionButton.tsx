export const ActionButton = ({
  variant = "primary",
  disabled = false,
  onClick,
  children,
}: {
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => {
  const variantClasses = {
    primary: "bg-chonk-blue text-white hover:brightness-110",
    secondary: "bg-white text-black border border-black hover:bg-gray-100",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };

  return (
    <button
      className={`w-full py-2 px-4 transition-colors ${
        variantClasses[variant]
      } ${disabled ? "opacity-50" : ""}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
