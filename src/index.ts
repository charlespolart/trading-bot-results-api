import Koa from "koa";
import Router from "koa-router";
import { Pool } from "pg";

const app = new Koa();
const router = new Router();
const pool = new Pool({
    database: process.env.DATABASE_RESULT_HISTORY_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
});

const port = 3000;

router.get("/api/pairs", async (ctx) => {
    const { rows } = await pool.query(
        "SELECT DISTINCT pair FROM transactions ORDER BY pair",
        []
    );
    ctx.body = rows;
});

app.use(router.routes());

app.listen(port, () => {
    console.log("Server listen on port", port, "http://localhost:3000");
});
