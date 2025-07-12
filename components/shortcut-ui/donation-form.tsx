"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";

export default function DonationForm() {
  const donorWallRef = useRef<HTMLDivElement>(null);

  const scrollToDonorWall = () => {
    donorWallRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  useEffect(() => {
    // Load the Donorbox widget script
    const script = document.createElement("script");
    script.src = "https://donorbox.org/widget.js";
    script.setAttribute("paypalExpress", "true");
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector(
        'script[src="https://donorbox.org/widget.js"]'
      );
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  // Dark mode URL parameters for Donorbox
  const darkModeParams = new URLSearchParams({
    background_color: "0a0a0a", // Dark background
    text_color: "ffffff", // White text
    color: "00e2a2", // Accent color (green)
    button_color: "00e2a2", // Button color
    button_text_color: "000000", // Button text (black on green)
  }).toString();

  const donorWallParams = new URLSearchParams({
    donor_wall_color: "00e2a2", // Keep the green accent
    only_donor_wall: "true",
    preview: "true",
    background_color: "0a0a0a", // Dark background for donor wall
    text_color: "ffffff", // White text for donor wall
  }).toString();

  return (
    <div
      data-tauri-drag-region
      className="w-full h-96 px-2 bg-background relative"
    >
      <ScrollArea className="h-full w-full">
        <div className="space-y-4 pr-4">
          {/* Donation Form */}
          <Button asChild>
            <a href="https://donorbox.org/donate-blimpt" target="_blank">
              Open Donation Page
            </a>
          </Button>
          <div className="w-full">
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              Make a Donation
            </h3>
            <iframe
              src={`https://donorbox.org/embed/donate-blimpt?${darkModeParams}`}
              name="donorbox-form"
              frameBorder="0"
              scrolling="no"
              height="900"
              width="100%"
              style={{
                maxWidth: "500px",
                minWidth: "250px",
                border: "none",
                borderRadius: "8px",
                overflow: "hidden",
              }}
              allow="payment"
              title="Donation Form"
              {...({ allowPaymentRequest: "allowpaymentrequest" } as any)}
            />
          </div>

          <Separator className="my-4" />

          {/* Donor Wall */}
          <div ref={donorWallRef} className="w-full bg-white">
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              Recent Donors
            </h3>
            <iframe
              src={`https://donorbox.org/embed/donate-blimpt?${donorWallParams}`}
              name="donorbox-wall"
              frameBorder="0"
              scrolling="no"
              height="345"
              width="100%"
              style={{
                maxWidth: "500px",
                minWidth: "310px",
                minHeight: "345px",
                border: "none",
                borderRadius: "8px",
                overflow: "hidden",
              }}
              title="Donor Wall"
            />
          </div>
        </div>
      </ScrollArea>

      {/* Scroll to Donor Wall Button */}
      <Button
        onClick={scrollToDonorWall}
        size="sm"
        className="absolute bottom-4 right-4 rounded-full shadow-lg hover:shadow-xl transition-shadow z-10"
        title="Scroll to Donor Wall"
      >
        <ArrowDown className="h-4 w-4 mr-1" />
        Donors
      </Button>
    </div>
  );
}
