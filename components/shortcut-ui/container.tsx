import type React from "react";
import { useCallback } from "react";
import {
  AppResizeProvider,
  useAppResize,
  useSizeChange,
} from "./hooks/use-app-resize";

function AppContainerInner({ children }: { children: React.ReactNode }) {
  const { webviewRef } = useAppResize();

  const handleResize = useCallback(() => {}, []);

  useSizeChange(handleResize, []);

  return (
    <div
      className="flex flex-col h-full bg-transparent w-full space-y-2 justify-center items-center"
      ref={webviewRef}
    >
      {children}
    </div>
  );
}

function AppContainer({ children }: { children: React.ReactNode }) {
  return (
    <AppResizeProvider>
      <AppContainerInner>{children}</AppContainerInner>
    </AppResizeProvider>
  );
}

export default AppContainer;
