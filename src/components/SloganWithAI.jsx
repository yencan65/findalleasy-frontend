export default function SloganWithAI() {
  const hello = () => alert("Merhaba 👋, ben Sono. Yardım için hazırım.");

  return (
    <div className="text-center pt-6">
      <h1 className="font-apple font-medium text-[22px] md:text-[26px] text-paper/95">
      {t("sloganFull")}

        <button
          onClick={hello}
          title="Sono mini"
          className="align-middle inline-flex items-center justify-center mx-1"
        >
          <img
            src="/public/sono-assets/sono-face.svg"
            alt="Sono"
            className="w-9 h-9 md:w-10 md:h-10 animate-slow-float"
          />
        </button>{" "}
        halleder.
      </h1>

      <style>{`
        @keyframes slowFloat {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .animate-slow-float {
          animation: slowFloat 3.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
