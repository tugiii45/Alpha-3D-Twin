import path from "path";
import dotenv from "dotenv";
import { loadConfig } from "../../config/env";
import { createApp } from "./app";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// `npm start` and the container run the compiled file. Dev uses tsx on this source.
if (__filename.includes(`${path.sep}dist${path.sep}`)) {
  process.env.NODE_ENV = "production";
}

const config = loadConfig();
const app = createApp(config);

app.listen(config.port, "0.0.0.0", () => {
  console.log(`listening on http://0.0.0.0:${config.port}`);
});
