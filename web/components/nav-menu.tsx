"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
// Import the ThemeToggle component at the top of the file
import { ThemeToggle } from "@/components/theme-toggle";

// Import additional icons and components at the top
import { User, Settings, LogOut, CreditCard, History } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

const navLinks = [
  { href: "/", label: "TryOnMagic", isHome: true },
  { href: "/ai-model", label: "AI Model" },
  { href: "/ai-product", label: "AI Product" },
  { href: "/virtual-try-on", label: "Virtual Try-On" },
  { href: "/remove-bg", label: "Remove BG" },
  { href: "/upscale", label: "Upscale" },
  // { href: "/relight", label: "Relight" },
  { href: "/expand-image", label: "Expand Image" },
  { href: "/magic-eraser", label: "Magic Eraser" },
  { href: "/purchase", label: "Purchase" },
];

export function NavMenu() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  // const app = useAppBridge();
  // console.log("App", app.origin);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link
            href="/"
            className="mr-6 flex items-center space-x-2 font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600"
          >
            TryOnMagic
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navLinks
              .filter((link) => !link.isHome)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => {
                    window.location.href = link.href;
                  }}
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
            TryOnMagic
          </Link>

          <div className="flex items-center">
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg" alt="User" />
                    <AvatarFallback>US</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile?tab=usage" className="cursor-pointer">
                      <History className="mr-2 h-4 w-4" />
                      <span>Usage History</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/purchase" className="cursor-pointer">
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Buy Points</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile?tab=settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <div className="md:hidden ml-2">
              <Button
                variant="ghost"
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
