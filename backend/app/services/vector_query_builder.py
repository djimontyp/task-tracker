"""Base class for building pgvector similarity queries."""

from typing import TypeVar

T = TypeVar("T")


class VectorQueryBuilder:
    """Base class for building pgvector similarity queries."""

    @staticmethod
    def build_similarity_query(
        table: str,
        select_clause: str = "*",
        where_conditions: str = "",
        order_by: str | None = None,
    ) -> str:
        """Build reusable vector similarity query.

        Args:
            table: Table name (e.g., "messages m")
            select_clause: Columns to select (default: "*")
            where_conditions: Additional WHERE conditions
            order_by: Custom ORDER BY (default: cosine distance)

        Returns:
            SQL query template
        """
        table_alias = table.split()[0] if " " in table else table

        base_conditions = f"{table_alias}.embedding IS NOT NULL"
        similarity_threshold = f"(1 - ({table_alias}.embedding <=> :query_vector::vector) / 2) >= :threshold"

        where_clause = base_conditions
        if where_conditions:
            where_clause += f" AND {where_conditions}"
        where_clause += f" AND {similarity_threshold}"

        order_clause = order_by or f"{table_alias}.embedding <=> :query_vector::vector"

        return f"""
            SELECT
                {select_clause},
                1 - ({table_alias}.embedding <=> :query_vector::vector) / 2 AS similarity
            FROM {table}
            WHERE {where_clause}
            ORDER BY {order_clause}
            LIMIT :limit
        """
