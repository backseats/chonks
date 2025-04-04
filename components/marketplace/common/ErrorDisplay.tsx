const ErrorDisplay = ({
  error,
  className,
}: {
  error: string | null;
  className?: string;
}) =>
  error && <div className={`text-red-500 text-sm ${className}`}>{error}</div>;

export default ErrorDisplay;
