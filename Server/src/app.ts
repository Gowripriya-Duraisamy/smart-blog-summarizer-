import express, { Application } from "express";
import routes from "./routes";
import cors from "cors";
import chatRoutes from "./routes/chat.routes";
import documentRoutes from "./routes/document.routes";

const app: Application = express();

app.use(
  cors({
    origin: "*", // your React app URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

// Middleware
app.use(express.json());

app.use((req, res, next) => {
  console.log("👉 Incoming:", req.method, req.url);
  next();
});

// Routes
app.use("/api", routes);
app.use("/api/chat", chatRoutes);
app.use("/api/documents", documentRoutes);

export default app;
