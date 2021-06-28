import Koa from "koa";
import Router from "koa-router";
import { Pool, QueryResultRow } from "pg";

const app = new Koa();
const router = new Router();
const pool = new Pool({
    database: process.env.DATABASE_RESULT_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
});

const port = 3000;

router.get("/api/status", async (ctx) => {
    ctx.body = "ok";
    ctx.body = pool;
});

router.get("/api/pairs", async (ctx) => {
    ctx.body = await queryGetPair();
});

router.get("/api/total", async (ctx) => {
    ctx.body = await computeTotalProfit();
});

router.get("/api/total/:pair", async (ctx) => {
    ctx.body = await computeProfit(ctx.params.pair);
});

async function queryGetPair(): Promise<QueryResultRow> {
    const { rows } = await pool.query(
        "SELECT DISTINCT pair FROM transactions ORDER BY pair",
        []
    );
    return (rows);
}

async function queryGetTransactions(pair: string): Promise<QueryResultRow> {
    const { rows } = await pool.query(
        "SELECT close_price, type FROM transactions WHERE pair='" + pair + "' ORDER BY close_time",
        []
    );
    return (rows);
}

async function computeTotalProfit() {
    const result: { [key: string]: unknown } = {};
    let total = 0.0;
    const pairs = await queryGetPair();

    for (let i = 0; i < pairs.length; ++i) {
        const profit = await computeProfit(pairs[i].pair);
        if (Object.prototype.hasOwnProperty.call(profit, "error")) { return (pairs[i]); }
        total += profit["total"] as number;
    }
    result["total"] = total;
    return (result);
}

async function computeProfit(pair: string) {
    const result: { [key: string]: unknown } = {};
    let total = 0.0;
    const rows: QueryResultRow = await queryGetTransactions(pair);
    let buy = 0.0;
    let i = 0;

    if (rows.length === 0) {
        result["error"] = "pair does not exist";
        return (result);
    }
    for (; i < rows.length && rows[i].type.toLowerCase() != "buy"; ++i);
    for (; i < rows.length; ++i) {
        if (rows[i].type.toLowerCase() === "buy") {
            buy = rows[i].close_price;
        }
        else if (rows[i].type.toLowerCase() === "sell" && buy !== 0.0) {
            const sell = rows[i].close_price;
            const profit = (sell - buy) / buy * 100.0;
            total += profit;
            buy = 0.0;
        }
    }
    result["pair"] = pair;
    result["total"] = total;
    return (result);
}

app.use(router.routes());

app.listen(port, () => {
    console.log("Server listen on port", port, "http://localhost:3000");
});
