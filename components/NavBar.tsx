"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Menu as MenuIcon, Close as CloseIcon } from "@mui/icons-material";
import NavSearchBar from "./NavSearchBar";

export interface NavigationItem {
  name: string;
  href: string;
}

interface NavBarProps {
  navigation: NavigationItem[];
}

export function NavBar({ navigation }: NavBarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 h-20 transition-all duration-300">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            {/* --- GAUCHE : Logo --- */}
            <div className="flex-shrink-0 flex items-center">
              <Link
                href="/"
                className="flex items-center gap-3 group relative z-50"
              >
                <Image
                  src="/icon.png"
                  alt="Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                ></Image>
                <span className="text-lg font-extrabold tracking-tight uppercase text-slate-900 whitespace-nowrap">
                  Nos Députés
                </span>
              </Link>
            </div>

            {/* --- CENTRE : Navigation Desktop (Cachée sur mobile) --- */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="flex items-center bg-gray-50/80 p-1 rounded-full border border-gray-200/50 shadow-sm backdrop-blur-sm">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`px-5 py-2.5 rounded-full text-[11px] font-bold tracking-widest uppercase transition-all duration-300 ${
                        isActive
                          ? "bg-[#1A1A1B] text-white shadow-md transform scale-105"
                          : "text-gray-500 hover:text-black hover:bg-white/60"
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* --- DROITE : Menu Mobile (Hamburger) --- */}
            <div className="flex md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors relative z-50"
                aria-label="Menu principal"
              >
                {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>

            {/* --- DROITE : Mini Search Desktop --- */}
            <div className="hidden md:flex items-center justify-end w-[260px]">
              <NavSearchBar />
            </div>
          </div>
        </div>
      </nav>

      {/* --- Overlay Menu Mobile --- */}
      <div
        className={`fixed inset-0 z-40 bg-white transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0 pointer-events-none"
        }`}
        style={{ top: "80px" }}
      >
        <div className="flex flex-col items-center pt-8 px-6 space-y-4">
          {/* Search mobile */}
          <div className="w-full pb-2">
            <NavSearchBar mobile />
          </div>

          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="w-full text-center py-4 text-lg font-bold text-gray-800 border-b border-gray-100 uppercase tracking-widest hover:bg-gray-50 transition-colors"
            >
              {item.name}
            </Link>
          ))}

          <div className="pt-8">
            <p className="text-xs text-gray-400 uppercase tracking-widest">
              Réveils Citoyens
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
