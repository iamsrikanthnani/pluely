import { AIProviders, STTProviders } from "./components";
import { useSettings } from "@/hooks";
import { PageLayout } from "@/layouts";

const DevSpace = () => {
  const settings = useSettings();

  return (
    <PageLayout title="Dev Space" description="Manage your provider templates">
      <AIProviders {...settings} />
      <STTProviders {...settings} />
    </PageLayout>
  );
};

export default DevSpace;
