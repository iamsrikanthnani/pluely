import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Header,
  Empty,
  GetLicense,
} from "@/components";
import {
  CheckCircle2,
  Sparkles,
  BotIcon,
  LockIcon,
  ClockIcon,
} from "lucide-react";
import { useApp } from "@/contexts";
import { safeLocalStorage } from "@/lib";
import { STORAGE_KEYS } from "@/config";
import moment from "moment";

interface PluelyPrompt {
  title: string;
  prompt: string;
  modelId: string;
  modelName: string;
}

interface PluelyPromptsResponse {
  prompts: PluelyPrompt[];
  total: number;
  last_updated?: string;
}

interface Model {
  provider: string;
  name: string;
  id: string;
  model: string;
  description: string;
  modality: string;
  isAvailable: boolean;
}

const SELECTED_PLUELY_MODEL_STORAGE_KEY = "selected_pluely_model";
const SELECTED_PLUELY_PROMPT_STORAGE_KEY = "selected_pluely_prompt";

const FALLBACK_PROMPTS: PluelyPrompt[] = [
  {
    title: "Live Coding Tutor",
    prompt: "You are a live coding tutor. Guide the user through coding problems step by step. Explain concepts clearly, suggest best practices, and help debug issues in real time. Adapt your explanations to the user's skill level. Use code examples and encourage the user to think through problems before giving solutions.",
    modelId: "",
    modelName: "Any Model",
  },
  {
    title: "Screenshot Bug Reporter",
    prompt: "You are a bug reporting assistant. When the user shares a screenshot or describes a visual issue, help them write a clear, actionable bug report. Include steps to reproduce, expected vs actual behavior, environment details, and severity assessment. Format the report in a standard template that developers can immediately act on.",
    modelId: "",
    modelName: "Any Model",
  },
  {
    title: "Accessibility Checker (Visual)",
    prompt: "You are an accessibility expert. Analyze screenshots, UI descriptions, and code for accessibility issues based on WCAG 2.1 guidelines. Check for color contrast, keyboard navigation, screen reader compatibility, alt text, ARIA labels, and focus indicators. Provide specific, actionable fixes with code examples.",
    modelId: "",
    modelName: "Any Model",
  },
  {
    title: "Data Visualization Explainer",
    prompt: "You are a data visualization expert. Help users understand, create, and improve charts, graphs, and dashboards. Explain what visualizations best suit different data types, interpret existing visualizations, suggest improvements for clarity, and provide code snippets for popular charting libraries like D3.js, Chart.js, or Matplotlib.",
    modelId: "",
    modelName: "Any Model",
  },
  {
    title: "Interview Prep (Behavioral)",
    prompt: "You are a behavioral interview coach. Help the user prepare for behavioral interviews using the STAR method (Situation, Task, Action, Result). Ask probing follow-up questions, suggest stronger answers, and help craft compelling stories from the user's experience. Cover common behavioral questions for tech, leadership, and teamwork scenarios.",
    modelId: "",
    modelName: "Any Model",
  },
  {
    title: "Real-Time Research Assistant",
    prompt: "You are a real-time research assistant. Help the user quickly find, summarize, and synthesize information on any topic. Provide concise summaries, key takeaways, and relevant context. Cite sources when possible, flag uncertain information, and suggest follow-up questions to deepen understanding.",
    modelId: "",
    modelName: "Any Model",
  },
  {
    title: "Technical Documentation Search",
    prompt: "You are a technical documentation expert. Help users find and understand API docs, library references, framework guides, and technical specifications. Provide clear explanations of parameters, return types, usage patterns, and common pitfalls. Include working code examples tailored to the user's specific use case.",
    modelId: "",
    modelName: "Any Model",
  },
  {
    title: "Quick Coding Questions",
    prompt: "You are a fast coding Q&A assistant. Answer coding questions concisely and directly. Provide short, working code snippets with brief explanations. Focus on practical solutions rather than lengthy theory. Support all major programming languages and frameworks. If the question is ambiguous, ask one clarifying question before answering.",
    modelId: "",
    modelName: "Any Model",
  },
  {
    title: "Algorithm Hints (Fast)",
    prompt: "You are an algorithm hints assistant. When the user describes a problem, provide progressive hints rather than full solutions. Start with the approach category (greedy, DP, graph, etc.), then suggest the data structure, then outline the key insight, and only give the full solution if explicitly asked. Help users build problem-solving intuition.",
    modelId: "",
    modelName: "Any Model",
  },
  {
    title: "Syntax & Error Quick Fix",
    prompt: "You are a syntax and error fix specialist. When the user shares error messages or broken code, quickly identify the issue and provide the fix. Explain what went wrong in one sentence, show the corrected code, and suggest how to prevent the error in the future. Support all major languages and frameworks.",
    modelId: "",
    modelName: "Any Model",
  },
  {
    title: "Code Diagram Generator",
    prompt: "You are a code diagram generator. Help users visualize code architecture, data flows, class hierarchies, and system designs using Mermaid diagrams. Convert code descriptions into clear flowcharts, sequence diagrams, class diagrams, and entity-relationship diagrams. Always output valid Mermaid syntax in code blocks.",
    modelId: "",
    modelName: "Any Model",
  },
  {
    title: "Multi-Language Translator",
    prompt: "You are a professional translator. Translate text between any languages while preserving tone, context, and cultural nuances. For technical content, maintain accuracy of terminology. For casual content, adapt idioms naturally. Always specify the source and target languages, and flag any ambiguities in the translation.",
    modelId: "",
    modelName: "Any Model",
  },
  {
    title: "Live Sales Demo Assistant",
    prompt: "You are a live sales demo assistant. Help the user prepare and deliver product demos by suggesting talking points, anticipating objections, and providing real-time coaching. Focus on highlighting value propositions, addressing customer pain points, and guiding conversations toward closing. Adapt communication style to the audience.",
    modelId: "",
    modelName: "Any Model",
  },
  {
    title: "Document & Slide Analyzer",
    prompt: "You are a document and slide analyzer. When the user shares documents, presentations, or screenshots of slides, provide detailed analysis including key points extraction, structure assessment, content suggestions, and improvement recommendations. Help summarize lengthy documents and identify missing information.",
    modelId: "",
    modelName: "Any Model",
  },
  {
    title: "Math Problem Solver (Visual)",
    prompt: "You are a math problem solver. Help users solve mathematical problems step by step, from basic arithmetic to advanced calculus. Show all work clearly using mathematical notation ($$). When the user shares screenshots of math problems, read and solve them. Explain each step and the reasoning behind it.",
    modelId: "",
    modelName: "Any Model",
  },
  {
    title: "Live Presentation Helper",
    prompt: "You are a live presentation coach. Help users during presentations by suggesting responses to audience questions, providing real-time talking points, and offering delivery tips. Help structure presentations, create engaging openings and closings, and maintain audience engagement. Provide quick bullet points that are easy to glance at.",
    modelId: "",
    modelName: "Any Model",
  },
  {
    title: "Meeting Notes from Audio & Screen",
    prompt: "You are a meeting notes assistant. Listen to meeting audio transcriptions and screen content to generate comprehensive meeting notes. Capture key decisions, action items, deadlines, and participant contributions. Organize notes with clear headings, bullet points, and highlight follow-up tasks with owners and due dates.",
    modelId: "",
    modelName: "Any Model",
  },
  {
    title: "Live Coding Interview Assistant",
    prompt: "You are a live coding interview assistant. Help users during coding interviews by providing hints, explaining problem patterns, and suggesting optimal approaches. Guide through problem decomposition, time/space complexity analysis, and edge case identification. Provide progressive hints rather than direct answers to help users demonstrate their thinking.",
    modelId: "",
    modelName: "Any Model",
  },
];

export const PluelyPrompts = () => {
  const {
    setSystemPrompt,
    hasActiveLicense,
    setSupportsImages,
    pluelyApiEnabled,
  } = useApp();
  const [prompts, setPrompts] = useState<PluelyPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [selectedPluelyPrompt, setSelectedPluelyPrompt] =
    useState<PluelyPrompt | null>(() => {
      // Load selected prompt from local storage on initial render
      const stored = safeLocalStorage.getItem(
        SELECTED_PLUELY_PROMPT_STORAGE_KEY
      );
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
      return null;
    });
  const [models, setModels] = useState<Model[]>([]);
  const fetchInitiated = useRef(false);

  useEffect(() => {
    if (!fetchInitiated.current) {
      fetchInitiated.current = true;
      fetchPluelyPrompts();
      fetchModels();
    }
  }, []);

  // Watch for changes in user's selected prompt and clear Pluely selection if needed
  useEffect(() => {
    const checkUserPromptSelection = () => {
      const userSelectedPromptId = safeLocalStorage.getItem(
        STORAGE_KEYS.SELECTED_SYSTEM_PROMPT_ID
      );
      // If user has selected one of their own prompts, clear Pluely prompt selection
      if (userSelectedPromptId) {
        setSelectedPluelyPrompt(null);
      }
    };

    // Check on mount
    checkUserPromptSelection();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.SELECTED_SYSTEM_PROMPT_ID) {
        checkUserPromptSelection();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const fetchPluelyPrompts = async () => {
    setIsLoading(true);
    try {
      const response = await invoke<PluelyPromptsResponse>("fetch_prompts");
      setPrompts(response.prompts);
      if (response.last_updated) {
        setLastUpdated(response.last_updated);
      }
    } catch {
      setPrompts(FALLBACK_PROMPTS);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchModels = async () => {
    try {
      const fetchedModels = await invoke<Model[]>("fetch_models");
      setModels(fetchedModels);
    } catch (error) {
      console.error("Failed to fetch models:", error);
    }
  };

  const handleSelectPluelyPrompt = async (prompt: PluelyPrompt) => {
    // Check if user has active license
    if (!hasActiveLicense) {
      return;
    }

    try {
      // Set the system prompt
      setSystemPrompt(prompt.prompt);
      setSelectedPluelyPrompt(prompt);

      // Clear the user's selected prompt ID from local storage
      // This ensures the user prompt cards don't show as selected
      safeLocalStorage.removeItem(STORAGE_KEYS.SELECTED_SYSTEM_PROMPT_ID);

      // Save the system prompt to local storage
      safeLocalStorage.setItem(STORAGE_KEYS.SYSTEM_PROMPT, prompt.prompt);

      // Save the selected Pluely prompt to local storage for persistence
      safeLocalStorage.setItem(
        SELECTED_PLUELY_PROMPT_STORAGE_KEY,
        JSON.stringify(prompt)
      );

      // Find the model by modelId and select it (skip if no models loaded)
      if (models.length > 0 && prompt.modelId) {
        const matchingModel = models.find(
          (model) => model.model === prompt.modelId || model.id === prompt.modelId
        );

        if (matchingModel) {
          if (pluelyApiEnabled) {
            const hasImageSupport =
              matchingModel.modality?.includes("image") ?? false;
            setSupportsImages(hasImageSupport);
          }

          await invoke("secure_storage_save", {
            items: [
              {
                key: SELECTED_PLUELY_MODEL_STORAGE_KEY,
                value: JSON.stringify(matchingModel),
              },
            ],
          });
        }
      }
    } catch (error) {
      console.error("Failed to select Pluely prompt:", error);
    }
  };

  const handleCardClick = (prompt: PluelyPrompt) => {
    handleSelectPluelyPrompt(prompt);
  };

  const isPromptSelected = (prompt: PluelyPrompt) => {
    return (
      selectedPluelyPrompt?.title === prompt.title &&
      selectedPluelyPrompt?.modelId === prompt.modelId
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 mt-6">
        <Header
          title="Pluely Default Prompts"
          description="Pre-configured prompts with optimal model selection"
        />
        <Empty
          isLoading={true}
          icon={Sparkles}
          title="Loading prompts..."
          description="Fetching Pluely default prompts"
        />
      </div>
    );
  }

  if (prompts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mt-6">
      <div className="flex items-start justify-between gap-3 border-t border-input/50 pt-6">
        <div className="flex items-start gap-3 w-full">
          <div className="flex flex-col gap-1 w-full">
            <Header
              title="Pluely Default Prompts"
              description="Pre-configured prompts with optimal model pairings. Selecting a prompt will automatically set the recommended AI model for best results."
            />
            {lastUpdated && (
              <div className="flex justify-end items-center gap-1 text-[10px] text-muted-foreground">
                <ClockIcon className="size-2" />
                <span>Last updated: {moment(lastUpdated).fromNow()}</span>
              </div>
            )}
          </div>
        </div>
        {!hasActiveLicense && (
          <GetLicense buttonText="Unlock" buttonClassName="shrink-0" />
        )}
      </div>

      <div
        className={`grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 pb-4 ${
          !hasActiveLicense ? "opacity-60" : ""
        }`}
      >
        {prompts.map((prompt, index) => {
          const isSelected = isPromptSelected(prompt);
          return (
            <Card
              key={`${prompt.title}-${index}`}
              className={`relative border lg:border-2 shadow-none p-4 pb-10 gap-0 group transition-all hover:shadow-sm ${
                hasActiveLicense ? "cursor-pointer" : "cursor-not-allowed"
              } ${
                isSelected
                  ? "!bg-primary/5 dark:!bg-primary/10 border-primary"
                  : "!bg-black/5 dark:!bg-white/5 border-transparent"
              }`}
              onClick={() => handleCardClick(prompt)}
            >
              {isSelected && (
                <CheckCircle2 className="size-5 text-green-500 flex-shrink-0 absolute top-2 right-2" />
              )}
              {!hasActiveLicense && (
                <LockIcon className="size-4 text-muted-foreground flex-shrink-0 absolute top-2 right-2" />
              )}
              <CardHeader className="p-0 pb-0 select-none">
                <div className="flex items-start justify-between gap-2 relative">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-[10px] text-base line-clamp-1 flex-1 pr-3">
                        {prompt.title}
                      </CardTitle>
                    </div>
                    <CardDescription className="h-14 line-clamp-3 text-xs leading-relaxed">
                      {prompt.prompt}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <div className="absolute bottom-2 left-4 w-full flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] lg:text-xs text-muted-foreground select-none">
                  <BotIcon className="size-3" />
                  <span className="line-clamp-1 max-w-[180px]">
                    {prompt.modelName}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
