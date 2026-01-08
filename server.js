import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { ServerApplication } from './src/server/serverApplication.js';
import { ServerAssetLoader } from './engine/resources/server/serverAssetLoader.js';

const server = createServer();
const io = new Server(server, {
    cors: {
        origin: "http://127.0.0.1:5500",
        methods: ["GET", "POST"],
        credentials: true
    }
});

const serverApplication = new ServerApplication(io);

serverApplication.pathHandler.setRoot(import.meta.url);

const assetLoader = new ServerAssetLoader();
const resources = await assetLoader.loadResources(serverApplication.pathHandler);

serverApplication.init(resources);

server.listen(3000, () => {
    console.log('server running at http://localhost:3000');
}); 