import {
  ResponseLength,
  LanguageSelector,
  AutoScrollToggle,
} from "./components";
import { PageLayout } from "@/layouts";

const Responses = () => {
  return (
    <PageLayout
      title="Response Settings"
      description="Customize how AI generates and displays responses"
    >
      <ResponseLength />
      <LanguageSelector />
      <AutoScrollToggle />
    </PageLayout>
  );
};

export default Responses;
