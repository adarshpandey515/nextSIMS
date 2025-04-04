import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 justify-between">
      
     
      <div className="flex items-center gap-2">
        <Building2 className="h-6 w-6 text-primary hidden md:block" />
        <span className="text-lg font-semibold hidden md:block">SS DICE Works</span>
      <div className="ml-auto flex items-center gap-2">
        

        <Button
          variant="default"
          size="sm"
          className="bg-blue-500 hover:bg-blue-600 text-white"
          onClick={() => window.open('https://script.google.com/macros/s/AKfycbwhjXYMTfkBMHweqqSLf6uvJOwDkaw40qKmVCxDBpaOPPrvCfFDq2er1_8xr2p1gWvw/exec', '_blank')}
        >
          Invoice Manager
        </Button>

        <Button
          variant="default"
          size="sm"
          className="bg-green-500 hover:bg-green-600 text-white"
          onClick={() => window.open('https://script.google.com/macros/s/AKfycbwk6kBiD6yYFxLqEJvQR8U0Tw5_mJn3wUXxSGXm_KdxSb7z5THv4pfgbExfGDgvjVGSLg/exec', '_blank')}
        >
          Stock Tracker
        </Button>

        <Button
          variant="default"
          size="sm"
          className="bg-purple-500 hover:bg-purple-600 text-white"
          onClick={() => window.open('https://docs.google.com/spreadsheets/d/18EREzxLXCaEfEe9RUzw1EW0ijfC4oWr4ypzrhYYXCX8/edit?gid=89594319#gid=89594319', '_blank')}
        >
          AI Business Bot
        </Button>
      </div>
      </div>
      <ModeToggle />

    </header>
  );
}
