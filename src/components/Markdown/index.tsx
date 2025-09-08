import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const Markdown = ({ children }: { children: string }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        pre: ({ node, ...props }) => (
          <pre {...props} className="whitespace-pre-wrap break-words" />
        ),
        code: ({ node, ...props }) => (
          <code {...props} className="whitespace-pre-wrap break-words" />
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
};
