export type TAttachment = {
  id: string;
  file?: File;
  type: "text" | "file" | "image";
  text?: string;
  previewUrl?: string;
  base64?: string;
};
