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
    <nav className="bg-white shadow h-15">
      <div className="flex justify-between h-16">
        <div className="flex justify-start">
          <Link
            href="/"
            className={`flex items-center text-sm font-medium uppercase transition px-4 py-4 duration-300 ease-in-out text-gray-500 hover:bg-gray-200 hover:text-gray-700`}
          >
            <img
              src="/icon.png"
              alt="Nos Députés Logo"
              className="h-6 w-6 mr-2"
            />
            Nos Députés
          </Link>
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center text-sm font-medium uppercase transition px-4 py-4 duration-300 ease-in-out text-gray-500 hover:bg-gray-200 hover:text-gray-700`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
