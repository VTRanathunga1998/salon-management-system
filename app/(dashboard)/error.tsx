"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full text-center p-8">
      <h1 className="text-2xl font-bold text-red-600 mb-2">
        Something went wrong
      </h1>
      <p className="text-gray-600 mb-4">
        We couldn’t load the page. It may be due to a database connection issue.
      </p>
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
