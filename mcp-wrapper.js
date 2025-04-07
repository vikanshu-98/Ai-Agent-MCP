import express from 'express';
import { spawn } from 'child_process';

const app = express();
app.use(express.json());

async function callMcpTool(tool, input = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn('node', ['index.js']); // Make sure index.js runs the MCP agent

        const request = JSON.stringify({
            method: "callTool",
            tool,
            input
        }) + "\n";

        let result = '';
        let errorOutput = '';

        child.stdout.on('data', (data) => {
            result += data.toString();
            console.log('✅ MCP response chunk:', data.toString());
        });

        child.stderr.on('data', (data) => {
            errorOutput += data.toString();
            console.error('❌ MCP error:', data.toString());
        });

        child.stdin.write(request);
        child.stdin.end(); // 🔑 Important: this signals that we're done sending input

        child.on('close', (code) => {
            if (errorOutput) {
                return reject(errorOutput);
            }

            try {
                const parsed = JSON.parse(result.trim());
                resolve(parsed);
            } catch (e) {
                resolve(result.trim()); // In case it's already string output
            }
        });

        // Optional timeout safety
        setTimeout(() => {
            reject("⏱ Timeout reached while waiting for MCP response.");
            child.kill();
        }, 10000);
    });
}

app.post('/mcp/:tool', async (req, res) => {
    try {
        const toolName = req.params.tool;
        const result = await callMcpTool(toolName, req.body);
        console.log(result);
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});

app.listen(3000, () => {
    // console.log('🚀 Express API running on port 3000');
});
