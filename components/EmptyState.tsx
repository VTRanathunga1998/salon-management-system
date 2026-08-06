"use client";

type EmptyStateProps = {
  title?: string;
  description?: string;
  imageSrc?: string;
};

const EmptyState = ({
  title = "No data found",
  description = "Start by adding new data",
  imageSrc = "/no-data.gif",
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-[60vh] text-gray-600">
      <img
        src={imageSrc}
        alt="No data"
        className="w-40 h-40 mb-4 object-contain"
      />
      <p className="text-lg font-semibold">{title}</p>
      <p className="text-sm text-gray-400 mt-1">{description}</p>
    </div>
  );
};

export default EmptyState;
