from datetime import datetime
from pydantic import BaseModel, Field

class AgentStats(BaseModel):
    """Real-time statistics for an agent."""
    
    # Vital Signs
    last_run_at: datetime | None = Field(default=None, description="Timestamp of the last execution")
    success_rate: float = Field(default=0.0, description="Percentage of successful runs (0-100)")
    total_runs_24h: int = Field(default=0, description="Number of runs in the last 24 hours")
    avg_duration_sec: float = Field(default=0.0, description="Average duration of runs in seconds")
    
    # Secondary / Future
    atoms_created_24h: int = Field(default=0, description="Number of atoms created in the last 24 hours")
