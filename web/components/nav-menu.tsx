"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
// Import the ThemeToggle component at the top of the file
import { ThemeToggle } from "@/components/theme-toggle";

const navLinks = [
  { href: "/", label: "ProdigyAI", isHome: true },
  { href: "/ai-model", label: "AI Model" },
  { href: "/ai-product", label: "AI Product" },
  { href: "/remove-bg", label: "Remove BG" },
  { href: "/upscale", label: "Upscale" },
  { href: "/relight", label: "Relight" },
  { href: "/expand-image", label: "Expand Image" },
  { href: "/magic-eraser", label: "Magic Eraser" },
  { href: "/purchase", label: "Purchase (200 Points)" },
];

export function NavMenu() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link
            href="/"
            className="mr-6 flex items-center space-x-2 font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600"
          >
            ProdigyAI
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navLinks
              .filter((link) => !link.isHome)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "transition-colors hover:text-foreground/80",
                    pathname === link.href
                      ? "text-foreground font-semibold"
                      : "text-foreground/60",
                    link.href === "/purchase" &&
                      "text-purple-600 font-semibold",
                  )}
                >
                  {link.label}
                </Link>
              ))}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-between md:justify-end">
          <Link
            href="/app"
            className="md:hidden font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600"
          >
            ProdigyAI
          </Link>

          <div className="flex items-center">
            <ThemeToggle />

            {/* Mobile menu button */}
            <div className="md:hidden ml-2">
              <Button
                // variant="ghost"
                className="px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle menu</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="flex flex-col space-y-3 p-4 bg-background border-b">
            {navLinks
              .filter((link) => !link.isHome)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-foreground/70 transition-colors hover:text-foreground px-2 py-1.5 rounded-md",
                    pathname === link.href &&
                      "text-foreground font-medium bg-muted",
                    link.href === "/purchase" &&
                      "text-purple-600 font-semibold",
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
          </div>
        </div>
      )}
    </nav>
  );
}
