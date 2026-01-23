import {
  Settings,
  Code,
  MessagesSquare,
  WandSparkles,
  AudioLinesIcon,
  SquareSlashIcon,
  MonitorIcon,
  HomeIcon,
  PowerIcon,
  MessageSquareTextIcon,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

export const useMenuItems = () => {
  const menu: {
    icon: React.ElementType;
    label: string;
    href: string;
    count?: number;
  }[] = [
    { icon: HomeIcon, label: "Dashboard", href: "/dashboard" },
    { icon: MessagesSquare, label: "Chats", href: "/chats" },
    { icon: WandSparkles, label: "System prompts", href: "/system-prompts" },
    { icon: Settings, label: "App Settings", href: "/settings" },
    { icon: MessageSquareTextIcon, label: "Responses", href: "/responses" },
    { icon: MonitorIcon, label: "Screenshot", href: "/screenshot" },
    { icon: AudioLinesIcon, label: "Audio", href: "/audio" },
    { icon: SquareSlashIcon, label: "Cursor & Shortcuts", href: "/shortcuts" },
    { icon: Code, label: "Dev space", href: "/dev-space" },
  ];

  const footerItems = [
    {
      icon: PowerIcon,
      label: "Quit Nluely",
      action: async () => {
        await invoke("exit_app");
      },
    },
  ];

  const footerLinks: {
    title: string;
    icon: React.ElementType;
    link: string;
  }[] = [];

  return { menu, footerItems, footerLinks };
};
