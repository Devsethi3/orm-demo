import { Loader } from "lucide-react";

const LoadingPage = () => {
  return (
    <div>
      <div className="flex items-center justify-center w-full h-screen">
        <Loader className="w-5 h-5 animate-spin" />
      </div>
    </div>
  );
};

export default LoadingPage;
