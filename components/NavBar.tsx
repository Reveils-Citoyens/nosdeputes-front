"use client";

import { usePathname } from "next/navigation"; // This is hypothetical, replace with the appropriate import
import Link from "next/link";

export interface NavigationItem {
  name: string;
  href: string;
}

interface NavBarProps {
  navigation: NavigationItem[];
}

export function NavBar({ navigation }: NavBarProps) {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-100 h-20 flex items-center">
      {/* On utilise grid-cols-3 pour diviser la barre en 3 zones égales.
          Cela force la zone du milieu à être mathématiquement au centre de la page.
      */}
      <div className="w-full px-8 grid grid-cols-3 items-center">
        
        {/* GAUCHE : Logo */}
        <div className="flex justify-start">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/icon.png"
              alt="Logo"
              className="h-8 w-8 transition-transform duration-300 group-hover:scale-110"
            />
            <span className="text-lg font-bold tracking-tighter uppercase text-slate-900 whitespace-nowrap">
              Nos Députés
            </span>
          </Link>
        </div>

        {/* CENTRE : Onglets avec forme "Pill" */}
        <div className="flex justify-center">
          <div className="flex items-center bg-[#F8F9FA] p-1.5 rounded-full border border-gray-100">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-6 py-2 rounded-full text-[11px] font-bold tracking-[0.15em] uppercase transition-all duration-300 ${
                    isActive
                      ? "bg-[#1A1A1B] text-white shadow-md"
                      : "text-gray-500 hover:text-black hover:bg-gray-200/50"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* DROITE : Vide (Sert de contrepoids pour le centrage) */}
        <div className="flex justify-end invisible md:visible">
            {/* Laisser vide pour l'instant */}
        </div>

      </div>
    </nav>
  );
}