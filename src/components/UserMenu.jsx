import { User } from "lucide-react";
import { useState } from "react";

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const email = localStorage.getItem("userEmail");
  const referralCode = localStorage.getItem("referralCode");

  return (
    <div className="relative">
      <User
        className="text-gold cursor-pointer hover:scale-110 transition"
        size={20}
        onClick={() => setOpen(!open)}
      />
      {open && (
        <div className="absolute right-0 mt-2 bg-black/90 text-white border border-gold rounded-xl p-3 w-56 shadow-lg z-50">
          {email ? (
            <>
              <p className="text-sm mb-2">Giriş: <span className="text-gold">{email}</span></p>
              {referralCode && (
                <p className="text-xs mb-2">
                  Referans kodun: <span className="text-gold">{referralCode}</span>
                </p>
              )}
              <button
                onClick={() => { localStorage.clear(); location.reload(); }}
                className="w-full bg-gold text-black rounded-md py-1 hover:opacity-90"
              >
                Çıkış Yap
              </button>
            </>
          ) : (
            <button
              onClick={() => setOpen(false) || window.dispatchEvent(new CustomEvent("openLogin"))}
              className="w-full bg-gold text-black rounded-md py-1 hover:opacity-90"
            >
              Giriş Yap
            </button>
          )}
        </div>
      )}
    </div>
  );
}
