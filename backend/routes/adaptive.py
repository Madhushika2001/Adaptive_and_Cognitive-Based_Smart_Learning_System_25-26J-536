import os
# Fix WinGet PATH so Whisper can find ffmpeg - must run BEFORE voice_service import
os.environ["PATH"] += os.pathsep + os.path.expanduser(r"~\AppData\Local\Microsoft\WinGet\Links")

import shutil
import string
from pathlib import Path
from typing import Optional

import uuid
from thefuzz import fuzz
from fastapi import APIRouter, UploadFile, File, Form, Body
import joblib
import numpy as np

from services.mcq_generator import generate_mcqs
from services.summary_service import generate_summary
from services.mindmap_service import generate_mindmap
from services.flashcard_service import generate_flashcards
from services.feedback_service import generate_feedback
from services.voice_service import transcribe_audio
from services.study_plan_service import generate_study_plan
from database import (
    lecture_collection,
    user_results_collection,
    mcq_collection,
    summary_collection,
    mindmap_collection,
    flashcard_collection,
    feedback_collection,
    study_plan_collection,
)

router = APIRouter(prefix="/api/adaptive", tags=["Adaptive Learning"])

# ── Local Data Mapping ──────────────────────────────────────────────────────
# Map internal IDs to human-readable module names and fallback data
_SUBJECT_MAP = {
    "Cloud Computing": "cc",
    "CloudComputing": "cc",
    "Database Administration": "da",
    "DatabaseAdministration": "da",
    "Deep Learning": "dl",
    "DeepLearning": "dl",
    "Intelligent Multi-agent Systems": "ime",
    "IntelligentMulti-AgentSystems": "ime"
}


# Full Topic Pool structure as a robust local fallback
_MODULE_TOPICS_FALLBACK = {
  "CloudComputing": {
    "lec1": ["Evolution of IT Infrastructure", "Cloud Computing Characteristics", "Cloud Computing Service Models", "Cloud Computing Deployment Models", "Cloud Service Providers", "Cloud Infrastructure", "Regions and Availability Zones", "Cloud Service Providers", "Cloud Computing Benefits", "History of electricity", "Traditional IT process", "Nist definition of cloud", "Infrastructure as a service(IAAS)", "Platform as a service(PAAS)", "Software as a service(SAAS)", "NIST cloud computing reference architecture", "Actors in cloud computing", "Public cloud", "Private cloud", "Hybrid cloud", "Community cloud"],
    "lec2": ["Cloud Global Infrastructure", "Cloud Infrastructure Components", "Data Centers", "Regions", "Availability Zones", "Selecting a Cloud Region", "Benefits of the Global Infrastructure", "Security in Cloud Infrastructure", "Availability and Reliability", "Scalability and Performance", "Flexibility of Cloud Infrastructure", "Core Cloud Services", "Compute Services", "Storage Services", "Network Services", "Shared Responsibility Model", "Security of the Cloud", "Security in the Cloud", "Billing and Cost Management", "Pay-as-you-go Pricing Model", "Reserved Instances and Discounts", "Resource Scopes", "Service Limits", "Quotas", "Soft Limits", "Hard Limits"],
    "lec3": ["Virtualization", "Containerization", "Type 1 Hypervisor", "Type 2 Hypervisor", "Software Defined Compute", "Cloud Compute Services", "Amazon EC2", "Azure Virtual Machines", "Compute Instance Types", "General Purpose Instances", "Compute Optimized Instances", "Memory Optimized Instances", "Storage Optimized Instances", "Accelerated Computing", "Burstable Instances", "Tenancy Models", "Shared Tenancy", "Dedicated Instances", "Dedicated Hosts", "Purchasing Options", "On-demand Instances", "Reserved Instances", "Spot Instances", "Savings Plans", "Compute Instance Lifecycle", "Placement Groups", "Cluster Placement Groups", "Partition Placement Groups", "Spread Placement Groups"],
    "lec4": ["Cloud Networking Basics", "IP Addressing", "Subnets", "CIDR Notation", "Basic Routing", "Default Gateways", "Software Defined Networking (SDN)", "Network Function Virtualization (NFV)", "Cloud Native Network Functions (CNF)", "SDN vs NFV", "Virtual Networks", "AWS VPC", "Azure Virtual Network", "Subnets and Subnet Sizing", "Private and Public Subnets", "Virtual Network Interfaces", "Elastic Network Interface (ENI)", "Network Interface Card (NIC)", "Access Control", "Security Groups", "Network Access Control Lists (NACL)", "Network Security Groups (NSG)", "Stateful and Stateless Rules", "Network Gateway Services", "Internet Gateway", "NAT Gateway", "VPN Gateway", "Transit Gateway", "Network Peering", "Bastion Hosts", "Hybrid Connectivity", "Site-to-Site VPN", "Point-to-Site VPN", "Direct Connectivity", "Private Access to Cloud Services", "Private Endpoints", "Private Links", "Service Endpoints", "Network Flow Logs"],
    "lec5": ["Downtime", "Planned Downtime", "Unplanned Downtime", "Availability Metrics", "Availability Percentage", "High Availability", "Single Point of Failure", "Failure Detection", "Redundancy", "Active Redundancy", "Passive Redundancy", "Failover", "Failback", "Replication", "Active Replication", "Passive Replication", "High Availability Clusters", "Active-Active Configuration", "Active-Passive Configuration", "Load Balancing", "Session Persistence", "Load Balancing Algorithms", "Business Continuity", "Business Continuity Planning", "Disaster Recovery", "Disaster Recovery Planning", "Backup Strategies", "Full Backup", "Incremental Backup", "Differential Backup", "Disaster Recovery Tiers", "Recovery Objectives", "Recovery Time Objective (RTO)", "Recovery Point Objective (RPO)", "Recovery Consistency Objective (RCO)"],
    "lec6": ["Software Defined Security", "Principle of Least Privilege", "Identity and Access Management (IAM)", "IAM Components", "Users", "Groups", "Policies", "Roles", "Multi Factor Authentication (MFA)", "Authentication Factors", "Cloud security Risks and threats", "Federated Identity", "Single Sign-On (SSO)", "Encryption", "Client-side Encryption", "Server-side Encryption", "Data at Rest", "Data in Transit", "Data in Use", "Symmetric Encryption", "Asymmetric Encryption", "Hashing", "Cloud Security Risks", "Poor Access Management", "Data Breaches", "Misconfiguration", "Insecure APIs", "Account Hijacking", "Denial of Service Attacks", "Cloud Monitoring", "Monitoring Metrics", "Monitoring Events", "Monitoring Logs", "Alerts", "Threshold-based Alerts", "Anomaly Detection Alerts", "Heartbeat Alerts"],
    "lec7": ["Database Models", "Relational Databases", "Non-Relational Databases (NoSQL)", "ACID Properties", "SQL Databases", "Examples of Relational Databases", "Database Workloads", "Online Transaction Processing (OLTP)", "Online Analytical Processing (OLAP)", "Relational OLTP Databases", "Relational OLAP Databases", "Non-Relational OLTP Databases", "Non-Relational OLAP Databases", "NoSQL Database Types", "Key-Value Databases", "Document Databases", "Columnar Databases", "Graph Databases", "CAP Theorem", "Database Caching", "Redis", "Memcached", "Data Warehouse", "ETL Process", "ELT Process", "Data Lake", "Data Warehouse vs Data Lake", "Real-Time Data Processing", "Stream Processing"],
    "lec8": ["Cloud Migration", "Drivers for Cloud Migration", "Migration Process", "Opportunity Evaluation", "Portfolio Discovery and Planning", "Designing Migrating and Validating", "Operating in the Cloud", "Cloud Operating Models", "DevOps", "NoOps", "FinOps", "SecOps", "Cloud Migration Strategies", "Gartner 5 Rs Strategy", "Azure 4 Rs Strategy", "AWS 6 Rs Strategy", "Rehost Strategy", "Replatform Strategy", "Repurchase Strategy", "Refactor Strategy", "Rearchitect Strategy", "Rebuild Strategy", "Retire Strategy", "Retain Strategy", "Cloud Migration Challenges", "Cost of Migration", "Resistance to Change", "Shortage of Skills"],
    "lec9": ["Cloud Native Applications", "Monolithic Architecture", "Strengths of Monolithic Architecture", "Weaknesses of Monolithic Architecture", "Microservices Architecture", "Strengths of Microservices Architecture", "Weaknesses of Microservices Architecture", "Monolithic vs Microservices Architecture", "Cloud Native Computing", "Cloud Native Computing Foundation (CNCF)", "12 Factor App Methodology", "Principles of 12 Factor App", "Cloud Native Tools", "Containers", "Microservices", "Service Mesh", "Container Orchestration", "Cloud Native Practices", "DevOps", "Site Reliability Engineering (SRE)", "NoOps", "Continuous Integration (CI)", "Continuous Delivery (CD)", "Continuous Deployment", "CI/CD Tools", "Cloud DevOps Services", "Application Modernization", "Application Modernization Journey"]
  },
  "DatabaseAdministration": {
    "lec1": ["Oracle Database Architecture", "Oracle DB Server Architecture", "Multitenant Architecture", "Container Database (CDB)", "Pluggable Database (PDB)", "Application Containers", "Database Instance Structure", "Oracle Database Processes", "Process Structure (Client, Server, Background)", "Dedicated Server Architecture", "Shared Server Architecture", "Application Architecture", "Physical Database Structure", "Parameter File", "Alert Log", "Logical and Physical Storage Structures", "Database Blocks", "Extents", "Segments", "Tablespaces", "Tablespaces and Datafiles", "Relationship Between Segments, Extents, and Data Blocks", "Database Block Size"],
    "lec2": ["Oracle Database Instance", "Database Instance Configurations", "Read/Write and Read-Only Instances", "Initialization Parameter File", "Database Startup Process", "Instance Startup Steps", "Database Mount and Open Process", "Using SQL*Plus", "Database Shutdown", "Shutdown Modes", "Checkpoints", "Purpose of Checkpoints", "Instance Recovery", "Purpose of Instance Recovery", "CKPT in Instance Recovery", "Phases of Instance Recovery", "Rolling Forward and Rolling Back", "Parameter File Management", "Modification of Parameter File"],
    "lec3": ["Oracle Net Services Architecture", "Oracle Net Listener", "Databases and Listeners", "Establishing a Database Connection", "Service Name", "Services in a CDB", "Tools for Configuring and Managing Oracle Network", "Oracle Net Listener Configuration", "Listener.ora File", "Listener Control Utility", "Listener Control Utility Syntax", "Details Required for Database Connection", "Connection Establishment Process", "Connection String", "Naming Methods", "Easy Connect", "Local Naming", "TNSNAMES.ORA File", "Testing Oracle Net Connectivity"],
    "lec4": ["User Administration", "Creating and Managing User Accounts", "User Attributes and Authentication", "User Profiles", "Creating Users", "Altering Users", "Managing Privileges", "Object Privileges", "Granting Object Privileges", "Revoking Object Privileges", "System Privileges", "Role Privileges", "Setting Default Roles"],
    "lec5": ["Managing Undo Data", "Undo Data Concepts", "Uses of Undo Data", "Undo Segments", "Storing Undo Information", "Undo Data vs Redo Data", "Monitoring Undo", "Administering Undo", "Undo Retention", "Categories of Undo Information", "Sizing the Undo Tablespace"],
    "lec6": ["Database Security", "Security Guidelines", "Authentication and Identification", "Authorization", "Auditing", "Protection Against DBAs", "Threats and Vulnerabilities", "System Hardening", "Oracle Critical Patch Updates", "Security Information", "Auditing Overview", "Oracle Database Security Products and Solutions", "Oracle Label Security", "Transparent Data Encryption", "Data Redaction", "DBMS_REDACT", "Oracle Database Vault"],
    "lec7": ["Managing Data Consistency and Concurrency", "Introduction to Concurrency Control", "Locking Mechanism", "Lock Modes", "Locking Behavior of Readers and Writers", "Oracle Database Locks", "Lock Conflicts", "Deadlocks", "Deadlock Examples"],
    "lec8": ["Backup and Recovery Concepts", "DBA Responsibilities", "Categories of Failures", "Statement Failures", "User Process Failures", "Network Failures", "User Error Failures", "Instance Failures", "Instance Recovery", "Media Failures", "Configuring for Recoverability", "Control Files", "Redo Log Files", "Archive Log Files", "Archiver Process (ARCn)"],
    "lec9": ["High Availability and Disaster Recovery", "High Availability Concepts", "Disaster Recovery Concepts", "Disaster Recovery Terminology", "Disaster Recovery Options", "Significance of HA and DR", "Oracle Database HA Features", "Disaster Recovery Planning", "Oracle Database DR Strategies", "Challenges in Implementing HA and DR"],
    "lec10": ["Vector Search in Oracle Database", "Introduction to Vector Search", "Vector Data Type", "Vector Embedding", "Vector Embedding Models", "Similarity Search", "Applications of Vector Search", "Challenges in Vector Search", "Future Trends in Vector Search"]
  },
  "DeepLearning": {
    "lec1": ["Introduction to Deep Learning", "Module Overview", "Learning Outcomes", "Bloom\u2019s Taxonomy", "Assessment Structure", "What is Deep Learning?", "Artificial Neural Networks (ANN)", "Biological vs Artificial Neurons", "Multi-Layer Perceptron (MLP)", "Why Deep Learning?", "ImageNet Competition", "Applications of Deep Learning", "Supervised Learning", "Unsupervised Learning", "Reinforcement Learning", "Deep Learning in Computer Vision", "Object Detection", "Image Classification", "Semantic Segmentation", "Deep Learning in Audio Processing", "Speech Recognition", "Audio Classification", "Deep Learning in NLP", "Text Classification", "Sentiment Analysis", "Machine Translation", "Sequence Learning", "Examples of Sequential Data", "Recurrent Neural Networks (RNNs)", "LSTM Overview", "Generative Learning", "Generative Adversarial Networks (GANs)", "Fake Image Generation", "GPT and Transformers", "Graph Neural Networks (GNNs)", "Challenges in Deep Learning", "Ethical Issues and Bias", "Adversarial Attacks", "When Not to Use Deep Learning", "Background Knowledge Requirements", "Learning Resources"],
    "lec2": ["Artificial Neural Networks (ANN)", "Forward Propagation", "Weighted Sum and Bias", "Activation Functions", "Step Function", "Sigmoid Function", "ReLU", "Tanh", "Training a Neural Network", "Loss Function", "Gradient Descent", "Backpropagation", "Chain Rule", "Weight Updates", "Error Calculation", "Optimization Techniques", "Regularization", "Overfitting and Underfitting", "Introduction to CNNs", "Feature Extraction", "Pooling Layers", "Image Processing with CNNs", "Transfer Learning", "Image Augmentation", "Introduction to RNNs", "Sequence Modeling", "LSTM Networks", "Vanishing Gradient Problem", "Applications of RNNs", "Autoencoders", "Encoding and Decoding", "Denoising Autoencoders", "Variational Autoencoders (VAE)", "Reinforcement Learning Basics", "Markov Decision Process (MDP)", "Q-Learning", "Deep Q Networks (DQN)", "Policy Gradient Methods", "Actor-Critic Models"],
    "lec3": ["Backpropagation Fundamentals", "Mathematics for Deep Learning", "Forward and Backward Pass", "Chain Rule", "Loss Functions", "Classification Loss Functions", "Regression Loss Functions", "Loss vs Optimization Functions", "Gradient Descent", "Stochastic Gradient Descent (SGD)", "Mini-batch Gradient Descent", "Optimization Algorithms", "Momentum", "AdaGrad", "AdaDelta", "Adam", "AdamW", "Nadam", "AMSGrad", "Lookahead Optimizer", "Regularization Techniques", "L1 Regularization", "L2 Regularization", "Bias-Variance Tradeoff", "Overfitting and Underfitting", "Model Generalization", "Basics of Machine Learning", "Training vs Testing Data", "Hyperparameter Tuning"],
    "lec4": ["Convolutional Neural Networks (CNNs)", "Image Representation in Computers", "Scalars, Vectors, and Matrices", "Convolution Operation", "Filters and Feature Maps", "Stride and Padding", "ReLU Activation Function", "Pooling Techniques", "Max Pooling", "Average Pooling", "Preventing Overfitting in CNNs", "Data Augmentation", "Dropout Regularization", "Pretrained Models", "Transfer Learning", "Feature Extraction", "Fine-Tuning Pretrained Models", "CNN Architectures Overview", "Image Classification", "Object Detection", "CNN Applications", "CNN Performance Optimization", "Practical CNN Implementations"],
    "lec5": ["Convolutional Neural Networks (CNNs) \u2013 Advanced", "Review of CNN Concepts", "Convolution Operation", "Filters and Feature Maps", "Pooling Layers", "Max Pooling", "Average Pooling", "Padding and Stride", "CNN Architectures", "LeNet-5", "AlexNet", "VGGNet", "ResNet", "Loss Functions in CNNs", "Categorical Cross Entropy", "Binary Cross Entropy", "Dice Loss", "Focal Loss", "Sparse Categorical Cross Entropy", "Transfer Learning", "Pretrained Models", "Fine-Tuning", "Feature Extraction", "Data Augmentation", "Image Augmentation Techniques", "Practical CNN Exercises"],
    "lec6": ["Recurrent Neural Networks (RNNs)", "Sequential vs Non-Sequential Data", "Types of Sequential Data", "Time Series Data", "Text and Speech Data", "Spatiotemporal Data", "RNN Architecture", "Hidden State Representation", "Unrolling in Time", "Forward Propagation in RNNs", "Weight Sharing", "Backpropagation Through Time (BPTT)", "Limitations of RNNs", "Vanishing Gradient Problem", "Exploding Gradient Problem", "Long Short-Term Memory (LSTM)", "LSTM Architecture", "Forget Gate", "Input Gate", "Output Gate", "Cell State", "LSTM Working Mechanism", "Advantages of LSTM", "Disadvantages of LSTM", "Applications of RNNs and LSTMs"],
    "lec7": ["Graph Neural Networks (GNNs)", "Graph Representation", "Node-Level Tasks", "Edge-Level Tasks", "Graph-Level Tasks", "Basic Graph Theory Concepts", "Directed and Undirected Graphs", "Graph Representations (Matrix Form)", "Representational Learning", "Graph Neural Network Architecture", "Permutation Invariance", "Permutation Equivariance", "Message Passing Neural Networks (MPNN)", "Aggregation Functions", "Graph Convolutional Networks (GCN)", "GraphSAGE", "Graph Attention Networks (GAT)", "Over-Smoothing Problem", "GNN Training Pipeline", "Transductive vs Inductive Learning", "Applications of GNNs"],
    "lec8": ["Autoencoders", "Representational Learning", "Feature Representation", "Encoding and Decoding", "Latent Space Representation", "Reconstruction Loss", "Dimensionality Reduction", "Supervised vs Semi-Supervised Learning", "Autoencoder Architecture", "Encoder Network", "Decoder Network", "Reconstruction Process", "Loss Functions in Autoencoders", "Denoising Autoencoders", "Image Denoising", "Image Inpainting", "Information Compression", "Latent Variable Representation", "Regularization in Autoencoders", "Overfitting and Generalization", "Variational Autoencoders (VAE)", "Probabilistic Latent Space", "Reparameterization Trick", "Generative Capability of VAEs", "KL Divergence", "Applications of Autoencoders"],
    "lec9": ["Introduction to Reinforcement Learning", "Why Reinforcement Learning", "Types of Machine Learning", "Supervised Learning", "Unsupervised Learning", "Reinforcement Learning Basics", "Agent and Environment", "State, Action, Reward", "Policy and Value Function", "Markov Decision Process (MDP)", "State Transitions", "Transition Probabilities", "Rewards and Policies", "Model-Based vs Model-Free Learning", "Dynamic Programming", "Value Iteration", "Policy Iteration", "Grid World Example", "Exploration vs Exploitation", "On-Policy vs Off-Policy Learning", "Q-Learning", "SARSA", "Delayed Rewards", "Challenges in Reinforcement Learning", "Limitations of RL", "Reinforcement Learning Applications"],
    "lec10": ["Deep Reinforcement Learning", "Value Function Approximation", "Deep Q-Networks (DQN)", "Q-Learning with Neural Networks", "Experience Replay", "Target Networks", "Deep RL vs Traditional RL", "Policy Gradient Methods", "Actor-Critic Methods", "Trust Region Policy Optimization (TRPO)", "Proximal Policy Optimization (PPO)", "Advantages of Policy Gradient Methods", "Continuous Action Spaces", "Combining Neural Networks with RL", "Applications of Deep Reinforcement Learning", "Game Playing Agents", "Robotics and Control", "Self-Driving Systems", "Challenges in Deep RL", "Exploration vs Exploitation in Deep RL", "Sample Efficiency", "Stability Issues"]
  }
}

# ── ML Models ──────────────────────────────────────────────────────────────
_BASE_DIR = Path(__file__).parent.parent          # points to backend/
_PROJECT_ROOT = _BASE_DIR.parent                  # points to the workspace root
_label_encoder = None
_student_level_model = None

try:
    _label_encoder_path = _BASE_DIR / "models" / "label_encoder.pkl"
    _student_model_path = _BASE_DIR / "models" / "student_level_model.pkl"
    _classifier_path = _BASE_DIR / "models" / "level_classifier.pkl"
    
    # Fallback search in root models folder
    if not _label_encoder_path.exists():
        _label_encoder_path = _PROJECT_ROOT / "models" / "label_encoder.pkl"
    if not _student_model_path.exists():
        _student_model_path = _PROJECT_ROOT / "models" / "student_level_model.pkl"
    if not _classifier_path.exists():
        _classifier_path = _PROJECT_ROOT / "models" / "level_classifier.pkl"
    
    # Use level_classifier.pkl if student_level_model.pkl is missing
    final_model_path = _student_model_path if _student_model_path.exists() else _classifier_path

    if _label_encoder_path.exists() and final_model_path.exists():
        _label_encoder = joblib.load(_label_encoder_path)
        _student_level_model = joblib.load(final_model_path)
        print(f"✅ ML Models loaded successfully from: {_label_encoder_path.parent}")
        print(f"   Model used: {final_model_path.name}")
    else:
        print(f"⚠️ ML Model files missing. Expected level prediction model and label encoder.")
except Exception as e:
    print(f"❌ Error loading ML models: {e}. predict-level endpoint will use dummy logic.")


# ── Internal Helpers ────────────────────────────────────────────────────────
def _normalize_module_name(module: str) -> str:
    """Helper to find the correct module name even if the frontend sends it without spaces."""
    target_norm = str(module).replace(" ", "").lower()
    
    # First check MongoDB if available
    if lecture_collection is not None:
        try:
            db_modules = lecture_collection.distinct("module")
            for db_m in db_modules:
                if str(db_m).replace(" ", "").lower() == target_norm:
                    return str(db_m)
        except Exception as e:
            print(f"⚠️ Normalization via DB failed: {e}")
            
    # Fallback to local keys
    for key in _MODULE_TOPICS_FALLBACK.keys():
        if key.replace(" ", "").lower() == target_norm:
            return key
            
    return module

def _load_local_content(subject_id: str) -> Optional[str]:
    """Loads text from data/extracted_text_{id}.json or data/extracted_text.json"""
    # Check both backend/data and root data/
    paths = [
        _PROJECT_ROOT / "data" / f"extracted_text_{subject_id}.json",
        _BASE_DIR / "data" / f"extracted_text_{subject_id}.json",
        _PROJECT_ROOT / "data" / "extracted_text.json", # user's open file
        _BASE_DIR / "data" / "extracted_text.json"
    ]
    
    for path in paths:
        if path.exists():
            try:
                import json
                with open(path, "r", encoding="utf-8") as f:
                    pages = json.load(f)
                content_parts = []
                for p in pages:
                    if isinstance(p, dict):
                        content_parts.append(p.get("content") or p.get("output") or "")
                    else:
                        content_parts.append(str(p))
                return "\n\n".join([c for c in content_parts if c.strip()])
            except:
                continue
    return None

def _get_topic_content(module: str, lecture: str, topic: str) -> Optional[str]:
    # 1. Try MongoDB
    if lecture_collection is not None:
        try:
            query_module = _normalize_module_name(module)
            data = lecture_collection.find_one({"module": query_module, "lecture": lecture})
            if data:
                db_content = next(
                    (t["content"] for t in data["topics"] if t["topic_name"].strip() == topic.strip()),
                    None,
                )
                if db_content:
                    return db_content
        except Exception as e:
            print(f"⚠️ get_topic_content DB error: {e}")
    
    # 2. Try Fallback
    subject_id = _SUBJECT_MAP.get(module, "dl") # default to dl if unknown
    return _load_local_content(subject_id)


# ── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/predict-level")
def predict_level(score: int, time_taken: int, attempts: int):
    # Fallback if models are missing
    if _student_level_model is None or _label_encoder is None:
        prediction = "Intermediate" if score >= 3 else "Beginner"
        if score == 5: prediction = "Advanced"
        return {"predicted_level": prediction, "confidence": round(score / 5, 2), "note": "Dummy logic used (models missing)"}

    input_data = np.array([[score, time_taken, attempts]])
    prediction_encoded = _student_level_model.predict(input_data)[0]
    prediction = _label_encoder.inverse_transform([prediction_encoded])[0]
    confidence = round(score / 5, 2)
    return {"predicted_level": prediction, "confidence": confidence}


@router.get("/modules")
def get_modules():
    # Attempt to get from DB first
    if lecture_collection is not None:
        try:
            modules = lecture_collection.distinct("module")
            if modules:
                return {"modules": modules}
        except Exception as e:
            print(f"⚠️ get_modules DB error: {e}")
            
    # Fallback to the structure provided by user
    return {"modules": list(_MODULE_TOPICS_FALLBACK.keys())}


@router.get("/lectures/{module}")
def get_lectures(module: str):
    module_query = _normalize_module_name(module)
    
    # Attempt to get from DB first
    if lecture_collection is not None:
        try:
            lectures = lecture_collection.distinct("lecture", {"module": module_query})
            if lectures:
                return {"lectures": lectures}
        except Exception as e:
            print(f"⚠️ get_lectures error: {e}")
            
    # Fallback to local structure
    module_data = _MODULE_TOPICS_FALLBACK.get(module_query)
    if module_data:
        return {"lectures": list(module_data.keys())}
        
    return {"lectures": ["Core Course Content"]}


@router.get("/topics/{module}/{lecture}")
def get_topics(module: str, lecture: str):
    module_query = _normalize_module_name(module)
    
    # Attempt to get from DB first
    if lecture_collection is not None:
        try:
            doc = lecture_collection.find_one(
                {"module": module_query, "lecture": lecture},
                {"_id": 0, "topics.topic_name": 1},
            )
            if doc and "topics" in doc:
                return {"topics": [t["topic_name"] for t in doc["topics"]]}
        except Exception as e:
            print(f"⚠️ get_topics error: {e}")
            
    # Fallback to local structure
    module_data = _MODULE_TOPICS_FALLBACK.get(module_query)
    if module_data and lecture in module_data:
        return {"topics": module_data[lecture]}
        
    return {"topics": ["Comprehensive Overview", "Key Concepts & Principles", "Practical Applications"]}


@router.get("/generate-mcq/{module}/{lecture}/{topic}")
async def generate_mcq(module: str, lecture: str, topic: str, user_level: str = "Intermediate"):
    try:
        # Check cache first (MongoDB only)
        if mcq_collection is not None:
            existing = mcq_collection.find_one({
                "module": module, "lecture": lecture,
                "topic": topic, "user_level": user_level,
            })
            if existing:
                mcqs_data = existing["mcqs"]
                if isinstance(mcqs_data, dict):
                    for val in mcqs_data.values():
                        if isinstance(val, list):
                            mcqs_data = val
                            break
                return {"source": "database", "mcqs": mcqs_data}

        topic_content = _get_topic_content(module, lecture, topic)
        if topic_content is None:
            return {"error": f"Content not found for module {module}. Make sure data/extracted_text_{_SUBJECT_MAP.get(module, 'dl')}.json exists."}

        print(f"\n--- GEMINI MCQ GENERATOR TRIGGERED ---")
        print(f"Topic: {topic} | Level: {user_level} | Content: {len(topic_content)} chars")

        mcqs = await generate_mcqs(topic_content, num_questions=5, user_level=user_level)

        if isinstance(mcqs, dict) and "error" in mcqs:
            return mcqs

        if mcq_collection is not None:
            try:
                mcq_collection.insert_one({
                    "module": module, "lecture": lecture,
                    "topic": topic, "user_level": user_level, "mcqs": mcqs,
                })
            except Exception as e:
                print(f"⚠️ Cache save failed: {e}")

        return {"source": "gemini", "mcqs": mcqs}
    except Exception as e:
        print(f"❌ CRITICAL ERROR in /generate-mcq: {e}")
        return {"error": str(e)}


@router.get("/generate-summary/{module}/{lecture}/{topic}")
async def get_summary(module: str, lecture: str, topic: str, user_level: str = "Intermediate"):
    # Use cache to load the saved summary instantly without regenerating
    if summary_collection is not None:
        cached = summary_collection.find_one({
            "module": module, "lecture": lecture,
            "topic": topic, "user_level": user_level,
        })
        if cached:
            # Auto-cleanup: If the cached summary contains old HTML formatting, delete it to force a fresh Markdown generation
            if "<p>" in cached["summary"] or "<b>" in cached["summary"]:
                print("DEBUG: Found old HTML summary in cache. Deleting ALL duplicates to regenerate Markdown.")
                summary_collection.delete_many({"module": module, "lecture": lecture, "topic": topic, "user_level": user_level})
            else:
                return cached["summary"]

    content = _get_topic_content(module, lecture, topic)
    if not content:
        return {"error": "Content not found"}

    summary = await generate_summary(module, lecture, topic, user_level, content)
    
    if "error" not in summary and summary_collection is not None:
        summary_collection.update_one(
            {
                "module": module, "lecture": lecture,
                "topic": topic, "user_level": user_level
            },
            {
                "$set": {"summary": summary}
            },
            upsert=True
        )
    return summary


@router.get("/generate-mindmap/{module}/{lecture}/{topic}")
async def get_mindmap(module: str, lecture: str, topic: str, user_level: str = "Intermediate"):
    if mindmap_collection is not None:
        cached = mindmap_collection.find_one({
            "module": module, "lecture": lecture,
            "topic": topic, "user_level": user_level,
        })
        if cached:
            return cached["mindmap"]

    content = _get_topic_content(module, lecture, topic)
    if not content:
        return {"error": "Content not found"}

    mindmap = await generate_mindmap(content, user_level)
    
    if "error" not in mindmap and mindmap_collection is not None:
        mindmap_collection.insert_one({
            "module": module, "lecture": lecture,
            "topic": topic, "user_level": user_level, "mindmap": mindmap,
        })
    return mindmap


@router.get("/generate-flashcards/{module}/{lecture}/{topic}")
async def get_flashcards(module: str, lecture: str, topic: str, user_level: str = "Intermediate"):
    if flashcard_collection is not None:
        cached = flashcard_collection.find_one({
            "module": module, "lecture": lecture,
            "topic": topic, "user_level": user_level,
        })
        if cached:
            return cached["flashcards"]

    content = _get_topic_content(module, lecture, topic)
    if not content:
        return {"error": "Content not found"}

    flashcards = await generate_flashcards(topic, content, user_level)

    # Normalise dict responses into a list
    if isinstance(flashcards, dict):
        if "error" in flashcards:
            pass
        elif "front" in flashcards and "back" in flashcards:
            flashcards = [flashcards]
        else:
            for val in flashcards.values():
                if isinstance(val, list):
                    flashcards = val
                    break

    if not isinstance(flashcards, list) and not (isinstance(flashcards, dict) and "error" in flashcards):
        flashcards = [{"front": "Concepts", "back": str(flashcards)}]

    if isinstance(flashcards, list) and flashcard_collection is not None:
        flashcard_collection.insert_one({
            "module": module, "lecture": lecture,
            "topic": topic, "user_level": user_level, "flashcards": flashcards,
        })
    return flashcards


@router.post("/submit-audio")
async def submit_audio(
    audio: UploadFile = File(...),
    expected_answer: str = Form(...),
    correct_option_key: str = Form(...),
):
    # Unique filename for stability
    unique_id = str(uuid.uuid4())[:8]
    temp_file_path = f"temp_voice_{unique_id}.webm"
    
    content = await audio.read()
    with open(temp_file_path, "wb") as buffer:
        buffer.write(content)
    
    file_size = os.path.getsize(temp_file_path)
    print(f"DEBUG: Saved temp audio file: {temp_file_path} ({file_size} bytes)")

    # --- VALIDATION: Check if audio file is virtually empty ---
    if file_size < 1000:
        print("DEBUG: Audio file too small, aborting processing.")
        os.remove(temp_file_path)
        return {"transcription": "", "is_correct": False, "error": True, "message": "Audio file is empty or too short"}

    # 1. Clean up expected_answer for a better hint prompt (keywords only)
    clean_prompt = "".join([c if c.isalnum() or c.isspace() else " " for c in expected_answer])
    keywords = " ".join(set(clean_prompt.split()))
    
    # 2. Transcribe
    print(f"DEBUG: Processing audio for expected: {expected_answer}")
    transcription = transcribe_audio(temp_file_path, prompt=keywords)
    print(f"DEBUG: Transcription result: '{transcription}'")

    if os.path.exists(temp_file_path):
        os.remove(temp_file_path)

    is_correct = False
    
    # Matching logic
    t_lower = transcription.lower().strip()
    e_lower = expected_answer.lower().strip()
    target_key = correct_option_key.lower().strip()

    import re
    t_clean = re.sub(r'[^\w\s]', ' ', t_lower)
    e_clean = re.sub(r'[^\w\s]', ' ', e_lower)

    # 1. Strict substring match
    if e_clean and e_clean in t_clean:
        is_correct = True
    elif e_lower and e_lower in t_lower:
        is_correct = True

    # 2. Option key match (e.g. "it is B")
    words = t_clean.split()
    if target_key in words or f"option {target_key}" in t_clean:
        is_correct = True

    # 3. Fuzzy matching for slight transcription errors
    if not is_correct and e_clean:
        # Check partial ratio (is the answer *contained* as a fuzzy piece?)
        partial_sim = fuzz.partial_ratio(e_clean, t_clean)
        # Check token set ratio (handles missing/extra words in the middle much better)
        token_sim = fuzz.token_set_ratio(e_clean, t_clean)
        
        best_sim = max(partial_sim, token_sim)
        print(f"DEBUG: Fuzzy similarity score: partial={partial_sim}, token={token_sim}, best={best_sim}")
        
        if best_sim >= 80:  # Lowered slightly to be more forgiving
            is_correct = True

    print(f"DEBUG: Final is_correct={is_correct}")
    return {"transcription": transcription, "is_correct": is_correct, "expected": expected_answer}


@router.post("/generate-feedback/{module}/{lecture}/{topic}")
async def get_feedback(module: str, lecture: str, topic: str, quiz_results: list = Body(...)):
    topic_content = _get_topic_content(module, lecture, topic) or ""
    
    # Check cache first for this exact quiz configuration
    # (Since this is personalized to the user's score, we save it with the score hash if possible)
    # For now, we'll generate and save standard feedback per session
    feedback = await generate_feedback(topic_content, quiz_results)
    
    if "error" not in feedback and feedback_collection is not None:
        try:
            feedback_collection.insert_one({
                "module": module,
                "lecture": lecture,
                "topic": topic,
                "quiz_stats": {
                    "total": len(quiz_results),
                    "correct": sum(1 for r in quiz_results if r.get('is_correct'))
                },
                "feedback": feedback
            })
        except Exception as e:
            print(f"⚠️ Cache save failed for feedback: {e}")
            
    return feedback


@router.get("/generate-study-plan/{module}/{lecture}/{topic}")
async def get_study_plan(module: str, lecture: str, topic: str, user_level: str = "Intermediate"):
    if study_plan_collection is not None:
        cached = study_plan_collection.find_one({
            "module": module, "lecture": lecture,
            "topic": topic, "user_level": user_level,
        })
        if cached:
            return cached["study_plan"]

    content = _get_topic_content(module, lecture, topic)
    if not content:
        return {"error": "Content not found"}

    study_plan = await generate_study_plan(module, lecture, topic, user_level, content)
    
    if "error" not in study_plan and study_plan_collection is not None:
        study_plan_collection.insert_one({
            "module": module, "lecture": lecture,
            "topic": topic, "user_level": user_level, "study_plan": study_plan,
        })
    return study_plan
