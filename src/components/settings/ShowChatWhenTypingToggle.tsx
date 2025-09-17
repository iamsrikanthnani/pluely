import { Switch, Label, Header } from "@/components";
import { useApp } from "@/contexts";

interface ShowChatWhenTypingToggleProps {
  className?: string;
}

export const ShowChatWhenTypingToggle = ({
  className,
}: ShowChatWhenTypingToggleProps) => {
  const { customizable, toggleShowChatWhenTyping } = useApp();

  return (
    <div className={className}>
      <Header
        title="Show Chat When Typing"
        description="Display the chat history while you are typing."
      />
      <Switch
        id="show-chat-when-typing-toggle"
        checked={customizable.showChatWhenTyping.isEnabled}
        onCheckedChange={toggleShowChatWhenTyping}
      />
    </div>
  );
};