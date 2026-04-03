"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enqueueVideoModeration = enqueueVideoModeration;
const video_moderation_queue_1 = require("./video-moderation-queue");
async function enqueueVideoModeration(input) {
    await video_moderation_queue_1.videoModerationQueue.add("process-video", input);
}
