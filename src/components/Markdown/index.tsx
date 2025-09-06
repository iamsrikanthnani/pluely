import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from 'rehype-raw'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

export const Markdown = ({ children }: { children: string }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[ rehypeRaw, rehypeKatex ]}
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
