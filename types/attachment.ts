export type TAttachment = {
  id: string;
  metadata?: {
    name: string;
    type: string;
    size: number;
    lastModified: number;
  };
  type: "text" | "file" | "image";
  text?: string;
  base64: string;
};
