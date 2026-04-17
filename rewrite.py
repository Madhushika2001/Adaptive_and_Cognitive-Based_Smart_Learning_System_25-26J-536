import os

path = r"c:\Users\dinus\OneDrive\Desktop\final_Adaptive_and_Cognitive-Based_Smart_Learning_System_25-26J-536\Adaptive_and_Cognitive-Based_Smart_Learning_System_25-26J-536\frontend\src\components\adaptive\ResultsDashboard.tsx"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

# 1. Imports
data = data.replace(
  "import { predictLevel, generateSummary, generateMindmap, generateFlashcards, generateFeedback } from '../../api/adaptiveApi';",
  "import { predictLevel, generateSummary, generateMindmap, generateFlashcards, generateFeedback, generateStudyPlan } from '../../api/adaptiveApi';"
)
data = data.replace(
  "import { ReactFlow, Controls, Background } from '@xyflow/react';",
  "import { ReactFlow, Controls, Background, Handle, Position } from '@xyflow/react';\nimport { StudyPlan } from './StudyPlan';\nimport { FlashcardViewer } from './FlashcardViewer';"
)

# 2. Add CustomMindmapNode after MindmapElements
custom_node = """interface MindmapElements {
    nodes: object[];
    edges: object[];
}

const CustomMindmapNode = ({ data }: any) => {
    return (
        <div style={data.style} className="shadow-lg border-2 relative px-4 py-2 rounded-xl flex items-center justify-center font-bold text-center transition-transform hover:scale-105 group">
            <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-white border-2 !border-current opacity-0 group-hover:opacity-100" />
            <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 opacity-70" />
                <span>{data.label}</span>
            </div>
            <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-white border-2 !border-current opacity-0 group-hover:opacity-100" />
        </div>
    );
};

const nodeTypes = {
    custom: CustomMindmapNode
};
"""
data = data.replace(
    "interface MindmapElements {\n    nodes: object[];\n    edges: object[];\n}",
    custom_node
)

# 3. States
data = data.replace(
    "const [feedback, setFeedback] = useState<string | null>(null);",
    "const [feedback, setFeedback] = useState<string | null>(null);\n    const [studyPlan, setStudyPlan] = useState<any | null>(null);"
)
data = data.replace(
    "const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);",
    "const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);\n    const [isStudyPlanLoading, setIsStudyPlanLoading] = useState(false);"
)

# 4. API Call
api_call = """                if (signal.aborted) return;
                setIsStudyPlanLoading(true);
                try {
                    const spRes = await generateStudyPlan(selection.module, selection.lecture, selection.topic, levelString, signal);
                    if (signal.aborted) return;
                    setStudyPlan(spRes);
                } catch (e: unknown) {
                    if ((e as Error).name !== 'CanceledError') console.error('Study plan error', e);
                } finally {
                    if (!signal.aborted) setIsStudyPlanLoading(false);
                }

                if (signal.aborted) return;
                setIsFeedbackLoading(true);"""
data = data.replace("""                if (signal.aborted) return;
                setIsFeedbackLoading(true);""", api_call)

# 5. Mindmap Custom Node Injection
data = data.replace(
    "return { id: nodeIdStr, targetPosition: 'left', sourcePosition: 'right', position: { x: xPos, y: yPos }, data: { label: n.label }, type: 'default', style: nodeStyle };",
    "return { id: nodeIdStr, position: { x: xPos, y: yPos }, data: { label: n.label, style: nodeStyle }, type: 'custom' };"
)
data = data.replace(
    "<ReactFlow\n                                    nodes={mindmapElements.nodes as any}\n                                    edges={mindmapElements.edges as any}",
    "<ReactFlow\n                                    nodes={mindmapElements.nodes as any}\n                                    edges={mindmapElements.edges as any}\n                                    nodeTypes={nodeTypes}"
)

# 6. Replace Flashcards code
import re
data = re.sub(
    r'<div className="grid gap-4 overflow-y-auto pr-3 custom-scrollbar flex-1 pb-4">.*?</div>\n                    </div>',
    """<div className="flex-1 pb-4">
                            {isFlashcardsLoading && !flashcards && (
                                <div className="h-full w-full bg-white rounded-2xl animate-pulse border border-slate-100 shadow-sm flex items-center justify-center">
                                    <span className={`font-bold tracking-wide uppercase text-sm ${theme.textMuted}`}>Generating Flashcards...</span>
                                </div>
                            )}
                            {flashcards && (
                                <FlashcardViewer flashcards={flashcards} theme={theme} />
                            )}
                        </div>
                    </div>""",
    data,
    flags=re.DOTALL
)

# 7. Inject StudyPlan UI
plan_ui = """
                {/* Study Plan */}
                <div className={`backdrop-blur-sm rounded-3xl relative ${theme.bg}`}>
                    {isStudyPlanLoading ? (
                        <div className={`p-8 rounded-3xl min-h-[150px] shadow-sm flex flex-col items-center justify-center border ${theme.bg} ${theme.border}`}>
                            <Brain className={`w-8 h-8 animate-pulse mb-4 ${theme.accent}`} />
                            <span className={`font-bold tracking-wide uppercase ${theme.textMuted}`}>Crafting Personalized Study Plan...</span>
                        </div>
                    ) : studyPlan ? (
                        <StudyPlan plan={studyPlan.plan || []} overview={studyPlan.overview || ''} theme={theme} />
                    ) : null}
                </div>

                {/* Mindmap */}"""
data = data.replace("{/* Mindmap */}", plan_ui)

with open(path, "w", encoding="utf-8") as f:
    f.write(data)
