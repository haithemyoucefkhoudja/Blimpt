import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { CopyCode } from "@/components/Copy";
import { useMemo } from "react";
// import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";
interface MarkdownMessageProps {
  content: string;
  reasoning?: string;
}
import SyntaxHighlighter from "react-syntax-highlighter";
export function MarkdownMessage({ content, reasoning }: MarkdownMessageProps) {
  const remarkPlugins = useMemo(() => [remarkGfm], []);
  const rehypePlugins = useMemo(() => [rehypeRaw], []);
  // const materialDarkStyle = useMemo(() => materialDark, []);
  // const MemoizedSyntaxHighlighter = useMemo(() => SyntaxHighlighter, []);
  const components = useMemo(() => {
    return {
      p: ({ children }: any) => (
        <p className="mb-2 text-wrap break-words">{children}</p>
      ),
      code: ({ node, className, children, ...props }: any) => {
        const match = /language-(\w+)/.exec(className || "");
        const codeString = String(children).replace(/\n$/, "");

        return (
          <div>
            <code
              // @ts-ignore
              // style={materialDarkStyle}
              className="dark:bg-gray-800 bg-gray-200 p-2 rounded flex max-h-[500px] overflow-y-scroll max-w-full w-full h-full"
              language={match ? match[1] : "text"}
              PreTag="div"
              {...props}
            >
              {codeString}
            </code>

            <CopyCode code={codeString} />
          </div>
        );
      },
    };
  }, [remarkPlugins, rehypePlugins]);
  return (
    <div data-tauri-drag-region className="w-full px-2">
      {reasoning && (
        <div className="border-l-2 px-2 border-primary/60 w-full">
          <p className="text-foreground/55 mb-2 text-wrap">{reasoning}</p>
        </div>
      )}
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
