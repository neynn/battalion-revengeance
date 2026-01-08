import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { ServerApplication } from './src/server/serverApplication.js';
import { AssetLoader } from './engine/resources/assetLoader.js';

const server = createServer();
const io = new Server(server, {
    cors: {
        origin: "http://127.0.0.1:5500",
        methods: ["GET", "POST"],
        credentials: true
    }
});

const serverApplication = new ServerApplication(io);
const pathHandler = serverApplication.pathHandler;

pathHandler.setRoot(import.meta.url);

const assetLoader = new AssetLoader();
const resources = await assetLoader.loadResourcesDev(pathHandler, pathHandler.getPath(["assets"], "assets.json"));

serverApplication.init(resources);

for(let i = 0; i < 10000; i++) {
    serverApplication.tCreateRoom();
}

server.listen(3000, () => {
    console.log('server running at http://localhost:3000');
}); 