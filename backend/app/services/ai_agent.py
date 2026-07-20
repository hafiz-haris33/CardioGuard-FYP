import os
import json
import smtplib
import base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from typing import TypedDict, List, Dict, Any
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

# LangGraph Imports
from langgraph.graph import StateGraph, END

# Import PDF Generator taake Agent khud PDF bana sake
from app.services.pdf_generator import generate_pdf_base64

load_dotenv()

# ==========================================
# 1. DATA STRUCTURES & LLM SETUP
# ==========================================

class PredictionOutput(BaseModel):
    risk_score_percentage: int = Field(description="Calculated cardiac risk percentage from 0 to 100")
    risk_level: str = Field(description="Strictly one of: 'Low', 'Moderate', 'High', 'Critical'")
    clinical_summary: str = Field(description="A 2-3 sentence clinical analysis of the patient's data")
    recommendations: list[str] = Field(description="Top 3 actionable health recommendations")

class AgentState(TypedDict):
    user_profile: Dict[str, Any]
    recent_events: List[Dict[str, Any]]
    total_events_count: int
    prediction_output: Dict[str, Any]
    pdf_base64: str 
    alert_sent: bool
    alert_reason: str # Naya variable taake reason pass ho sake

llm = ChatGroq(
    groq_api_key=os.getenv("GROQ_API_KEY"),
    model_name="llama-3.3-70b-versatile",
    temperature=0.1
)

structured_llm = llm.with_structured_output(PredictionOutput)

# ==========================================
# 2. LANGGRAPH NODES
# ==========================================

def preprocess_data_node(state: AgentState):
    events = state.get("recent_events", [])
    return {"total_events_count": len(events), "alert_sent": False}

def clinical_analysis_node(state: AgentState):
    user_profile = state.get("user_profile", {})
    recent_events = state.get("recent_events", [])
    
    system_prompt = """You are the CardioGuard AI, an expert clinical cardiologist agent.
Your primary function is to analyze patient vitals and identify potential cardiac anomalies based on provided sensor data.

STRICT RULES:
1. You must ONLY use the provided User Profile and Recent Events data. 
2. Calculate the 'risk_score_percentage' (0-100) based on the frequency and severity of the recent events. 
3. Categorize 'risk_level' strictly as: 'Low' (0-20), 'Moderate' (21-50), 'High' (51-80), or 'Critical' (81-100).
4. Provide a professional, concise 'clinical_summary'.
5. Provide 3 actionable 'recommendations' for the patient.

USER PROFILE:
{user_profile}

RECENT DANGEROUS EVENTS:
{recent_events}"""

    prompt_template = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "Generate the cardiac risk assessment report.")
    ])

    chain = prompt_template | structured_llm

    try:
        response = chain.invoke({
            "user_profile": json.dumps(user_profile),
            "recent_events": json.dumps(recent_events)
        })
        return {"prediction_output": response.dict()}
    except Exception as e:
        print(f"AI Generation Error: {e}")
        fallback = {
            "risk_score_percentage": 0, "risk_level": "Unknown",
            "clinical_summary": "Error generating AI analysis.", "recommendations": ["Consult a doctor."]
        }
        return {"prediction_output": fallback}

def generate_pdf_node(state: AgentState):
    """
    Node 3: Hamesha PDF generate karega taake app mein show ho, aur emergency ho to attach ho sake.
    """
    pdf_b64 = generate_pdf_base64(
        state["user_profile"], 
        state["prediction_output"], 
        state["total_events_count"]
    )
    return {"pdf_base64": pdf_b64}

def emergency_alert_node(state: AgentState):
    user_profile = state["user_profile"]
    prediction = state["prediction_output"]
    pdf_b64 = state["pdf_base64"]
    reason = state.get("alert_reason", "Medical Emergency") # App se aane wala reason

    patient_name = user_profile.get("full_name", "Patient")
    emergency_email = os.getenv("DEMO_EMERGENCY_EMAIL", user_profile.get("emergency_contact"))
    sender_email = os.getenv("SMTP_EMAIL")
    sender_password = os.getenv("SMTP_PASSWORD")

    if emergency_email and sender_email and sender_password:
        try:
            msg = MIMEMultipart()
            msg['From'] = f"CardioGuard AI <{sender_email}>"
            msg['To'] = emergency_email
            # Subject mein clear reason likha hoga (e.g., SUDDEN FALL)
            msg['Subject'] = f"🚨 URGENT: {reason.replace('_', ' ')} detected for {patient_name}"

            body = f"""URGENT MEDICAL ALERT

ALERT TYPE: {reason.replace('_', ' ')}
Patient Name: {patient_name}

CardioGuard AI has flagged a {prediction['risk_level'].upper()} risk level based on recent events.

Clinical Summary:
{prediction['clinical_summary']}

Please check on the patient immediately. A detailed medical PDF report is attached to this email.

- CardioGuard Emergency System"""
            
            msg.attach(MIMEText(body, 'plain'))

            # PDF attachment process
            pdf_data = base64.b64decode(pdf_b64)
            part = MIMEBase('application', 'octet-stream')
            part.set_payload(pdf_data)
            encoders.encode_base64(part)
            part.add_header('Content-Disposition', f'attachment; filename="CardioGuard_Report_{patient_name.replace(" ", "_")}.pdf"')
            msg.attach(part)

            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(msg)
            server.quit()
            
            print(f"✅ Emergency Alert Sent to {emergency_email}")
            return {"alert_sent": True}
            
        except Exception as e:
            print(f"❌ Failed to send emergency email: {e}")
            
    return {"alert_sent": False}

# ==========================================
# CONDITIONAL EDGE LOGIC
# ==========================================
def route_based_on_risk(state: AgentState):
    risk = state["prediction_output"].get("risk_level", "Low")
    if risk in ["High", "Critical"]:
        return "emergency_alert"
    return END

# ==========================================
# 3. BUILD AND COMPILE THE LANGGRAPH
# ==========================================

workflow = StateGraph(AgentState)

workflow.add_node("preprocess", preprocess_data_node)
workflow.add_node("clinical_analysis", clinical_analysis_node)
workflow.add_node("generate_pdf", generate_pdf_node)
workflow.add_node("emergency_alert", emergency_alert_node)

workflow.set_entry_point("preprocess")
workflow.add_edge("preprocess", "clinical_analysis")
workflow.add_edge("clinical_analysis", "generate_pdf")

# The Magic Conditional Edge
workflow.add_conditional_edges(
    "generate_pdf", 
    route_based_on_risk, 
    {
        "emergency_alert": "emergency_alert",
        END: END
    }
)
workflow.add_edge("emergency_alert", END)

cardio_ai_app = workflow.compile()

# ==========================================
# 4. EXPORT FUNCTION
# ==========================================

def generate_ai_prediction(user_profile: dict, recent_events: list[dict], alert_reason: str = "Medical Alert") -> dict:
    initial_state = {
        "user_profile": user_profile,
        "recent_events": recent_events,
        "total_events_count": 0,
        "prediction_output": {},
        "pdf_base64": "",
        "alert_sent": False,
        "alert_reason": alert_reason # Naya variable pass kar diya
    }
    
    final_state = cardio_ai_app.invoke(initial_state)
    
    return {
        "prediction_output": final_state["prediction_output"],
        "pdf_base64": final_state["pdf_base64"],
        "alert_sent": final_state["alert_sent"]
    }