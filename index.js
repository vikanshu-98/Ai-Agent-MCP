import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js"
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js' 
import {z} from 'zod'
import dotenv from 'dotenv'
import axios from "axios"   
dotenv.config()
const {
    OPEN_WAETHER_KEY,
    NEWS_KEY,
    STOCK_KEY 
    
}=process.env


const server = new McpServer({
    name:'Ai Agent',
    version:'1.0.0'
})

async function getWeather(city){
    try {
        const result = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPEN_WAETHER_KEY}&units=metric`);
        return {
            temp: `${result.data.main.temp}°C`,
            forecast: result.data.weather[0].description
        };
    } catch (error) {
        console.error("Weather API error:", error.response?.data || error.message);
        return { error: error.response?.data || 'Something went wrong' };
    }
}


server.tool('getWeatherDataByCityName',
    { city:z.string()},
    async ({city})=> {
    return {
        content:[{type:'text',text:JSON.stringify(await getWeather(city))}]
    }
}
)


async function getTopic(topic){
    try {
        const result = await axios.get(`https://newsapi.org/v2/everything?q=${topic}&apiKey=${NEWS_KEY}`)
        return {headline:result.data.articles[0].title||'no news avl'}
    } catch (error) {
        return {error:"unable to fetch the news.."}
    }
}
server.tool('getNewsByTopic',
    {topic:z.string()},
    async ({topic})=>({
        content:[{type:"text",text:JSON.stringify(await getTopic(topic))}]
    }) 
)


async function getStock(symbol) {
    try {
        const url = `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${STOCK_KEY}`;
        const result = await axios.get(url);
 
        if (result.data.status === 'error') {
            return { error: result.data.message || 'Invalid symbol or service error' };
        }

        if (!result.data.price) {
            return { error: 'Price not available for this symbol right now.' };
        }

        return { company: symbol, price: `$${result.data.price}` };
    } catch (error) { 
        return { error: "Unable to fetch stock/crypto data at this moment." };
    }
}




server.tool('getStockPrice', { symbol: z.string() },
    async ({ symbol }) => ({
        content: [
            { type: "text", text: JSON.stringify(await getStock(symbol.toUpperCase())) }
        ]
    })
);



server.tool(
    'sayHello',
    { name: z.string() },
    async ({ name }) => {
      console.log("sayHello tool triggered:", name); // 👀 For debug
      return {
        content: [{ type: 'text', text: `Hello, ${name}!` }],
      };
    }
  );

// Step 3: Start the server and connect via STDIO
async function init() { 
    await server.connect(new StdioServerTransport()); 
  }
  
init();
  
  