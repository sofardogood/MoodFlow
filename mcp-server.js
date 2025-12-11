#!/usr/bin/env node
require("dotenv").config();
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");

// Import database functions
const { getMoods, createMood, getAllMoods } = require("./lib/db");
const prisma = require("./lib/prisma");

// Create server instance
const server = new Server(
    {
        name: "moodflow-server",
        version: "1.0.0",
    },
    {
        capabilities: {
            resources: {},
            tools: {},
        },
    }
);

/**
 * TOOLS
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_latest_moods",
                description: "Get recent mood entries for a specific session ID.",
                inputSchema: {
                    type: "object",
                    properties: {
                        sessionId: { type: "string", description: "The Session ID to fetch moods for" }
                    },
                    required: ["sessionId"]
                },
            },
            {
                name: "get_session_stats",
                description: "Calculate statistics (average score, positive rate) for a session.",
                inputSchema: {
                    type: "object",
                    properties: {
                        sessionId: { type: "string", description: "The Session ID to analyze" }
                    },
                    required: ["sessionId"]
                },
            },
            {
                name: "submit_mood",
                description: "Submit a new mood entry to the database (simulating a participant).",
                inputSchema: {
                    type: "object",
                    properties: {
                        sessionId: { type: "string" },
                        nickname: { type: "string" },
                        moodScore: { type: "number", minimum: -5, maximum: 5 },
                        comment: { type: "string" },
                        emoticon: { type: "string" }
                    },
                    required: ["sessionId", "nickname", "moodScore"]
                },
            },
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (name === "get_latest_moods") {
            const sessionId = args.sessionId;
            const moods = await getMoods(sessionId);
            // Return top 20 to avoid token limit issues in LLMs
            return {
                content: [{ type: "text", text: JSON.stringify(moods.slice(0, 20), null, 2) }],
            };
        }

        if (name === "get_session_stats") {
            const sessionId = args.sessionId;
            const moods = await getMoods(sessionId);

            if (moods.length === 0) {
                return { content: [{ type: "text", text: "No data found for this session." }] };
            }

            const scores = moods.map(m => m.moodScore);
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            const participants = new Set(moods.map(m => m.nickname)).size;
            const positiveCount = scores.filter(s => s > 0).length;
            const positiveRate = (positiveCount / scores.length) * 100;

            const stats = {
                total_entries: moods.length,
                participants,
                average_score: avg.toFixed(2),
                positive_rate: positiveRate.toFixed(1) + "%",
            };

            return {
                content: [{ type: "text", text: JSON.stringify(stats, null, 2) }],
            };
        }

        if (name === "submit_mood") {
            const result = await createMood({
                sessionId: args.sessionId,
                nickname: args.nickname,
                moodScore: args.moodScore,
                comment: args.comment || "",
                emoticon: args.emoticon || "🤖"
            });
            return {
                content: [{ type: "text", text: `Mood submitted successfully at ${result.timestamp}` }],
            };
        }

        throw new Error(`Unknown tool: ${name}`);
    } catch (error) {
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
        };
    }
});

/**
 * RESOURCES
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    try {
        const sessions = await prisma.session.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' }
        });

        return {
            resources: sessions.map(s => ({
                uri: `moodflow://sessions/${s.id}/data`,
                name: `Session Data: ${s.id}`,
                mimeType: "application/json",
                description: `All mood data for session ${s.id}`
            }))
        };
    } catch (e) {
        // Fallback if DB fails or no sessions
        return { resources: [] };
    }
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    const match = uri.match(/^moodflow:\/\/sessions\/([^\/]+)\/data$/);

    if (!match) {
        throw new Error(`Resource not found: ${uri}`);
    }

    const sessionId = match[1];
    const moods = await getMoods(sessionId);

    return {
        contents: [{
            uri: uri,
            mimeType: "application/json",
            text: JSON.stringify(moods, null, 2)
        }]
    };
});

// Start server
async function run() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MoodFlow MCP Server running on stdio");
}

run().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});
