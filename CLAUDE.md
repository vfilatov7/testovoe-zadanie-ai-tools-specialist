# Тестовое задание — AI Tools Specialist

## Purpose

Software project for AI Tools Specialist test assignment.

## Project Info

- **Created**: 2026-04-09
- **Location**: /Users/v.filatov/projects/testovoe-zadanie-ai-tools-specialist
- **Role**: Developer

## Getting Started

This project was initialized with Claude Code.

### MCP Servers

MCP servers are configured in `.mcp.json`. Use `/mcp` to manage them.

## Architecture Tools

This project uses IcePanel + Neo4j for architecture analysis.

### Quick Reference

| Question Type | Use This |
|---------------|----------|
| "What is X?" | IcePanel |
| "Who owns X?" | IcePanel |
| "What depends on X?" | Neo4j |
| "How does data flow?" | Neo4j |
| "Impact if X fails?" | Neo4j |

### IcePanel Queries

Ask natural language questions about architecture:
- "What services are in the checkout flow?"
- "What does the API Gateway connect to?"
- "What technology does the billing service use?"

### Neo4j Cypher Examples

```cypher
-- Find all dependencies of a service
MATCH (s:Service {name: 'api-gateway'})-[:CALLS|DEPENDS_ON*1..3]->(d)
RETURN DISTINCT d.name, labels(d)

-- Find services with no dependents (leaf nodes)
MATCH (s:Service)
WHERE NOT ()-[:CALLS]->(s)
RETURN s.name

-- Get database schema
CALL db.schema.visualization()
```

### Workflow Pattern

1. **Start with IcePanel** for visual context and high-level questions
2. **Use Neo4j** for dependency chains, impact analysis, path finding

## Development

<!-- Add development setup instructions here -->

## Architecture

<!-- Document key architectural decisions here -->

## Conventions

<!-- Add project-specific conventions and guidelines here -->
