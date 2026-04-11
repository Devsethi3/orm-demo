import Image from "next/image";

const Logo = () => {
  return (
    <div className="flex items-center">
      <Image src={"/logo.svg"} alt="Logo" width={50} height={50} priority />
      <span className="font-bricolage -ml-2 text-2xl font-medium">ocket</span>
    </div>
  );
};

export default Logo;
