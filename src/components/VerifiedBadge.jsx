export default function VerifiedBadge() {
  return (
    <div className="w-[26px] h-[26px] flex items-center justify-center">
      <svg
        width="26"
        height="26"
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Arka plan tırtıklı rozet */}
        <path
          d="
            M32 2
            l8 4
            l9 -1
            l4 8
            l8 4
            l-1 9
            l4 8
            l-4 8
            l1 9
            l-8 4
            l-4 8
            l-9 -1
            l-8 4
            l-8 -4
            l-9 1
            l-4 -8
            l-8 -4
            l1 -9
            l-4 -8
            l4 -8
            l-1 -9
            l8 -4
            l4 -8
            l9 1
            z
          "
          fill="#1f5fab"
        />

        {/* İç çember */}
        <circle cx="32" cy="32" r="16" fill="none" stroke="white" strokeWidth="4" />

        {/* Tik işareti */}
        <path
          d="M24 33 L30 39 L42 25"
          stroke="white"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Kurdele sol */}
        <path
          d="M22 48 L22 62 L32 54 Z"
          fill="#1f5fab"
        />

        {/* Kurdele sağ */}
        <path
          d="M42 48 L42 62 L32 54 Z"
          fill="#1f5fab"
        />
      </svg>
    </div>
  );
}
