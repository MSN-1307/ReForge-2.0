from pathlib import Path
from typing import Dict, Any, List
import json
import os
import subprocess
from app.mcp.registry import mcp_registry
from app.parser.ast_engine import ast_parser
from app.parser.graph_engine import CodebaseKnowledgeGraph
from app.storage.db import get_project, record_agent_event
from app.config import PROJECTS_DIR

# In-memory storage for graphs
project_graphs: Dict[str, CodebaseKnowledgeGraph] = {}

IGNORED_DIRS = {
    "node_modules", ".git", "dist", "build", ".venv", "venv", "env",
    "__pycache__", ".idea", ".vscode", "site-packages", ".pytest_cache",
    ".mypy_cache", "target", ".next", ".nuxt", "bin", "obj", "__MACOSX"
}

IGNORED_EXTENSIONS = {
    ".exe", ".dll", ".so", ".dylib", ".bin", ".pt", ".onnx", ".h5",
    ".pkl", ".wav", ".mp3", ".ogg", ".flac", ".png", ".jpg", ".jpeg",
    ".gif", ".webp", ".ico", ".svg", ".zip", ".tar", ".gz", ".7z",
    ".pdf", ".docx", ".xlsx", ".mp4", ".mov", ".avi", ".mkv", ".pyc"
}

@mcp_registry.register(
    name="analyze_repository",
    category="Repository / Analysis",
    description="Inspects source directory, detects frameworks, file tree, dependencies and statistics."
)
def analyze_repository(project_id: str) -> Dict[str, Any]:
    project = get_project(project_id)
    if not project:
        raise ValueError(f"Project '{project_id}' not found.")

    source_path = Path(project["source_path"])
    if not source_path.exists():
        raise FileNotFoundError(f"Project source path '{source_path}' does not exist.")

    files_list = []
    total_lines = 0
    package_json = {}
    detected_frameworks = []

    for root, dirs, files in os.walk(source_path):
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]
        for f in files:
            full_path = Path(root) / f
            suffix = full_path.suffix.lower()
            if suffix in IGNORED_EXTENSIONS:
                continue

            rel_path = full_path.relative_to(source_path)
            line_count = 0
            # Only count lines for code & config files under 2MB
            if full_path.stat().st_size < 2 * 1024 * 1024:
                try:
                    line_count = len(full_path.read_text(encoding="utf-8", errors="replace").splitlines())
                except Exception:
                    line_count = 0

            total_lines += line_count
            files_list.append({
                "rel_path": str(rel_path).replace("\\", "/"),
                "size_bytes": full_path.stat().st_size,
                "lines": line_count
            })

            if f == "package.json":
                try:
                    package_json = json.loads(full_path.read_text(encoding="utf-8"))
                except Exception:
                    pass
            elif f == "requirements.txt":
                try:
                    req_text = full_path.read_text(encoding="utf-8", errors="replace")
                    if "fastapi" in req_text.lower():
                        detected_frameworks.append("FastAPI")
                    if "flask" in req_text.lower():
                        detected_frameworks.append("Flask")
                    if "django" in req_text.lower():
                        detected_frameworks.append("Django")
                except Exception:
                    pass

    deps = package_json.get("dependencies", {})
    if "express" in deps:
        detected_frameworks.append("Express.js")
    if "mongoose" in deps:
        detected_frameworks.append("Mongoose (MongoDB)")
    if "sequelize" in deps:
        detected_frameworks.append("Sequelize ORM")
    if "jest" in deps or "supertest" in deps:
        detected_frameworks.append("Jest / Supertest")

    if not detected_frameworks:
        detected_frameworks.append(project.get("source_framework", "Universal API"))

    analysis_result = {
        "project_id": project_id,
        "name": project["name"],
        "total_files": len(files_list),
        "total_lines": total_lines,
        "frameworks": detected_frameworks,
        "dependencies": deps,
        "files": files_list
    }

    record_agent_event(
        project_id=project_id,
        category="EVIDENCE",
        agent_name="ArchaeologistAgent",
        title="Observed Repository Structure",
        details=f"Identified {len(files_list)} source files ({total_lines} total lines of code) with frameworks: {', '.join(detected_frameworks)}",
        metadata={"files_count": len(files_list), "frameworks": detected_frameworks}
    )

    return analysis_result


@mcp_registry.register(
    name="parse_code",
    category="Repository / Analysis",
    description="Parses a specific file or all files in repository into structured AST representations."
)
def parse_code(project_id: str, file_path: str = "") -> Dict[str, Any]:
    project = get_project(project_id)
    if not project:
        raise ValueError(f"Project '{project_id}' not found.")

    source_path = Path(project["source_path"])
    ast_catalog = {}

    from app.parser.universal_parser import universal_parser
    # Universal project parse
    try:
        u_proj = universal_parser.parse_project(source_path, project["name"])
        # If universal parser found routes or models, include them in catalog
        for route in u_proj.routes:
            rf = route.file or "routes.py"
            if rf not in ast_catalog:
                ast_catalog[rf] = {"file": rf, "routes": [], "models": [], "imports": [], "middleware": []}
            ast_catalog[rf]["routes"].append({
                "method": route.method,
                "path": route.path,
                "params": route.path_params,
                "body_fields": route.body_fields,
                "status_code": route.status_code,
                "line": route.line
            })

        for model in u_proj.models:
            mf = model.file or "models.py"
            if mf not in ast_catalog:
                ast_catalog[mf] = {"file": mf, "routes": [], "models": [], "imports": [], "middleware": []}
            ast_catalog[mf]["models"].append({
                "name": model.name,
                "fields": [{"name": f.name, "type": f.type, "required": f.required} for f in model.fields],
                "line": model.line
            })
    except Exception as e:
        print(f"Universal parser error: {e}")

    # Also parse JS/TS files if present
    if file_path:
        target = source_path / file_path
        if target.exists() and target.suffix in [".js", ".ts", ".mjs"]:
            ast_catalog[file_path] = ast_parser.parse_file(target)
    else:
        for root, dirs, files in os.walk(source_path):
            dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]
            for f in files:
                if f.endswith((".js", ".ts", ".mjs")):
                    full = Path(root) / f
                    rel = str(full.relative_to(source_path)).replace("\\", "/")
                    if rel not in ast_catalog:
                        ast_catalog[rel] = ast_parser.parse_file(full)

    # Summarize extracted facts
    routes_found = sum(len(f.get("routes", [])) for f in ast_catalog.values())
    models_found = sum(len(f.get("models", [])) for f in ast_catalog.values())

    record_agent_event(
        project_id=project_id,
        category="EVIDENCE",
        agent_name="ArchaeologistAgent",
        title=f"Parsed AST: Discovered {routes_found} Routes & {models_found} Data Models",
        details=f"Extracted route signatures and schema definitions across {len(ast_catalog)} source files.",
        metadata={"routes_count": routes_found, "models_count": models_found}
    )

    return {
        "project_id": project_id,
        "files_parsed": len(ast_catalog),
        "catalog": ast_catalog
    }



@mcp_registry.register(
    name="build_dependency_graph",
    category="Repository / Analysis",
    description="Constructs in-memory NetworkX architecture graph from AST and exports React Flow graph representation."
)
def build_dependency_graph(project_id: str) -> Dict[str, Any]:
    parsed = parse_code(project_id=project_id)
    ast_catalog = parsed["catalog"]

    project = get_project(project_id)
    kg = CodebaseKnowledgeGraph(Path(project["source_path"]))
    kg.build_from_ast(ast_catalog)
    project_graphs[project_id] = kg

    react_flow_data = kg.to_react_flow()

    record_agent_event(
        project_id=project_id,
        category="ANALYSIS",
        agent_name="ArchaeologistAgent",
        title="Constructed Codebase Knowledge Graph",
        details=f"Built in-memory NetworkX directed graph with {react_flow_data['summary']['total_nodes']} nodes and {react_flow_data['summary']['total_edges']} architectural relationships.",
        metadata=react_flow_data["summary"]
    )

    return react_flow_data


@mcp_registry.register(
    name="inspect_git_history",
    category="Repository / Analysis",
    description="Gathers Git commit logs and author churn metrics if repository has git metadata."
)
def inspect_git_history(project_id: str) -> Dict[str, Any]:
    project = get_project(project_id)
    source_path = Path(project["source_path"])
    git_dir = source_path / ".git"

    if not git_dir.exists():
        return {
            "has_git": False,
            "commits": [],
            "message": "No Git repository found in project folder."
        }

    try:
        res = subprocess.run(
            ["git", "log", "-n", "10", "--pretty=format:%h|%an|%s|%ad", "--date=short"],
            cwd=str(source_path),
            capture_output=True,
            text=True,
            check=False
        )
        commits = []
        if res.returncode == 0 and res.stdout.strip():
            for line in res.stdout.strip().split("\n"):
                parts = line.split("|")
                if len(parts) >= 4:
                    commits.append({
                        "hash": parts[0],
                        "author": parts[1],
                        "subject": parts[2],
                        "date": parts[3]
                    })

        record_agent_event(
            project_id=project_id,
            category="EVIDENCE",
            agent_name="ArchaeologistAgent",
            title="Extracted Git Commit History",
            details=f"Retrieved {len(commits)} recent commits for code evolution context.",
            metadata={"commits_count": len(commits)}
        )

        return {"has_git": True, "commits": commits}
    except Exception as e:
        return {"has_git": False, "error": str(e), "commits": []}
