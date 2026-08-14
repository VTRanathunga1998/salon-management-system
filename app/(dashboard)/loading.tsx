import Image from "next/image";

const Loading = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-[150]">
      <Image
        src="/spinner.gif"
        alt="Loading..."
        width={80}
        height={80}
        priority
      />
    </div>
  );
};

export default Loading;
