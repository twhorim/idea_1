import express from "express";
import path from "path";
import dotenv from "dotenv";
import analyzeHandler from "./api/analyze";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API endpoint mapped to the shared serverless handler
app.post("/api/analyze", analyzeHandler);

// Vite middleware integration for production vs development build flow
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
