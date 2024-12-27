"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Omer-Serruya-322570243-Ron-Elmalech-322766809
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoose_1 = __importDefault(require("mongoose"));
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const post_route_1 = __importDefault(require("./routes/post_route"));
const health_route_1 = __importDefault(require("./routes/health_route"));
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
const db = mongoose_1.default.connection;
db.on('error', error => { console.log(error); });
db.on('connected', () => { console.log(`[ ${new Date().toISOString()} ] Connected Succefuly to MongoDB`); });
// Routes Use
app.use('/health', health_route_1.default);
app.use('/posts', post_route_1.default);
const initApp = () => {
    return new Promise((resolve, reject) => {
        if (!process.env.MONGODB_URL) {
            reject("DB_CONNECT is not defined in .env file");
        }
        else {
            mongoose_1.default
                .connect(process.env.MONGODB_URL)
                .then(() => {
                resolve(app);
            })
                .catch((error) => {
                reject(error);
            });
        }
    });
};
exports.default = initApp;
//# sourceMappingURL=server.js.map