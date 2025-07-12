import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import ScreenshotWindow from "./ScreenshotWindow";
// import SecondWindow from "./SecondWindow";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/screenshot" element={<ScreenshotWindow />} />
        {/* <Route path="/second" element={<SecondWindow />} />
        <Route path="/commands" element={<SecondWindow />} /> */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
