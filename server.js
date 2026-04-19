import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { ServerApplication } from './src/server/serverApplication.js';
import { loadResourcesDev } from './engine/resources/assetLoader.js';

const server = createServer();
const io = new Server(server, {
    cors: {
        origin: [
            "http://127.0.0.1:5500",
            "https://neynn.github.io"
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});

const serverApplication = new ServerApplication(io);
const pathHandler = serverApplication.pathHandler;

pathHandler.setRoot(import.meta.url);

loadResourcesDev(pathHandler, pathHandler.getPath(["assets"], "assets.json"))
.then(resources => {
    serverApplication.init(resources);
    server.listen(3000, "0.0.0.0", () => console.log("Server started!")); 
});

