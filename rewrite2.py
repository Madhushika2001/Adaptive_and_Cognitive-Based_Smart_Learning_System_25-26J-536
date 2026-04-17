import os
import re

path = r"c:\Users\dinus\OneDrive\Desktop\final_Adaptive_and_Cognitive-Based_Smart_Learning_System_25-26J-536\Adaptive_and_Cognitive-Based_Smart_Learning_System_25-26J-536\frontend\src\components\adaptive\ResultsDashboard.tsx"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

# The block to find:
#                 {/* Study Plan */}
#                 <div className={`backdrop-blur-sm rounded-3xl relative ${theme.bg}`}>
#                     {isStudyPlanLoading ? (
# ... <Brain ... >
#                         </div>
#                     ) : studyPlan ? (
#                         <StudyPlan plan={studyPlan.plan || []} overview={studyPlan.overview || ''} theme={theme} />
#                     ) : null}
#                 </div>

study_plan_regex = r"\s*\{\/\* Study Plan \*\/\}\s*<div className=\{`backdrop-blur-sm rounded-3xl relative \$\{theme\.bg\}`\}>\s*\{isStudyPlanLoading \? \([\s\S]*?\) : studyPlan \? \([\s\S]*?\) : null\}\s*<\/div>\n"

match = re.search(study_plan_regex, data)
if match:
    study_plan_ui = match.group(0)
    # Remove it from the current position
    data = data.replace(study_plan_ui, "\n")
    
    # We want to place it below the mindmap and flashcards div.
    # The grid containing mindmap and flashcards ends before the action buttons.
    # Let's find:
    #                 </div>
    #
    #                 <div className={`flex justify-end gap-4 pt-8 border-t mt-2 ${theme.border}`}>
    
    insert_target = """                </div>

                <div className={`flex justify-end gap-4 pt-8 border-t mt-2 ${theme.border}`}>"""
    
    replacement = "                </div>\n\n" + study_plan_ui + "\n" + """                <div className={`flex justify-end gap-4 pt-8 mt-6 border-t ${theme.border}`}>"""
    
    data = data.replace(insert_target, replacement)
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(data)
    print("Moved successfully")
else:
    print("Could not find Study Plan UI Regex")
