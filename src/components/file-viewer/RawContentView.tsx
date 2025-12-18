import { ScrollArea } from "../ui/scroll-area";

interface RawContentViewProps {
  content: string;
}

export default function RawContentView({ content }: RawContentViewProps) {
  return (
    <ScrollArea className="h-[calc(80vh-120px)]">
      <pre className="whitespace-pre-wrap break-words p-6 font-mono text-sm leading-relaxed text-foreground">
        {content}
      </pre>
    </ScrollArea>
  );
}
