import httpx
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()

class MetricsResponse(BaseModel):
    orphanRate: float = Field(default_factory=float)
    tps: float = Field(default_factory=float)
    blueRatio: float = Field(default_factory=float)
    confirmationLatency: float = Field(default_factory=float)
    tipPoolSize: int = Field(default_factory=int)

    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "orphanRate": 0.01,
                    "tps": 300.0,
                    "blueRatio": 0.98,
                    "confirmationLatency": 1.2,
                    "tipPoolSize": 12
                }
            ]
        }

@router.get("/metrics", response_model=MetricsResponse)
async def get_metrics():
    async with httpx.AsyncClient(base_url="https://api.kaspa.org") as client:
        dag_info_resp = await client.get("/info/blockdag")
        dag = dag_info_resp.json()
        tip_pool_size = len(dag.get("tipHashes", []))
        block_rate = 10  # Kaspa post-Crescendo, adjust if needed

        blocks_resp = await client.get("/blocks-from-bluescore", params={"blueScore": 0, "includeTransactions": True})
        blocks = blocks_resp.json()
        blocks = sorted(blocks, key=lambda b: int(b["header"]["timestamp"]))
        recent_blocks = blocks[-100:] if len(blocks) > 100 else blocks

        blue_blocks = [b for b in recent_blocks if b["verboseData"].get("isChainBlock", False)]
        red_blocks = [b for b in recent_blocks if not b["verboseData"].get("isChainBlock", False)]
        total_blocks = len(recent_blocks)
        blue_ratio = len(blue_blocks) / total_blocks if total_blocks else 0
        orphan_rate = len(red_blocks) / total_blocks if total_blocks else 0

        total_txs = sum(len(b.get("transactions", [])) for b in blue_blocks)
        avg_tx_per_block = total_txs / len(blue_blocks) if blue_blocks else 0
        tps = block_rate * avg_tx_per_block * blue_ratio

        time_diffs = [
            (int(recent_blocks[i]["header"]["timestamp"]) - int(recent_blocks[i-1]["header"]["timestamp"])) / 1000
            for i in range(1, len(recent_blocks))
        ]
        confirmation_latency = sum(time_diffs) / len(time_diffs) if time_diffs else 0

        return MetricsResponse(
            orphanRate=orphan_rate,
            tps=tps,
            blueRatio=blue_ratio,
            confirmationLatency=confirmation_latency,
            tipPoolSize=tip_pool_size
        ) 