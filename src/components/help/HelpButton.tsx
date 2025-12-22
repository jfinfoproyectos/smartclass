"use client"

import { HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import Link from "next/link"

export function HelpButton() {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        asChild
                    >
                        <Link href="/dashboard/help">
                            <HelpCircle className="h-[1.2rem] w-[1.2rem]" />
                            <span className="sr-only">Ayuda</span>
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Ayuda</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
