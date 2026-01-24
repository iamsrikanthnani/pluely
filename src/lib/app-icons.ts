import SparklesIcon, {
  __iconNode as sparklesNode,
} from "lucide-react/dist/esm/icons/sparkles.js";
import BotIcon, { __iconNode as botNode } from "lucide-react/dist/esm/icons/bot.js";
import RocketIcon, {
  __iconNode as rocketNode,
} from "lucide-react/dist/esm/icons/rocket.js";
import MessageCircleIcon, {
  __iconNode as messageCircleNode,
} from "lucide-react/dist/esm/icons/message-circle.js";

export const APP_ICON_OPTIONS = [
  {
    id: "sparkles",
    label: "Sparkles",
    description: "Classic Pluely glow",
    icon: SparklesIcon,
    node: sparklesNode,
  },
  {
    id: "bot",
    label: "Bot",
    description: "AI-first vibe",
    icon: BotIcon,
    node: botNode,
  },
  {
    id: "rocket",
    label: "Rocket",
    description: "Fast and bold",
    icon: RocketIcon,
    node: rocketNode,
  },
  {
    id: "chat",
    label: "Chat",
    description: "Conversation focus",
    icon: MessageCircleIcon,
    node: messageCircleNode,
  },
] as const;

export type AppIconId = (typeof APP_ICON_OPTIONS)[number]["id"];

export const DEFAULT_APP_ICON_ID: AppIconId = "sparkles";

export const getAppIconOption = (id?: AppIconId) =>
  APP_ICON_OPTIONS.find((option) => option.id === id) ?? APP_ICON_OPTIONS[0];

export const DEFAULT_APP_ICON_RENDER = {
  size: 256,
  padding: 48,
  background: "#0f172a",
  color: "#f8fafc",
  strokeWidth: 2.2,
};

export type AppIconRenderOptions = Partial<typeof DEFAULT_APP_ICON_RENDER>;

const buildSvgString = (
  node: ReadonlyArray<readonly [string, Record<string, string>]>,
  {
    size,
    color,
    strokeWidth,
  }: {
    size: number;
    color: string;
    strokeWidth: number;
  }
) => {
  const svgAttrs = [
    `xmlns="http://www.w3.org/2000/svg"`,
    `width="${size}"`,
    `height="${size}"`,
    `viewBox="0 0 24 24"`,
    `fill="none"`,
    `stroke="${color}"`,
    `stroke-width="${strokeWidth}"`,
    `stroke-linecap="round"`,
    `stroke-linejoin="round"`,
  ].join(" ");

  const body = node
    .map(([tag, attrs]) => {
      const attrString = Object.entries(attrs)
        .filter(([key]) => key !== "key")
        .map(([key, value]) => {
          const normalized =
            value === "currentColor" ? color : String(value);
          return `${key}="${normalized}"`;
        })
        .join(" ");
      return `<${tag} ${attrString} />`;
    })
    .join("");

  return `<svg ${svgAttrs}>${body}</svg>`;
};

export const renderAppIconPngBase64 = async (
  id: AppIconId,
  overrides: AppIconRenderOptions = {}
) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("App icon rendering requires a browser environment.");
  }

  const option = getAppIconOption(id);
  const { size, padding, background, color, strokeWidth } = {
    ...DEFAULT_APP_ICON_RENDER,
    ...overrides,
  };

  const iconSize = Math.max(size - padding * 2, 64);
  const svgMarkup = buildSvgString(option.node, {
    size: iconSize,
    color,
    strokeWidth,
  });

  const svgBase64 = window.btoa(unescape(encodeURIComponent(svgMarkup)));
  const img = new Image();

  const loadPromise = new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load SVG icon."));
  });

  img.src = `data:image/svg+xml;base64,${svgBase64}`;
  await loadPromise;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas rendering is unavailable.");
  }

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(img, padding, padding, size - padding * 2, size - padding * 2);

  const dataUrl = canvas.toDataURL("image/png");
  const [, base64] = dataUrl.split(",");

  if (!base64) {
    throw new Error("Failed to encode PNG icon.");
  }

  return base64;
};
