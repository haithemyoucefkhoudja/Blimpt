"use client"

import { RefreshCcw, ChevronDown, User2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

interface ChatHistory {
  id: string
  title: string
  timestamp: Date
}

export function AppSidebar() {
  const today: ChatHistory[] = [
    {
      id: '1',
      title: 'Understanding Inertia in Factor Ana',
      timestamp: new Date()
    }
  ]

  const lastWeek: ChatHistory[] = [
    {
      id: '2',
      title: "Explanation of Kruskal's Algorithm F",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      id: '3',
      title: 'Calculating Conditional Probability i',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    }
  ]

  return (
    <Sidebar >
      <SidebarHeader className="bg-[#1A1A1A]">
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2" 
          size="sm"
        >
          <RefreshCcw className="h-4 w-4" />
          New chat
        </Button>
      </SidebarHeader>

      <SidebarContent className="bg-[#1A1A1A]">
        <SidebarGroup>
          <SidebarGroupLabel>Today</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {today.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton>
                    {chat.title}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>7 Days</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {lastWeek.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton>
                    {chat.title}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-[#1A1A1A]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center text-white">
                  H
                </div>
                My Profile
                <ChevronDown className="ml-auto h-4 w-4" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem>
              <User2 className="mr-2 h-4 w-4" />
              <span>Account</span>
            </DropdownMenuItem>
            {/* Add more menu items as needed */}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

