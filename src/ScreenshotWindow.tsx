import { ThemeProvider } from "@/providers/theme-provider";
import Screenshot from "@/components/screenshot";

const ScreenshotWindow: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Screenshot />
    </ThemeProvider>
  );
};

export default ScreenshotWindow;
