import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface MarkdownMessageProps {
  content: string;
  reasoning?: string;
}

export function MarkdownMessage({ content, reasoning }: MarkdownMessageProps) {
  
  return (
    <div data-tauri-drag-region>
      {
        reasoning &&
        <div className="border-l-2 px-2 border-primary/60">
        <p className="text-foreground/55 mb-2 text-wrap">
            {reasoning}
        </p>
      </div>
      }
    <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
       components={{
        p: ({ children }) => <p className="mb-2 text-wrap">{children}</p>,
        code: ({ node, className,  children, ...props }) => {
          const match = /language-(\w+)/.exec(className || "");
          return match ? (
            // @ts-ignore
            <SyntaxHighlighter 
              style={materialDark as any}
              language={match[1]}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  )
}

