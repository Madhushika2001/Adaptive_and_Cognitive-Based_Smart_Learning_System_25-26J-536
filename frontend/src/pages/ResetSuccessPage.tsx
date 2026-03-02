import { Link, useNavigate } from "react-router-dom";
import image4 from "../assets/reset-password-sucessfull.svg"; // replace with your "success" illustration if you have one
import { FaCheck } from "react-icons/fa";

export default function ResetSuccessPage() {
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-10 py-8 lg:py-[52px] font-sans">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-[34px] items-center">
        {/* Left */}
        <div className="w-full flex flex-col items-center lg:items-start">
          <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-extrabold bg-gradient-to-b from-[#44A673] via-[#2E967E] to-[#15828A] bg-clip-text text-transparent">
            CongiLearn !
          </h1>

          <div className="mt-8 lg:mt-12 w-full flex flex-col items-center lg:items-start">
            {/* Illustration holder */}
            <div className="relative w-full flex justify-center lg:justify-start">
              <img
                src={image4}
                alt="Password reset success"
                className="max-w-full h-auto"
              />

              {/* Check badge (optional) */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 lg:left-[180px] lg:translate-x-0 w-16 h-16 rounded-full bg-[#44A673] flex items-center justify-center text-white shadow-md">
                <FaCheck size={24} />
              </div>
            </div>

            <p className="mt-6 text-[#4B5563] text-[16px] sm:text-[18px]">
              Password Updated!
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="w-full flex flex-col items-center lg:items-start">
          <h2 className="text-[26px] sm:text-[32px] font-bold text-[#055160] text-center lg:text-left">
            Password Reset Successful !
          </h2>

          <p className="text-[#055160] text-[12px] sm:text-[14px] mt-4 text-center lg:text-left max-w-md">
            Your password has been successfully reset, click below to continue
            your access
          </p>

          <div className="mt-8 w-full flex flex-col items-center lg:items-start">
            <button
              onClick={() => nav("/signin", { replace: true })}
              className="w-full sm:w-[244px] h-12 sm:h-14 rounded-[8px] bg-[#055160] text-white hover:opacity-95"
            >
              Continue
            </button>

            <div className="pt-4 flex items-center gap-2 text-[#055160]">
              <span className="text-xl">←</span>
              <Link to="/signin" className="text-sm hover:underline">
                Return to the sign in screen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
