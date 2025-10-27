"""Pre-built rule templates for common automation scenarios."""

from typing import Any

RULE_TEMPLATES: list[dict[str, Any]] = [
    {
        "name": "High Confidence Auto-Approve",
        "description": "Automatically approve versions with high confidence and similarity scores",
        "action": "approve",
        "priority": 90,
        "logic_operator": "AND",
        "conditions": [
            {"field": "confidence", "operator": "gte", "value": 90},
            {"field": "similarity", "operator": "gte", "value": 85},
        ],
    },
    {
        "name": "Low Confidence Reject",
        "description": "Automatically reject low quality versions",
        "action": "reject",
        "priority": 80,
        "logic_operator": "OR",
        "conditions": [
            {"field": "confidence", "operator": "lt", "value": 50},
            {"field": "similarity", "operator": "lt", "value": 30},
        ],
    },
    {
        "name": "Urgent Topic Escalate",
        "description": "Escalate urgent topics for manual review",
        "action": "escalate",
        "priority": 95,
        "logic_operator": "AND",
        "conditions": [
            {"field": "topic.name", "operator": "contains", "value": "urgent"},
        ],
    },
    {
        "name": "High Similarity Auto-Approve",
        "description": "Approve versions with very high similarity to existing content",
        "action": "approve",
        "priority": 85,
        "logic_operator": "AND",
        "conditions": [
            {"field": "similarity", "operator": "gte", "value": 95},
        ],
    },
    {
        "name": "Moderate Quality Notify",
        "description": "Send notification for versions with moderate quality scores",
        "action": "notify",
        "priority": 50,
        "logic_operator": "AND",
        "conditions": [
            {"field": "confidence", "operator": "gte", "value": 60},
            {"field": "confidence", "operator": "lt", "value": 80},
        ],
    },
    {
        "name": "Important Topic Escalate",
        "description": "Escalate topics marked as important or critical",
        "action": "escalate",
        "priority": 90,
        "logic_operator": "OR",
        "conditions": [
            {"field": "topic.name", "operator": "contains", "value": "important"},
            {"field": "topic.name", "operator": "contains", "value": "critical"},
        ],
    },
]
